const rows = [
  { id: 'C001', name: 'North Relief Camp', capacity: 200, occupied: 140 },
  { id: 'C002', name: 'City School Shelter', capacity: 150, occupied: 90 },
  { id: 'C003', name: 'Stadium Camp', capacity: 500, occupied: 310 },
];

export default function ReliefCamps() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Relief Camps</h2>
      <div className="rounded-3xl bg-black/40 border border-white/15 backdrop-blur-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/10 text-left text-xs uppercase text-white/70">
            <tr>
              <th className="p-3">Camp ID</th>
              <th className="p-3">Name</th>
              <th className="p-3">Capacity</th>
              <th className="p-3">Occupied</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-white/10">
                <td className="p-3 font-mono">{r.id}</td>
                <td className="p-3">{r.name}</td>
                <td className="p-3">{r.capacity}</td>
                <td className="p-3">{r.occupied}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}