import {
  LayoutDashboard, Plane, Target, Users, Tent,
  Package, UserCog, Building2, FileText,
} from 'lucide-react';

const fallback = { drones: 9, missions: 3, victims: 5, camps: 5, supplies: 7, operators: 4 };

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'drones', label: 'Drones', icon: Plane, count: 'drones' },
  { id: 'missions', label: 'Missions', icon: Target, count: 'missions' },
  { id: 'victims', label: 'Victims', icon: Users, count: 'victims' },
  { id: 'camps', label: 'Camps', icon: Tent, count: 'camps' },
  { id: 'supplies', label: 'Supplies', icon: Package, count: 'supplies' },
  { id: 'operators', label: 'Operators', icon: UserCog, count: 'operators' },
  { id: 'organizations', label: 'Org.', icon: Building2 },
  { id: 'reports', label: 'Reports', icon: FileText },
];

export default function NavTabs({ currentView, setCurrentView, stats }) {
  const data = { ...fallback, ...(stats || {}) };
  return (
    <nav className="mb-6 p-1.5 rounded-full bg-black/40 border border-white/15 backdrop-blur-xl flex flex-wrap items-center gap-1 w-fit max-w-full">
      {tabs.map((t) => {
        const Icon = t.icon;
        const active = currentView === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setCurrentView(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition ${
              active ? 'bg-white/90 text-black shadow-lg' : 'text-white/80 hover:bg-white/10'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{t.label}</span>
            {t.count && (
              <span className={`text-[10px] px-1.5 rounded-full ${active ? 'bg-black/15' : 'bg-white/15'}`}>
                {data[t.count]}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}