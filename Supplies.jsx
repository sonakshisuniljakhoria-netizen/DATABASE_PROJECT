import { useState } from 'react';
import Badge from '../components/Badge';
import SqlBar from '../components/SqlBar';

const initial = [
  { id: 'S001', item: 'Insulin & Medical Packets', qty: 90, camp: 'North Riverbank Shelter', unit: 'kits', updated: '2026-10-07 07:15' },
  { id: 'S002', item: 'Emergency Blankets', qty: 80, camp: 'Coastal High School Camp', unit: 'kits', updated: '2026-10-07 05:20' },
  { id: 'S003', item: 'Dry Ration Packs', qty: 300, camp: 'Central Relief Stadium Camp', unit: 'kits', updated: '2026-10-07 05:00' },
  { id: 'S004', item: 'Emergency Thermal Blankets', qty: 350, camp: 'Valley Base Emergency Camp', unit: 'items', updated: '2026-10-07 02:10' },
  { id: 'S005', item: 'Water Purification Tablets', qty: 450, camp: 'St. Ann Community Ground', unit: 'units', updated: '2026-10-06 18:00' },
  { id: 'S006', item: 'Tarpaulin Sheets', qty: 220, camp: 'Tambaram Relief Shelter', unit: 'units', updated: '2026-10-06 14:30' },
  { id: 'S007', item: 'First Aid Kits', qty: 160, camp: 'Anna Community Ground', unit: 'kits', updated: '2026-10-06 09:45' },
];

const LOW = 100;

export default function Supplies() {
  const [rows, setRows] = useState(initial);

  const add = () => {
    const item = window.prompt('Supply item name:');
    if (!item) return;
    const qty = parseInt(window.prompt('Quantity:', '100'), 10) || 0;
    const id = 'S' + String(rows.length + 1).padStart(3, '0');
    setRows([...rows, { id, item, qty, camp: 'Unassigned', unit: 'units', updated: new Date().toISOString().slice(0, 16).replace('T', ' ') }]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight">SUPPLY INVENTORY</h2>
          <p className="text-xs text-white/70">Emergency water, high-calorie meal packs, and medical supply chain.</p>
        </div>
        <button onClick={add} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold">
          + Add Supply
        </button>
      </div>

      <SqlBar sql="SELECT s.*, c.CampName, c.Location AS CampLocation FROM SUPPLY s LEFT JOIN RELIEF_CAMP c ON s.CampID = c.CampID ORDER BY s.Quantity ASC;" />

      <div className="rounded-3xl bg-black/40 border border-white/15 backdrop-blur-xl overflow-x-auto">
        <div className="flex items-center justify-between px-5 pt-4">
          <h3 className="text-xs font-black tracking-wider">SUPPLY INVENTORY TABLE</h3>
          <span className="text-[10px] text-white/60">{rows.length} stock line items</span>
        </div>
        <table className="w-full text-xs mt-2">
          <thead className="bg-white/10 text-left text-[10px] uppercase text-white/70">
            <tr>
              <th className="p-3">ID</th><th className="p-3">Description</th><th className="p-3">Quantity</th>
              <th className="p-3">Camp</th><th className="p-3">Unit</th><th className="p-3">Stock Status</th>
              <th className="p-3">Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {[...rows].sort((a, b) => a.qty - b.qty).map((r) => (
              <tr key={r.id} className="border-t border-white/10">
                <td className="p-3 font-mono">{r.id}</td>
                <td className="p-3 font-semibold">{r.item}</td>
                <td className="p-3 font-bold text-amber-300">{r.qty}</td>
                <td className="p-3 text-cyan-300 font-semibold">{r.camp}</td>
                <td className="p-3">{r.unit}</td>
                <td className="p-3">
                  {r.qty < LOW ? <Badge tone="red">⚠ Low Stock</Badge> : <Badge tone="green">✓ In Stock</Badge>}
                </td>
                <td className="p-3 font-mono text-white/70">{r.updated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}