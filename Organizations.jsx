const rows = [
  { id: 'ORG1', name: 'National Disaster Response Force', type: 'Government' },
  { id: 'ORG2', name: 'Red Cross', type: 'NGO' },
  { id: 'ORG3', name: 'City Fire Department', type: 'Government' },
];

export default function Organizations() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Organizations</h2>
      <div className="rounded-3xl bg-black/40 border border-white/15 backdrop-blur-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/10 text-left text-xs uppercase text-white/70">
            <tr>
              <th className="p-3">Org ID</th>
              <th className="p-3">Name</th>
              <th className="p-3">Type</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-white/10">
                <td className="p-3 font-mono">{r.id}</td>
                <td className="p-3">{r.name}</td>
                <td className="p-3">{r.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}