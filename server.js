require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const oracledb = require('oracledb');

// Rows come back as objects. Column aliases in the SQL are quoted ("droneId")
// so the JSON keys keep their camelCase spelling.
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

const app = express();
app.use(express.json());

const origins = (process.env.CORS_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean);
app.use(cors(origins.length ? { origin: origins } : undefined));

// ---------------------------------------------------------------------
// Database helpers
// ---------------------------------------------------------------------
async function initPool() {
  const cfg = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectString: process.env.DB_CONNECT,
    poolMin: 1,
    poolMax: 5,
    poolIncrement: 1,
  };
  if (process.env.DB_WALLET_DIR) {
    cfg.configDir = process.env.DB_WALLET_DIR;
    cfg.walletLocation = process.env.DB_WALLET_DIR;
    cfg.walletPassword = process.env.DB_WALLET_PASSWORD;
  }
  await oracledb.createPool(cfg);
}

// Run one statement on a pooled connection (auto-commits DML).
async function exec(sql, binds = {}, opts = {}) {
  let conn;
  try {
    conn = await oracledb.getConnection();
    return await conn.execute(sql, binds, { autoCommit: true, ...opts });
  } finally {
    if (conn) await conn.close();
  }
}

const rows = async (sql, binds) => (await exec(sql, binds)).rows;

// Tables whose primary key has no trigger/sequence get MAX+1.
async function nextId(table, col, start) {
  const r = await exec(`SELECT NVL(MAX(${col}), :base) + 1 AS "id" FROM ${table}`, { base: start });
  return r.rows[0].id;
}

function sendError(res, err) {
  console.error(err);
  const n = err.errorNum;
  const msg = (err.message || '').split('\n')[0];
  if (n === 2292) return res.status(409).json({ error: 'Cannot delete: other records depend on this one.' });
  if (n === 2291) return res.status(400).json({ error: 'Invalid reference: related record not found.' });
  if (n === 1) return res.status(409).json({ error: 'Duplicate record.' });
  if ([2290, 12899, 1400, 1438, 1722].includes(n)) return res.status(400).json({ error: `Invalid value. ${msg}` });
  if (n >= 20000 && n < 21000) return res.status(400).json({ error: msg.replace(/^ORA-\d+:\s*/, '') });
  res.status(500).json({ error: 'Database error. Check the server console.' });
}

// Express 4 does not catch async errors by itself.
const h = (fn) => (req, res) => fn(req, res).catch((e) => sendError(res, e));

const MISSION_STATUS = ['Planned', 'In Progress', 'Completed', 'Aborted'];
const VICTIM_STATUS = ['Missing', 'Rescued', 'In Camp', 'Hospitalized', 'Discharged'];
const PRIORITY = ['Low', 'Medium', 'High', 'Critical'];
const DRONE_STATUS = ['Available', 'On Mission', 'Under Maintenance'];

// ---------------------------------------------------------------------
// Health + dashboard stats
// ---------------------------------------------------------------------
app.get('/api/health', h(async (req, res) => {
  await rows(`SELECT 1 AS "ok" FROM DUAL`);
  res.json({ ok: true });
}));

app.get('/api/stats', h(async (req, res) => {
  const r = await rows(`
    SELECT
      (SELECT COUNT(*) FROM Drone)                                              AS "drones",
      (SELECT COUNT(*) FROM Drone WHERE Status = 'On Mission')                  AS "inFlight",
      (SELECT COUNT(*) FROM Mission)                                            AS "missions",
      (SELECT COUNT(*) FROM Mission WHERE MissionStatus = 'In Progress')        AS "activeMissions",
      (SELECT COUNT(*) FROM Victim)                                             AS "victims",
      (SELECT COUNT(*) FROM Victim WHERE CurrentStatus <> 'Missing')            AS "rescued",
      (SELECT COUNT(*) FROM Relief_Camp)                                        AS "camps",
      (SELECT COUNT(*) FROM Supply)                                             AS "supplies",
      (SELECT COUNT(*) FROM Operator)                                           AS "operators"
    FROM DUAL`);
  res.json(r[0]);
}));

// ---------------------------------------------------------------------
// DRONES
// ---------------------------------------------------------------------
const DRONE_SELECT = `
  SELECT d.DroneID AS "droneId", d.Model AS "model", m.Manufacturer AS "manufacturer",
         m.PayloadCapacity AS "payload", m.MaxFlightTime AS "maxFlightTime",
         d.BatteryLevel AS "battery", d.Status AS "status", d.OperatorID AS "operatorId"
  FROM   Drone d JOIN Drone_Model m ON d.Model = m.Model`;

app.get('/api/drones', h(async (req, res) => {
  res.json(await rows(`${DRONE_SELECT} ORDER BY d.DroneID`));
}));

// SEARCH: /api/drones/search?status=Available
app.get('/api/drones/search', h(async (req, res) => {
  res.json(await rows(`${DRONE_SELECT} WHERE d.Status = :status ORDER BY d.DroneID`, { status: req.query.status }));
}));

app.get('/api/drone-models', h(async (req, res) => {
  res.json(await rows(`SELECT Model AS "model", Manufacturer AS "manufacturer" FROM Drone_Model ORDER BY Model`));
}));

// INSERT
app.post('/api/drones', h(async (req, res) => {
  const { model, battery = 100, status = 'Available', operatorId = null } = req.body;
  if (!model) return res.status(400).json({ error: 'Model is required.' });
  if (!DRONE_STATUS.includes(status)) return res.status(400).json({ error: 'Invalid status.' });
  const id = await nextId('Drone', 'DroneID', 300);
  await exec(
    `INSERT INTO Drone (DroneID, Model, BatteryLevel, Status, OperatorID)
     VALUES (:id, :model, :battery, :status, :operatorId)`,
    { id, model, battery: Number(battery), status, operatorId: operatorId || null }
  );
  res.status(201).json({ droneId: id });
}));

// UPDATE: recharge
app.put('/api/drones/:id/recharge', h(async (req, res) => {
  const r = await exec(`UPDATE Drone SET BatteryLevel = 100, Status = 'Available' WHERE DroneID = :id`, { id: req.params.id });
  res.json({ message: `${r.rowsAffected} drone(s) recharged.` });
}));

// DELETE
app.delete('/api/drones/:id', h(async (req, res) => {
  const r = await exec(`DELETE FROM Drone WHERE DroneID = :id`, { id: req.params.id });
  res.json({ message: `${r.rowsAffected} drone(s) deleted.` });
}));

// ---------------------------------------------------------------------
// MISSIONS
// ---------------------------------------------------------------------
app.get('/api/missions', h(async (req, res) => {
  res.json(await rows(`
    SELECT m.MissionID AS "missionId", m.MissionType AS "type",
           TO_CHAR(m.MissionDate, 'YYYY-MM-DD') AS "date",
           m.Priority AS "priority", m.MissionStatus AS "status",
           d.DisasterName AS "disaster", m.DroneID AS "droneId", dr.Model AS "droneModel",
           o.FirstName || ' ' || o.LastName AS "operator"
    FROM   Mission m
    JOIN   Disaster d  ON m.DisasterID = d.DisasterID
    JOIN   Drone dr    ON m.DroneID    = dr.DroneID
    JOIN   Operator o  ON m.OperatorID = o.OperatorID
    ORDER  BY m.MissionDate DESC, m.MissionID DESC`));
}));

// UPDATE status (trigger trg_drone_on_mission syncs the drone's status)
app.put('/api/missions/:id/status', h(async (req, res) => {
  const { status } = req.body;
  if (!MISSION_STATUS.includes(status)) return res.status(400).json({ error: 'Invalid mission status.' });
  const r = await exec(`UPDATE Mission SET MissionStatus = :status WHERE MissionID = :id`, { status, id: req.params.id });
  if (!r.rowsAffected) return res.status(404).json({ error: 'Mission not found.' });
  res.json({ message: 'Mission updated.' });
}));

// ---------------------------------------------------------------------
// DISASTERS
// ---------------------------------------------------------------------
app.get('/api/disasters', h(async (req, res) => {
  res.json(await rows(`
    SELECT d.DisasterID AS "disasterId", d.DisasterName AS "name", d.Type AS "type",
           d.SeverityLevel AS "severity", d.Status AS "status", d.Description AS "description",
           l.AreaName AS "location",
           (SELECT COUNT(*) FROM Mission m WHERE m.DisasterID = d.DisasterID) AS "missions"
    FROM   Disaster d JOIN Location l ON d.LocationID = l.LocationID
    ORDER  BY CASE d.Status WHEN 'Active' THEN 0 ELSE 1 END, d.StartDate DESC`));
}));

// ---------------------------------------------------------------------
// VICTIMS
// ---------------------------------------------------------------------
app.get('/api/victims', h(async (req, res) => {
  res.json(await rows(`
    SELECT v.VictimID AS "victimId", v.VictimName AS "name",
           TRUNC(MONTHS_BETWEEN(SYSDATE, v.DateOfBirth) / 12) AS "age",
           v.Gender AS "gender", v.MedicalPriority AS "priority", v.CurrentStatus AS "status",
           v.CampID AS "campId", c.CampName AS "camp",
           dis.DisasterName AS "disaster", l.AreaName AS "location"
    FROM   Victim v
    LEFT   JOIN Relief_Camp c ON v.CampID = c.CampID
    JOIN   Disaster dis       ON v.DisasterID = dis.DisasterID
    JOIN   Location l         ON dis.LocationID = l.LocationID
    ORDER  BY v.VictimID`));
}));

// INSERT (VictimID comes from trigger trg_victim_id + seq_victim)
app.post('/api/victims', h(async (req, res) => {
  let { name, dob = null, gender = 'O', priority = 'High', disasterId, campId = null } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required.' });
  if (!PRIORITY.includes(priority)) return res.status(400).json({ error: 'Invalid priority.' });

  // SOS portal does not pick a disaster: use the most recent Active one.
  if (!disasterId) {
    const d = await rows(`SELECT DisasterID AS "id" FROM Disaster WHERE Status = 'Active'
                          ORDER BY StartDate DESC FETCH FIRST 1 ROWS ONLY`);
    if (!d.length) return res.status(400).json({ error: 'No active disaster to attach this victim to.' });
    disasterId = d[0].id;
  }

  const r = await exec(
    `INSERT INTO Victim (VictimName, DateOfBirth, Gender, MedicalPriority, CurrentStatus, DisasterID, CampID)
     VALUES (:name, TO_DATE(:dob, 'YYYY-MM-DD'), :gender, :priority, 'Missing', :disasterId, :campId)
     RETURNING VictimID INTO :id`,
    { name, dob, gender, priority, disasterId, campId,
      id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER } }
  );
  res.status(201).json({ victimId: r.outBinds.id[0] });
}));

// UPDATE status
app.put('/api/victims/:id/status', h(async (req, res) => {
  const { status } = req.body;
  if (!VICTIM_STATUS.includes(status)) return res.status(400).json({ error: 'Invalid victim status.' });
  const r = await exec(`UPDATE Victim SET CurrentStatus = :status WHERE VictimID = :id`, { status, id: req.params.id });
  if (!r.rowsAffected) return res.status(404).json({ error: 'Victim not found.' });
  res.json({ message: 'Victim updated.' });
}));

// DELETE
app.delete('/api/victims/:id', h(async (req, res) => {
  const r = await exec(`DELETE FROM Victim WHERE VictimID = :id`, { id: req.params.id });
  res.json({ message: `${r.rowsAffected} victim(s) deleted.` });
}));

// ---------------------------------------------------------------------
// RELIEF CAMPS (view Camp_Occupancy_View)
// ---------------------------------------------------------------------
app.get('/api/camps', h(async (req, res) => {
  res.json(await rows(`
    SELECT CampID AS "campId", CampName AS "name", Capacity AS "capacity",
           CurrentOccupancy AS "occupied", VacantSpace AS "vacant"
    FROM   Camp_Occupancy_View ORDER BY CampID`));
}));

// ---------------------------------------------------------------------
// SUPPLIES
// ---------------------------------------------------------------------
app.get('/api/supplies', h(async (req, res) => {
  res.json(await rows(`
    SELECT s.SupplyID AS "supplyId", s.SupplyType AS "item", s.QuantityAvailable AS "qty",
           s.CampID AS "campId", c.CampName AS "camp"
    FROM   Supply s LEFT JOIN Relief_Camp c ON s.CampID = c.CampID
    ORDER  BY s.QuantityAvailable`));
}));

app.post('/api/supplies', h(async (req, res) => {
  const { item, qty = 0, campId = null } = req.body;
  if (!item) return res.status(400).json({ error: 'Item name is required.' });
  const id = await nextId('Supply', 'SupplyID', 900);
  await exec(
    `INSERT INTO Supply (SupplyID, SupplyType, QuantityAvailable, CampID) VALUES (:id, :item, :qty, :campId)`,
    { id, item, qty: Number(qty), campId: campId || null }
  );
  res.status(201).json({ supplyId: id });
}));

// ---------------------------------------------------------------------
// OPERATORS / ORGANIZATIONS
// ---------------------------------------------------------------------
app.get('/api/operators', h(async (req, res) => {
  res.json(await rows(`
    SELECT o.OperatorID AS "operatorId", o.FirstName || ' ' || o.LastName AS "name",
           o.LicenseNo AS "license", g.OrganizationName AS "organization",
           (SELECT COUNT(*) FROM Drone d WHERE d.OperatorID = o.OperatorID) AS "drones"
    FROM   Operator o LEFT JOIN Organization g ON o.OrganizationID = g.OrganizationID
    ORDER  BY o.OperatorID`));
}));

app.get('/api/organizations', h(async (req, res) => {
  res.json(await rows(`
    SELECT OrganizationID AS "orgId", OrganizationName AS "name", Type AS "type", HeadOffice AS "headOffice"
    FROM   Organization ORDER BY OrganizationID`));
}));

// ---------------------------------------------------------------------
// WEATHER (DELETE demo)
// ---------------------------------------------------------------------
app.delete('/api/weather/:id', h(async (req, res) => {
  const r = await exec(`DELETE FROM Weather_Report WHERE WeatherID = :id`, { id: req.params.id });
  res.json({ message: `${r.rowsAffected} weather report(s) deleted.` });
}));

// ---------------------------------------------------------------------
// Optional: serve the built frontend (client/dist) from this same server.
// Lets you deploy everything as ONE service.
// ---------------------------------------------------------------------
const dist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^\/(?!api).*/, (req, res) => res.sendFile(path.join(dist, 'index.html')));
}

// ---------------------------------------------------------------------
const PORT = process.env.PORT || 3000;
initPool()
  .then(() => app.listen(PORT, () => console.log(`Drone Relief API running on port ${PORT}`)))
  .catch((err) => {
    console.error('Could not connect to Oracle:', err.message);
    process.exit(1);
  });

process.on('SIGINT', async () => {
  try { await oracledb.getPool().close(2); } catch { /* pool not created */ }
  process.exit(0);
});
