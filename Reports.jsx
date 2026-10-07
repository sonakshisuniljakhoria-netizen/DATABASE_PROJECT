export default function Reports({ onOpenSqlConsole }) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Reports</h2>
      <p className="text-sm text-white/70">
        Run analytical queries and view summaries of missions, victims and supplies.
      </p>
      <button
        onClick={onOpenSqlConsole}
        className="px-4 py-2 rounded-2xl bg-[#222222] hover:bg-black text-white text-xs font-semibold border border-white/25 shadow-lg transition"
      >
        Open SQL Console
      </button>
    </div>
  );
}
