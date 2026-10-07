import { useState } from 'react';
import Badge from '../components/Badge';
import SqlBar from '../components/SqlBar';

const initial = [
  { id: 'M007', type: 'RESCUE', disaster: 'Wildfire - Accra Outskirts', drone: 'D004 (Condor Rescue Max)', operator: 'Kiran Patel', date: '2026-10-07', priority: 'CRITICAL', status: 'ACTIVE' },
  { id: 'M005', type: 'SURVEY', disaster: 'Wildfire - Sierra Forest', drone: 'D007 (Ridge Scout)', operator: 'Meera Nair', date: '2026-10-06', priority: 'HIGH', status: 'ACTIVE' },
  { id: 'M003', type: 'RESCUE', disaster: 'Flood - Chennai', drone: 'D004 (Condor Rescue Max)', operator: 'Arjun Das', date: '2026-10-05', priority: 'CRITICAL', status: 'ACTIVE' },
  { id: 'M002', type: 'RELIEF', disaster: 'Flood - Chennai', drone: 'D002 (Hawk-S Thermal)', operator: 'Kiran Patel', date: '2026-10-03', priority: 'MEDIUM', status: 'COMPLETED' },
  { id: 'M001', type: 'SURVEY', disaster: 'Landslide - Nilgiris', drone: 'D006 (Ridge Scout)', operator: 'Meera Nair', date: '2026-10-01', priority: 'MEDIUM', status: 'COMPLETED' },
];

const typeTone = { RESCUE: 'red', SURVEY: 'amber', RELIEF: 'blue' };
const prioTone = { CRITICAL: 'red', HIGH: 'amber', MEDIUM: 'cyan' };

export default function Missions() {
  const [rows, setRows] = useState(initial);
  const [selectedId, setSelectedId] = useState(initial[0].id);
  const selected = rows.find((r) => r.id === selectedId);

  const complete = () =>
    setRows(rows.map((r) => (r.id === selectedId ? { ...r, status: 'COMPLETED' } : r)));

  const detail = (label, value) => (
    <div className="flex items-center justify-between py-1.5 border-b border-white/10 text-xs">
      <span className="text-white/60">{label}</span>
      <span className="font-semibold text-right">{value}</span>
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-3xl font-black tracking-tight">MISSION CONTROL</h2>
        <p className="text-xs text-white/70">Deploy drones, assign operators and track rescue operations.</p>
      </div>

      <SqlBar sql="SELECT m.*, d.Model, o.FullName FROM MISSION m JOIN DRONE d ON m.DroneID = d.DroneID JOIN OPERATOR o ON m.OperatorID = o.OperatorID;" />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 rounded-3xl bg-black/40 border border-white/15 backdrop-blur-xl p-5">
          <h3 className="text-sm font-black tracking-wider mb-3">MISSION CONTROLS</h3>
          {selected && (
            <>
              {detail('Mission ID', <span className="font-mono">{selected.id}</span>)}
              {detail('Type', <Badge tone={typeTone[selected.type]}>{selected.type}</Badge>)}
              {detail('Disaster', <span className="text-amber-300">{selected.disaster}</span>)}
              {detail('Drone Assigned', <span className="text-cyan-300">{selected.drone}</span>)}
              {detail('Operator', selected.operator)}
              {detail('Date', selected.date)}
              {detail('Priority', <Badge tone={prioTone[selected.priority]}>{selected.priority}</Badge>)}
              {detail('Status', <Badge tone={selected.status === 'ACTIVE' ? 'green' : 'gray'}>{selected.status}</Badge>)}

              <button
                onClick={complete}
                disabled={selected.status === 'COMPLETED'}
                className="mt-4 w-full py-3 rounded-2xl bg-[#262626] hover:bg-black border border-white/25 text-xs font-bold disabled:opacity-40"
              >
                ✓ Mark Mission Completed
              </button>
              <div className="mt-3 p-2.5 rounded-xl bg-black/50 font-mono text-[10px] text-amber-300 break-all">
                Executes: UPDATE MISSION SET Status = 'COMPLETED' WHERE MissionID = '{selected.id}';
              </div>
            </>
          )}
        </div>

        <div className="lg:col-span-3 rounded-3xl bg-black/40 border border-white/15 backdrop-blur-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-black tracking-wider">ACTIVE MISSIONS</h3>
            <span className="text-[10px] text-white/60">Click row to inspect</span>
          </div>
          <table className="w-full text-xs">
            <thead className="text-left text-white/60 uppercase text-[10px]">
              <tr>
                <th className="p-2">ID</th><th className="p-2">Type</th><th className="p-2">Priority</th>
                <th className="p-2">Status</th><th className="p-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={`border-t border-white/10 cursor-pointer hover:bg-white/10 ${selectedId === r.id ? 'bg-white/15' : ''}`}
                >
                  <td className="p-2 font-mono">{r.id}</td>
                  <td className="p-2"><Badge tone={typeTone[r.type]}>{r.type}</Badge></td>
                  <td className="p-2"><Badge tone={prioTone[r.priority]}>{r.priority}</Badge></td>
                  <td className="p-2"><Badge tone={r.status === 'ACTIVE' ? 'green' : 'gray'}>{r.status}</Badge></td>
                  <td className="p-2 font-mono text-white/70">{r.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}