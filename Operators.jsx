const rows = [
  { id: 'OP01', name: 'Kiran Patel', certification: 'Level 3', shift: 'Day' },
  { id: 'OP02', name: 'Meera Nair', certification: 'Level 2', shift: 'Night' },
  { id: 'OP03', name: 'Arjun Das', certification: 'Level 3', shift: 'Day' },
];

export default function Operators() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Operators</h2>
      <div className="rounded-3xl bg-black/40 border border-white/15 backdrop-blur-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/10 text-left text-xs uppercase text-white/70">
            <tr>
              <th className="p-3">Operator ID</th>
              <th className="p-3">Name</th>
              <th className="p-3">Certification</th>
              <th className="p-3">Shift</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-white/10">
                <td className="p-3 font-mono">{r.id}</td>
                <td className="p-3">{r.name}</td>
                <td className="p-3">{r.certification}</td>
                <td className="p-3">{r.shift}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}