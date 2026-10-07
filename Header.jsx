import React from 'react';
import { Radio, Terminal, Heart, Shield } from 'lucide-react';

export default function Header({
  currentView,
  setCurrentView,
  onOpenSqlModal,
  onOpenInfoModal
}) {
  return (
    <header className="w-full bg-black/70 backdrop-blur-xl border-b border-white/10 px-6 md:px-12 py-3.5 flex items-center justify-between sticky top-0 z-50">
      {/* Left: AeroRescue brand */}
      <div className="flex items-center space-x-3">
        <div
          onClick={() => setCurrentView('public')}
          className="flex items-center space-x-2.5 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center text-white font-black text-sm shadow-md">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <span className="text-xl md:text-2xl font-black tracking-widest text-white drop-shadow-md group-hover:text-amber-300 transition">
            AERORESCUE
          </span>
          <span className="hidden sm:inline-block text-[10px] font-mono tracking-wider px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-amber-200 font-semibold uppercase">
            Drone Grid
          </span>
        </div>
      </div>

      {/* Nav links */}
      <div className="flex items-center space-x-4 md:space-x-6 text-xs md:text-sm font-medium text-slate-200">
        <button
          onClick={() => onOpenInfoModal('safety')}
          className="hover:text-amber-300 transition drop-shadow hidden md:inline"
        >
          Safety Tips
        </button>
        <button
          onClick={() => onOpenInfoModal('about')}
          className="hover:text-amber-300 transition drop-shadow hidden md:inline"
        >
          About Us
        </button>
        <button
          onClick={() => onOpenInfoModal('contact')}
          className="hover:text-amber-300 transition drop-shadow hidden md:inline"
        >
          Contact Us
        </button>
        <button
          onClick={() => onOpenInfoModal('donate')}
          className="hover:text-rose-400 font-bold transition drop-shadow flex items-center space-x-1"
        >
          <Heart className="w-3.5 h-3.5 fill-current text-rose-400" />
          <span className="hidden sm:inline">Donate</span>
        </button>

        {/* SQL console button */}
        <button
          onClick={onOpenSqlModal}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-mono text-xs transition"
          title="Open SQL Query Inspector"
        >
          <Terminal className="w-3.5 h-3.5 text-amber-300" />
          <span className="hidden sm:inline">SQL Console</span>
        </button>

        {/* View switcher pill */}
        <button
          onClick={() => setCurrentView(currentView === 'public' ? 'dashboard' : 'public')}
          className="px-4 py-2 rounded-2xl bg-[#222222] hover:bg-black text-white text-xs font-semibold border border-white/25 shadow-lg transition active:scale-95 flex items-center space-x-1.5"
        >
          <Shield className="w-3.5 h-3.5 text-amber-400" />
          <span>{currentView === 'public' ? 'Ops Command Center →' : 'Citizen SOS Portal'}</span>
        </button>
      </div>
    </header>
  );
}