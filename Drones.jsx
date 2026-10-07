import { useState } from 'react';
import Badge from '../components/Badge';
import SqlBar from '../components/SqlBar';

const initial = [
  { id: 'D001', model: 'Falcon-X Heavy Lift', maker: 'AeroTech', payload: 25, battery: 85, flight: 45, status: 'READY' },
  { id: 'D002', model: 'Hawk-S Thermal Survey', maker: 'SkyWorks', payload: 8, battery: 15, flight: 60, status: 'CHARGING' },
  { id: 'D003', model: 'Aeroliner Skybarge', maker: 'AeroDynamic', payload: 12, battery: 60, flight: 30, status: 'ACTIVE' },
  { id: 'D004', model: 'Condor Rescue Max', maker: 'AeroTech', payload: 20, battery: 72, flight: 50, status: 'ACTIVE' },
  { id: 'D005', model: 'Swift Medic', maker: 'SkyWorks', payload: 6, battery: 95, flight: 40, status: 'READY' },
  { id: 'D006', model: 'Ridge Scout', maker: 'AeroDynamic', payload: 4, battery: 10, flight: 25, status: 'MAINTENANCE' },
];

const tone = { READY: 'green', ACTIVE: 'amber', CHARGING: 'blue', MAINTENANCE: 'red' };
const filters = ['ALL', 'READY', 'ACTIVE', 'CHARGING', 'MAINTENANCE'];

export default function Drones() {
  const [rows, setRows] = useState(initial);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ model: '', maker: '', payload: '', status: 'READY' });

  const shown = rows.filter(
    (r) =>
      (filter === 'ALL' || r.status === filter) &&
      `${r.id} ${r.model} ${r.maker}`.toLowerCase().includes(q.toLowerCase())
  );

  const remove = (id) => {
    if (window.confirm(`Are you sure you want to delete Drone ${id}? This will execute a SQL DELETE operation.`)) {
      setRows(rows.filter((r) => r.id !== id));
    }
  };

  const edit = (r) => {
    const model = window.prompt('Edit drone model:', r.model);
    if (model) setRows(rows.map((x) => (x.id === r.id ? { ...x, model } : x)));
  };

  const add = (e) => {
    e.preventDefault();
    const id = 'D' + String(rows.length + 1).padStart(3, '0');
    setRows([
      ...rows,
      { id, model: form.model, maker: form.maker, payload: +form.payload || 0, battery: 100, flight: 40, status: form.status },
    ]);
    setForm({ model: '', maker: '', payload: '', status: 'READY' });
    setAdding(false);
  };

  const input = 'w-full bg-black/40 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-white/50';

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight">DRONE MANAGEMENT</h2>
          <p className="text-xs text-white/70">Real-time fleet database, telemetry tracking, and hardware deployment.</p>
        </div>
        <button onClick={() => setAdding(true)} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold">
          + Add Drone
        </button>
      </div>

      <SqlBar sql="SELECT * FROM DRONE WHERE 1=1 ORDER BY DroneID ASC;" />

      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-black/40 border border-white/15">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search Drone ID, Model, Manufacturer..."
          className="flex-1 min-w-[220px] bg-white/10 rounded-xl px-4 py-2 text-xs placeholder:text-white/60 focus:outline-none"
        />
        <div className="flex gap-1.5">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold border ${
                filter === f ? 'bg-white text-black border-white' : 'bg-white/5 border-white/20 text-white/80'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-3xl bg-black/40 border border-white/15 backdrop-blur-xl overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-white/10 text-left text-[10px] uppercase text-white/70">
            <tr>
              <th className="p-3">ID</th><th className="p-3">Model</th><th className="p-3">Manufacturer</th>
              <th className="p-3">Payload</th><th className="p-3">Battery</th><th className="p-3">Flight Time</th>
              <th className="p-3">Status</th><th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.id} className="border-t border-white/10">
                <td className="p-3 font-mono">{r.id}</td>
                <td className="p-3 font-semibold">{r.model}</td>
                <td className="p-3 text-white/80">{r.maker}</td>
                <td className="p-3">{r.payload} kg</td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-white/15 overflow-hidden">
                      <div
                        className={`h-full ${r.battery < 25 ? 'bg-red-400' : r.battery < 60 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                        style={{ width: `${r.battery}%` }}
                      />
                    </div>
                    <span className="font-mono text-[10px]">{r.battery}%</span>
                  </div>
                </td>
                <td className="p-3">{r.flight} min</td>
                <td className="p-3"><Badge tone={tone[r.status]}>{r.status}</Badge></td>
                <td className="p-3 text-right space-x-1.5">
                  <button onClick={() => edit(r)} className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20">✎</button>
                  <button onClick={() => remove(r.id)} className="px-2 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-300">🗑</button>
                </td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr><td colSpan="8" className="p-6 text-center text-white/60">No drones match.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {adding && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={add} className="bg-[#120b0a]/95 border border-white/20 rounded-3xl max-w-md w-full p-6 space-y-3">
            <h3 className="font-bold text-lg">Add Drone</h3>
            <input required className={input} placeholder="Model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
            <input required className={input} placeholder="Manufacturer" value={form.maker} onChange={(e) => setForm({ ...form, maker: e.target.value })} />
            <input className={input} type="number" placeholder="Payload (kg)" value={form.payload} onChange={(e) => setForm({ ...form, payload: e.target.value })} />
            <select className={input} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {filters.slice(1).map((s) => <option key={s}>{s}</option>)}
            </select>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setAdding(false)} className="w-1/2 py-2.5 rounded-xl bg-white/10 text-xs font-semibold">Cancel</button>
              <button type="submit" className="w-1/2 py-2.5 rounded-xl bg-[#262626] border border-white/25 text-xs font-bold">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}