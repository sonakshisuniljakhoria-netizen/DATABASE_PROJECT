const express = require('express');
const oracledb = require('oracledb');
const cors = require('cors');

const app = express();

// Enable CORS so your frontend can communicate with this backend
app.use(cors());

// Parse incoming JSON payloads for INSERT and UPDATE operations
app.use(express.json()); 

// Oracle Database connection credentials
// Note: When deploying to the cloud, ensure your host/connectionString 
// points to a cloud-accessible database rather than 'localhost'.
const dbConfig = {
    user: process.env.DB_USER || "drone_relief",
    password: process.env.DB_PASSWORD || "drone123",
    connectString: process.env.DB_CONNECTION_STRING || "localhost:1521/XEPDB1"
};

// =========================================================
// 1. DISPLAY: Fetch current capacity from Camp_Occupancy_View
// =========================================================
app.get('/api/camps', async (req, res) => {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `SELECT * FROM Camp_Occupancy_View`, 
            [], 
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching camp data");
    } finally {
        if (connection) await connection.close();
    }
});

// =========================================================
// 2. SEARCH: Find drones by specific Status
// =========================================================
app.get('/api/drones/search', async (req, res) => {
    const { status } = req.query; 
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const sql = `SELECT DroneID, Model, BatteryLevel FROM Drone WHERE Status = :status`;
        const result = await connection.execute(
            sql, 
            [status], 
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error searching drones");
    } finally {
        if (connection) await connection.close();
    }
});

// =========================================================
// 3. INSERT: Register a newly found victim
// =========================================================
app.post('/api/victims', async (req, res) => {
    const { name, dob, gender, priority, disasterId } = req.body;
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const sql = `INSERT INTO Victim (VictimName, DateOfBirth, Gender, MedicalPriority, CurrentStatus, DisasterID) 
                     VALUES (:1, TO_DATE(:2, 'YYYY-MM-DD'), :3, :4, 'Missing', :5)`;
        
        await connection.execute(
            sql, 
            [name, dob, gender, priority, disasterId], 
            { autoCommit: true }
        );
        res.status(201).json({ message: "Victim registered successfully." });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error inserting victim record");
    } finally {
        if (connection) await connection.close();
    }
});

// =========================================================
// 4. UPDATE: Recharge a drone and set to Available
// =========================================================
app.put('/api/drones/:id/recharge', async (req, res) => {
    const droneId = req.params.id;
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const sql = `UPDATE Drone SET BatteryLevel = 100, Status = 'Available' WHERE DroneID = :id`;
        
        const result = await connection.execute(
            sql, 
            [droneId], 
            { autoCommit: true }
        );
        res.json({ message: `${result.rowsAffected} drone(s) recharged.` });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating drone status");
    } finally {
        if (connection) await connection.close();
    }
});

// =========================================================
// 5. DELETE: Remove an outdated weather report
// =========================================================
app.delete('/api/weather/:id', async (req, res) => {
    const weatherId = req.params.id;
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const sql = `DELETE FROM Weather_Report WHERE WeatherID = :id`;
        
        const result = await connection.execute(
            sql, 
            [weatherId], 
            { autoCommit: true }
        );
        res.json({ message: `${result.rowsAffected} weather report(s) deleted.` });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error deleting weather report");
    } finally {
        if (connection) await connection.close();
    }
});

// Server Configuration & Startup
const PORT = process.env.PORT || 3000;

// Listen locally if not in production, but export app for deployment environments
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Drone Relief Database API is running on port ${PORT}`);
    });
}

module.exports = app;
