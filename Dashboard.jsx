import Badge from '../components/Badge';
import SqlBar from '../components/SqlBar';

const stats = [
  { label: 'Drones', value: 9, sub: '2 In Flight', tag: 'COUNT(*)', view: 'drones', subColor: 'text-amber-300' },
  { label: 'Missions', value: '03', sub: 'Active Right Now', tag: 'ACTIVE', view: 'missions', subColor: 'text-amber-300' },
  { label: 'Victims', value: 5, sub: '4 Rescued', tag: 'REGISTRY', view: 'victims', subColor: 'text-emerald-300' },
  { label: 'Camps', value: 5, sub: 'Relief Shelters', tag: 'CAMP', view: 'camps', subColor: 'text-cyan-300' },
  { label: 'Supplies', value: 7, sub: 'Catalog Stock', tag: 'SUPPLY', view: 'supplies', subColor: 'text-cyan-300' },
];

const missions = [
  { id: 'M007', type: 'RESCUE', disaster: 'Wildfire - Accra Outskirts', drone: 'D004', priority: 'CRITICAL', status: 'ACTIVE' },
  { id: 'M005', type: 'SURVEY', disaster: 'Wildfire - Sierra Forest', drone: 'D007', priority: 'HIGH', status: 'ACTIVE' },
  { id: 'M003', type: 'RESCUE', disaster: 'Flood - Chennai', drone: 'D004', priority: 'CRITICAL', status: 'ACTIVE' },
  { id: 'M002', type: 'RELIEF', disaster: 'Flood - Chennai', drone: 'D002', priority: 'MEDIUM', status: 'COMPLETED' },
  { id: 'M001', type: 'SURVEY', disaster: 'Landslide - Nilgiris', drone: 'D006', priority: 'MEDIUM', status: 'COMPLETED' },
];

const typeTone = { RESCUE: 'red', SURVEY: 'amber', RELIEF: 'blue' };
const prioTone = { CRITICAL: 'red', HIGH: 'amber', MEDIUM: 'cyan' };

export default function Dashboard({ onNavigate }) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Good morning, Admin</h2>
          <p className="text-xs text-white/70">Disaster Response Operations Command • Real-Time Fleet & Victim Grid</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onNavigate('victims')} className="px-3 py-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-[11px] font-semibold">
            Open SOS
          </button>
          <button onClick={() => onNavigate('missions')} className="px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-[11px] font-semibold">
            + Deploy Mission
          </button>
        </div>
      </div>

      <SqlBar sql="SELECT COUNT(*) FROM DRONE; SELECT COUNT(*) FROM MISSION WHERE Status = 'ACTIVE'; SELECT COUNT(*) FROM VICTIM; SELECT COUNT(*) FROM RELIEF_CAMP;" />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((s) => (
          <button
            key={s.label}
            onClick={() => onNavigate(s.view)}
            className="text-left p-5 rounded-3xl bg-black/40 border border-white/15 backdrop-blur-xl hover:bg-white/10 transition"
          >
            <div className="text-[10px] font-bold tracking-widest text-white/70">{s.label.toUpperCase()}</div>
            <div className="text-5xl font-light my-2">{s.value}</div>
            <div className="flex items-center justify-between text-[10px]">
              <span className={`font-bold ${s.subColor}`}>{s.sub}</span>
              <span className="font-mono text-white/50">{s.tag}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-3xl bg-black/40 border border-white/15 backdrop-blur-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-black tracking-wider">ACTIVE OPERATIONS & MISSIONS</h3>
            <button onClick={() => onNavigate('missions')} className="text-xs text-amber-300">View All ↗</button>
          </div>
          <table className="w-full text-xs">
            <thead className="text-left text-white/60 uppercase text-[10px]">
              <tr>
                <th className="p-2">Mission ID</th><th className="p-2">Type</th><th className="p-2">Disaster Zone</th>
                <th className="p-2">Drone</th><th className="p-2">Priority</th><th className="p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {missions.map((m) => (
                <tr key={m.id} className="border-t border-white/10">
                  <td className="p-2 font-mono">{m.id}</td>
                  <td className="p-2"><Badge tone={typeTone[m.type]}>{m.type}</Badge></td>
                  <td className="p-2">{m.disaster}</td>
                  <td className="p-2 font-mono text-cyan-300">{m.drone}</td>
                  <td className="p-2"><Badge tone={prioTone[m.priority]}>{m.priority}</Badge></td>
                  <td className="p-2"><Badge tone={m.status === 'ACTIVE' ? 'green' : 'gray'}>{m.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl bg-black/40 border border-white/15 backdrop-blur-xl p-5 space-y-2">
            <h3 className="text-sm font-black tracking-wider mb-2">DRONE FLEET READINESS</h3>
            {[
              ['Ready for Flight', 'bg-cyan-400'],
              ['Active Airborne', 'bg-amber-400'],
              ['Charging Bay', 'bg-blue-400'],
            ].map(([label, dot]) => (
              <div key={label} className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs">
                <span className={`w-2 h-2 rounded-full ${dot}`} /> {label}
              </div>
            ))}
          </div>
          <div className="rounded-3xl bg-red-500/10 border border-red-500/30 p-4 text-xs">
            <div className="font-bold text-red-300 mb-1">PRIORITY INCIDENT</div>
            <div className="font-semibold">Flood - Chennai</div>
            <p className="text-white/70 mt-1">3 active drones deployed with water and insulin packets.</p>
          </div>
        </div>
      </div>
    </div>
  );
}