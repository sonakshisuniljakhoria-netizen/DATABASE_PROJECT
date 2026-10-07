const tones = {
  red: 'bg-red-500/20 text-red-300 border-red-500/40',
  amber: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  green: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  blue: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  cyan: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  gray: 'bg-white/10 text-white/70 border-white/20',
};

export default function Badge({ tone = 'gray', children }) {
  return (
    <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wide ${tones[tone]}`}>
      {children}
    </span>
  );
}