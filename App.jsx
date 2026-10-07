import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import NavTabs from './components/NavTabs';
import SqlPlaygroundModal from './components/SqlPlaygroundModal';
// Pages
import PublicPortal from './pages/PublicPortal';
import Dashboard from './pages/Dashboard';
import Drones from './pages/Drones';
import Missions from './pages/Missions';
import Victims from './pages/Victims';
import ReliefCamps from './pages/ReliefCamps';
import Supplies from './pages/Supplies';
import Operators from './pages/Operators';
import Organizations from './pages/Organizations';
import Reports from './pages/Reports';
import { fetchStats } from './utils/api';
import { Flame, X } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState('public');
  const [stats, setStats] = useState(null);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [activeInfoModal, setActiveInfoModal] = useState(null);

  const loadGlobalStats = async () => {
    try {
      const res = await fetchStats();
      if (res.success) setStats(res.stats);
    } catch (e) {
      console.warn('Failed to load stats:', e);
    }
  };

  useEffect(() => {
    loadGlobalStats();
    const timer = setInterval(loadGlobalStats, 12000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative min-h-screen text-white font-sans selection:bg-amber-500 selection:text-black flex flex-col justify-between overflow-x-hidden bg-[#120807]">
      {/* Pure code atmospheric disaster background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a0c0a] via-[#140807] to-[#0a0403]" />

        <div className="absolute -bottom-20 left-1/4 w-3/5 h-96 bg-gradient-to-t from-red-600/25 via-amber-600/15 to-transparent blur-3xl rounded-full" />
        <div className="absolute top-10 right-10 w-96 h-96 bg-red-950/30 blur-3xl rounded-full" />

        <svg
          className="absolute bottom-0 w-full h-[65vh] opacity-25 text-black"
          viewBox="0 0 1440 600"
          preserveAspectRatio="none"
          fill="currentColor"
        >
          <path d="M0,600 L0,280 L20,310 L45,180 L70,300 L95,140 L120,290 L160,220 L190,340 L230,120 L270,330 L310,210 L350,320 L390,160 L430,300 L480,100 L530,320 L570,200 L620,310 L670,140 L720,330 L770,180 L820,320 L870,120 L920,300 L970,220 L1020,340 L1080,130 L1130,310 L1180,190 L1230,330 L1290,150 L1340,310 L1390,190 L1440,290 L1440,600 Z" />
          <path opacity="0.6" d="M0,600 L0,350 L35,390 L80,260 L130,410 L180,220 L240,430 L300,280 L360,420 L420,200 L490,440 L560,290 L630,430 L700,240 L780,450 L850,270 L930,440 L1000,210 L1070,430 L1150,290 L1220,440 L1300,230 L1370,420 L1440,320 L1440,600 Z" />
        </svg>

        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-black/60" />
      </div>

      {/* Single unified header */}
      <Header
        currentView={currentView}
        setCurrentView={setCurrentView}
        onOpenSqlModal={() => setIsSqlModalOpen(true)}
        onOpenInfoModal={(m) => setActiveInfoModal(m)}
      />

      {/* Main content viewport */}
      <div className="relative z-10 flex-1 flex flex-col">
        {currentView === 'public' ? (
          <PublicPortal onSwitchToAdmin={() => setCurrentView('dashboard')} />
        ) : (
          <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6 flex-1 flex flex-col">
            <NavTabs
              currentView={currentView}
              setCurrentView={setCurrentView}
              stats={stats}
            />

            <div className="flex-1 pb-10">
              {currentView === 'dashboard' && <Dashboard onNavigate={setCurrentView} />}
              {currentView === 'drones' && <Drones />}
              {currentView === 'missions' && <Missions />}
              {currentView === 'victims' && <Victims />}
              {currentView === 'camps' && <ReliefCamps />}
              {currentView === 'supplies' && <Supplies />}
              {currentView === 'operators' && <Operators />}
              {currentView === 'organizations' && <Organizations />}
              {currentView === 'reports' && <Reports onOpenSqlConsole={() => setIsSqlModalOpen(true)} />}
            </div>
          </div>
        )}
      </div>

      {/* SQL playground modal */}
      <SqlPlaygroundModal
        isOpen={isSqlModalOpen}
        onClose={() => setIsSqlModalOpen(false)}
        onQueryExecuted={loadGlobalStats}
      />

      {/* Safety info modal */}
      {activeInfoModal === 'safety' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#120b0a]/95 backdrop-blur-2xl border border-white/20 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-lg text-amber-300 flex items-center space-x-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <span>Disaster Safety Protocols</span>
              </h3>
              <button onClick={() => setActiveInfoModal(null)} className="text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs text-white/80 leading-relaxed max-h-96 overflow-y-auto font-sans">
              <div className="p-3.5 bg-black/40 rounded-2xl border border-white/15">
                <h4 className="font-bold text-white mb-1">🌊 Flood Guidelines</h4>
                <p>Move immediately to higher ground. Avoid walking or driving through flood waters. Keep rooftop clear for drone drop-off.</p>
              </div>
              <div className="p-3.5 bg-black/40 rounded-2xl border border-white/15">
                <h4 className="font-bold text-white mb-1">🔥 Wildfire Guidelines</h4>
                <p>Keep windows and vents closed. Wear an N95 mask or damp cloth to protect against smoke inhalation. Broadcast your beacon coordinates.</p>
              </div>
              <div className="p-3.5 bg-black/40 rounded-2xl border border-white/15">
                <h4 className="font-bold text-white mb-1">🚁 Drone Aerial Delivery</h4>
                <p>Maintain 15 meters clearance when relief drones hover. Wait for the cargo payload to touch ground before unlatching supplies.</p>
              </div>
            </div>
            <button onClick={() => setActiveInfoModal(null)} className="w-full py-2.5 bg-white/10 hover:bg-white/20 rounded-2xl text-xs font-semibold border border-white/15">
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}