import React, { useState } from 'react';
import { CloudRain, Phone, MapPin, ShieldAlert, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { createVictim } from '../utils/api';

export default function PublicPortal({ onSwitchToAdmin }) {
  const [locationInput, setLocationInput] = useState('');
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sosSuccess, setSosSuccess] = useState(null);
  const [victimForm, setVictimForm] = useState({
    fullName: '',
    age: '',
    priority: 'HIGH',
    emergencyDetails: 'Immediate rescue/supply assistance requested via AeroRescue portal.'
  });

  const handleQuickSend = (e) => {
    e.preventDefault();
    if (!locationInput.trim()) return;
    setSosModalOpen(true);
  };

  const handleConfirmSOS = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await createVictim({
        FullName: victimForm.fullName || 'Emergency Citizen',
        Age: parseInt(victimForm.age) || 30,
        Priority: victimForm.priority,
        Status: 'WAITING',
        Location: locationInput,
        CampID: 'C001',
        EmergencyDetails: victimForm.emergencyDetails
      });

      if (res.success) {
        setSosSuccess({ ticketId: res.VictimID, location: locationInput });
        setLocationInput('');
      }
    } catch (err) {
      alert('Failed to register SOS: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative w-full flex-1 flex flex-col justify-between select-none py-8 md:py-12">
      <div className="w-full max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center flex-1">

        {/* Left column: headline, SOS location box, call now */}
        <div className="lg:col-span-7 space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight drop-shadow-2xl">
              Any disaster?<br />
              <span className="text-white/90 font-light">We are here to help!</span>
            </h1>
            <p className="text-sm md:text-base text-white/80 max-w-lg leading-relaxed drop-shadow">
              Autonomous drone fleet & disaster relief coordination network. Submit your location for immediate emergency assistance.
            </p>
          </div>

          {/* Location input form */}
          <form onSubmit={handleQuickSend} className="w-full max-w-xl">
            <div className="flex items-center rounded-2xl bg-white/15 hover:bg-white/20 backdrop-blur-xl border border-white/30 p-2 shadow-2xl transition-all">
              <div className="pl-3 pr-2 text-white/80">
                <MapPin className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                placeholder="Enter location here..."
                className="w-full bg-transparent border-none text-white placeholder:text-white/70 text-sm md:text-base px-2 py-2 focus:outline-none"
              />
              <button
                type="submit"
                className="px-7 py-3 rounded-xl bg-[#262626] hover:bg-black text-white text-sm font-semibold transition-all shadow-lg active:scale-95 shrink-0 border border-white/20"
              >
                Send
              </button>
            </div>
          </form>

          {/* Call now banner */}
          <div className="flex items-center space-x-3 text-lg md:text-xl font-bold text-white drop-shadow">
            <Phone className="w-5 h-5 text-amber-300" />
            <span>Call now : <a href="tel:0301234567" className="hover:text-amber-200 font-mono underline decoration-amber-400/60">030-123-4567</a></span>
          </div>

          {/* Active operations badges */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="flex items-center space-x-2 px-4 py-2 rounded-2xl bg-black/40 border border-white/15 text-xs backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-white font-medium">8 Drones in Airspace</span>
            </div>
            <div className="flex items-center space-x-2 px-4 py-2 rounded-2xl bg-black/40 border border-white/15 text-xs backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-white font-medium">12 Relief Camps Open</span>
            </div>
          </div>
        </div>

        {/* Right column: frosted weather widget */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end">
          <div className="w-full max-w-sm rounded-3xl bg-black/40 backdrop-blur-2xl border border-white/20 p-6 shadow-2xl space-y-6 text-white">
            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold tracking-wide text-white">Accra</h2>
              <p className="text-xs text-white/70 font-medium">Friday - Today</p>
            </div>

            <div className="text-center space-y-2">
              <div className="text-6xl font-light tracking-tight text-white flex items-start justify-center">
                <span>23</span>
                <span className="text-3xl font-light text-white/70 mt-1">°</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-sm text-white/90">
                <CloudRain className="w-4 h-4 text-cyan-300" />
                <span>Thundershowers</span>
              </div>
            </div>

            {/* Precipitation curve */}
            <div className="space-y-1.5 pt-2">
              <div className="h-10 w-full relative flex items-end">
                <svg className="w-full h-full" viewBox="0 0 200 40" preserveAspectRatio="none">
                  <path
                    d="M0,30 Q30,15 60,18 T120,10 T160,20 T200,32"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.5)"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
              <div className="flex justify-between text-[10px] text-white/60 font-mono px-1">
                <span>6pm</span><span>6pm</span><span>6pm</span><span>6pm</span><span>6pm</span>
              </div>
            </div>

            {/* 5-day forecast row */}
            <div className="border-t border-white/15 pt-4 flex items-center justify-between text-center text-xs">
              {[
                { day: 'Fri', tempHigh: '27°' },
                { day: 'Sat', tempHigh: '27°' },
                { day: 'Sun', tempHigh: '28°' },
                { day: 'Mon', tempHigh: '29°' },
                { day: 'Tue', tempHigh: '28°' },
              ].map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <span className="text-[11px] text-white/80 block">{item.day}</span>
                  <CloudRain className="w-4 h-4 mx-auto text-white/90" />
                  <span className="text-[10px] font-mono text-white/70 block">{item.tempHigh}</span>
                </div>
              ))}
              <ChevronRight className="w-4 h-4 text-white/50" />
            </div>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="w-full max-w-7xl mx-auto px-6 md:px-12 pt-8 mt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-white/60 gap-2">
        <p>© 2026 AeroRescue Disaster Operations Network & DroneResponse</p>
        <p className="font-mono text-emerald-400">● Emergency Grid: 100% Operational</p>
      </div>

      {/* SOS dispatch modal */}
      {sosModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#120b0a]/95 backdrop-blur-2xl border border-white/20 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-white">
            {sosSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-white">Emergency Beacon Dispatched!</h3>
                <p className="text-sm text-white/80">
                  Your SOS request has been inserted into the database with Ticket ID:
                </p>
                <div className="p-3.5 bg-black/50 border border-emerald-500/40 rounded-2xl font-mono text-emerald-400 font-bold text-lg">
                  {sosSuccess.ticketId}
                </div>
                <p className="text-xs text-white/70">
                  Coordinates logged at <strong className="text-white">{sosSuccess.location}</strong>. Nearest available drone is being routed.
                </p>
                <div className="pt-3 flex space-x-3">
                  <button
                    onClick={() => {
                      setSosModalOpen(false);
                      setSosSuccess(null);
                    }}
                    className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition border border-white/15"
                  >
                    Done
                  </button>
                  <button
                    onClick={() => {
                      setSosModalOpen(false);
                      setSosSuccess(null);
                      onSwitchToAdmin();
                    }}
                    className="w-full py-3 rounded-2xl bg-[#262626] hover:bg-black text-white text-sm font-semibold transition border border-white/25 shadow-lg"
                  >
                    Track in Ops Center →
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30">
                      <ShieldAlert className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white">Emergency SOS Dispatch</h3>
                      <p className="text-xs text-white/70">Transmitting to AeroRescue Drone Operations Database</p>
                    </div>
                  </div>
                  <button onClick={() => setSosModalOpen(false)} className="text-white/60 hover:text-white p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleConfirmSOS} className="space-y-4 text-xs font-sans">
                  <div>
                    <label className="block text-white/80 font-semibold mb-1">Target Location</label>
                    <input
                      type="text"
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                      required
                      className="w-full bg-black/40 border border-white/20 rounded-2xl px-3.5 py-2.5 text-white focus:outline-none focus:border-white/50"
                      placeholder="Street, Landmark, or GPS coordinates"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-white/80 font-semibold mb-1">Contact / Name</label>
                      <input
                        type="text"
                        value={victimForm.fullName}
                        onChange={(e) => setVictimForm({ ...victimForm, fullName: e.target.value })}
                        className="w-full bg-black/40 border border-white/20 rounded-2xl px-3.5 py-2.5 text-white focus:outline-none focus:border-white/50"
                        placeholder="e.g. Rahul Sharma"
                      />
                    </div>
                    <div>
                      <label className="block text-white/80 font-semibold mb-1">Approximate Age</label>
                      <input
                        type="number"
                        value={victimForm.age}
                        onChange={(e) => setVictimForm({ ...victimForm, age: e.target.value })}
                        className="w-full bg-black/40 border border-white/20 rounded-2xl px-3.5 py-2.5 text-white focus:outline-none focus:border-white/50"
                        placeholder="e.g. 32"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/80 font-semibold mb-1">Urgency / Priority Level</label>
                    <select
                      value={victimForm.priority}
                      onChange={(e) => setVictimForm({ ...victimForm, priority: e.target.value })}
                      className="w-full bg-black/40 border border-white/20 rounded-2xl px-3.5 py-2.5 text-white focus:outline-none focus:border-white/50"
                    >
                      <option value="CRITICAL">🔴 CRITICAL (Immediate Life Threat)</option>
                      <option value="HIGH">🟠 HIGH (Waterlogged / Medical Need)</option>
                      <option value="MEDIUM">🟡 MEDIUM (Supplies / Food Required)</option>
                      <option value="LOW">🟢 LOW (General Welfare Check)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-white/80 font-semibold mb-1">Details & Special Needs</label>
                    <textarea
                      rows={3}
                      value={victimForm.emergencyDetails}
                      onChange={(e) => setVictimForm({ ...victimForm, emergencyDetails: e.target.value })}
                      className="w-full bg-black/40 border border-white/20 rounded-2xl px-3.5 py-2.5 text-white focus:outline-none focus:border-white/50"
                      placeholder="e.g. Stranded on rooftop, elderly patient needs oxygen"
                    />
                  </div>

                  <div className="pt-2 flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setSosModalOpen(false)}
                      className="w-1/2 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold transition border border-white/15"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-1/2 py-3 rounded-2xl bg-[#262626] hover:bg-black text-white font-bold transition border border-white/25 shadow-lg active:scale-95"
                    >
                      {submitting ? 'Transmitting...' : 'Transmit SOS Now'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}