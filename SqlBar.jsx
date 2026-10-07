import { Terminal } from 'lucide-react';

export default function SqlBar({ sql }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/40 border border-white/15 backdrop-blur-xl">
      <div className="p-2 rounded-xl bg-white/10 text-amber-300">
        <Terminal className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-mono font-bold text-amber-300 tracking-wider">
          LIVE DATABASE / ORACLE SQL QUERY
        </div>
        <div className="text-xs font-mono text-white/80 truncate">{sql}</div>
      </div>
      <button
        onClick={() => navigator.clipboard?.writeText(sql)}
        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-[11px] font-mono"
      >
        Copy SQL
      </button>
    </div>
  );
}