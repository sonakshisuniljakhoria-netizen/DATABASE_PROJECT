import { useState } from 'react';
import Badge from '../components/Badge';
import SqlBar from '../components/SqlBar';

const initial = [
  { id: 'V001', name: 'Priya Natarajan', age: 29, priority: 'CRITICAL', status: 'WAITING', camp: 'Tambaram Relief Shelter', location: 'Velachery Flood Zone' },
  { id: 'V002', name: 'Mohammed Irfan', age: 45, priority: 'HIGH', status: 'RESCUED', camp: 'Anna Community Ground', location: 'T. Nagar Lowlands' },
  { id: 'V003', name: 'Lakshmi Devi', age: 67, priority: 'CRITICAL', status: 'EVACUATING', camp: 'North Riverbank Shelter', location: 'Adyar Riverside' },
  { id: 'V004', name: 'Arun Kumar', age: 34, priority: 'MEDIUM', status: 'RESCUED', camp: 'Coastal High School Camp', location: 'Ennore Coast' },
  { id: 'V005', name: 'Emergency Citizen', age: 30, priority: 'HIGH', status: 'RESCUED', camp: 'Valley Base Emergency Camp', location: 'Delhi' },
];

const prioTone = { CRITICAL: 'red', HIGH: 'amber', MEDIUM: 'cyan', LOW: 'green' };
const statuses = ['WAITING', 'EVACUATING', 'RESCUED'];
const select = 'bg-black/50 border border-white/20 rounded-lg px-2 py-1.5 text-[11px] text-white focus:outline-none';

export default function Victims() {
  const [rows, setRows] = useState(initial);
  const [q, setQ] = useState('');
  const [prio, setPrio] = useState('ALL');
  const [stat, setStat] = useState('ALL');

  const shown = rows.filter(
    (r) =>
      (prio === 'ALL' || r.priority === prio) &&
      (stat === 'ALL' || r.status === stat) &&
      `${r.id} ${r.name}`.toLowerCase().includes(q.toLowerCase())
  );

  const setStatus = (id, status) => setRows(rows.map((r) => (r.id === id ? { ...r, status } : r)));
  const remove = (id) => {
    if (window.confirm(`Delete victim ${id}? This will execute a SQL DELETE operation.`)) {
      setRows(rows.filter((r) => r.id !== id));
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-black tracking-tight">VICTIM RECORDS</h2>
        <p className="text-xs text-white/70">Emergency distress calls, priority triage, and evacuation shelter assignments.</p>
      </div>

      <SqlBar sql="SELECT v.*, c.CampName, c.Location AS CampLocation FROM VICTIM v LEFT JOIN RELIEF_CAMP c ON v.CampID = c.CampID ORDER BY v.VictimID;" />

      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-black/40 border border-white/15">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search Victim ID / Name..."
          className="flex-1 min-w-[200px] bg-white/10 rounded-xl px-4 py-2 text-xs placeholder:text-white/60 focus:outline-none"
        />
        <div className="flex items-center gap-2 text-[10px] text-white/70">
          Priority
          <select className={select} value={prio} onChange={(e) => setPrio(e.target.value)}>
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((o) => <option key={o}>{o}</option>)}
          </select>
          Status
          <select className={select} value={stat} onChange={(e) => setStat(e.target.value)}>
            {['ALL', ...statuses].map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
      </div>

      <div className="rounded-3xl bg-black/40 border border-white/15 backdrop-blur-xl overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-white/10 text-left text-[10px] uppercase text-white/70">
            <tr>
              <th className="p-3">ID</th><th className="p-3">Name</th><th className="p-3">Age</th>
              <th className="p-3">Priority</th><th className="p-3">Status</th><th className="p-3">Location</th>
              <th className="p-3">Assigned Camp</th><th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.id} className="border-t border-white/10">
                <td className="p-3 font-mono">{r.id}</td>
                <td className="p-3 font-semibold">{r.name}</td>
                <td className="p-3">{r.age}</td>
                <td className="p-3"><Badge tone={prioTone[r.priority]}>{r.priority}</Badge></td>
                <td className="p-3">
                  <select className={select} value={r.status} onChange={(e) => setStatus(r.id, e.target.value)}>
                    {statuses.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </td>
                <td className="p-3 text-white/80">{r.location}</td>
                <td className="p-3 text-amber-300 font-semibold">{r.camp}</td>
                <td className="p-3 text-right">
                  <button onClick={() => remove(r.id)} className="px-2 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-300">🗑</button>
                </td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr><td colSpan="8" className="p-6 text-center text-white/60">No victims match.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}