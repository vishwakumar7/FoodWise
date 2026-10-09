import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { WasteRecord, WasteRecordCreate } from '../types';

const MENU_TYPES = ['Meals', 'Variety Rice', 'Biryani', 'Dosa', 'Idli'];

export const WastePage: React.FC = () => {
  const [records, setRecords] = useState<WasteRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState<WasteRecordCreate>({
    date: new Date().toISOString().split('T')[0],
    menu_type: 'Meals',
    meals_prepared: 200,
    meals_sold: 185,
    discarded_meals: 10,
    cost_per_meal: 45,
    notes: 'Regular service',
  });

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await api.getWasteRecords();
      setRecords(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load waste records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    if (formData.meals_sold > formData.meals_prepared) {
      setError('Meals sold cannot exceed meals prepared.');
      setSubmitting(false);
      return;
    }
    if (formData.discarded_meals > formData.meals_prepared) {
      setError('Discarded meals cannot exceed meals prepared.');
      setSubmitting(false);
      return;
    }

    try {
      await api.createWasteRecord(formData);
      setSuccessMsg('Record saved to CSV successfully.');
      await fetchRecords();
      setFormData({
        ...formData,
        notes: '',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to save waste record');
    } finally {
      setSubmitting(false);
    }
  };

  const leftoverQty = Math.max(0, formData.meals_prepared - formData.meals_sold);
  const wastePct = formData.meals_prepared > 0
    ? ((formData.discarded_meals / formData.meals_prepared) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white border border-gray-200 rounded-md p-4">
        <h2 className="text-lg font-bold text-gray-800">Food Waste Recording & Tracking</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Record daily canteen leftovers and discarded meals to track food loss over time.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form (1 col) */}
        <form onSubmit={handleSubmit} className="md:col-span-1 bg-white border border-gray-200 rounded-md p-4 space-y-3">
          <h3 className="font-semibold text-sm text-gray-800 border-b border-gray-100 pb-2">
            Record Shift Waste
          </h3>

          <div className="space-y-2.5 text-xs">
            <div>
              <label className="text-gray-700 font-medium block mb-1">Date</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-gray-800"
              />
            </div>

            <div>
              <label className="text-gray-700 font-medium block mb-1">Menu Item</label>
              <select
                value={formData.menu_type}
                onChange={(e) => setFormData({ ...formData, menu_type: e.target.value })}
                className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-gray-800 bg-white"
              >
                {MENU_TYPES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-gray-700 font-medium block mb-1">Meals Prepared</label>
              <input
                type="number"
                min="0"
                required
                value={formData.meals_prepared}
                onChange={(e) => setFormData({ ...formData, meals_prepared: parseInt(e.target.value) || 0 })}
                className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-gray-800"
              />
            </div>

            <div>
              <label className="text-gray-700 font-medium block mb-1">Meals Sold</label>
              <input
                type="number"
                min="0"
                required
                value={formData.meals_sold}
                onChange={(e) => setFormData({ ...formData, meals_sold: parseInt(e.target.value) || 0 })}
                className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-gray-800"
              />
            </div>

            <div>
              <label className="text-gray-700 font-medium block mb-1">Discarded / Thrown Away</label>
              <input
                type="number"
                min="0"
                required
                value={formData.discarded_meals}
                onChange={(e) => setFormData({ ...formData, discarded_meals: parseInt(e.target.value) || 0 })}
                className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-gray-800"
              />
            </div>

            <div>
              <label className="text-gray-700 font-medium block mb-1">Cost Per Meal (₹)</label>
              <input
                type="number"
                min="1"
                required
                value={formData.cost_per_meal}
                onChange={(e) => setFormData({ ...formData, cost_per_meal: parseFloat(e.target.value) || 1 })}
                className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-gray-800"
              />
            </div>

            <div>
              <label className="text-gray-700 font-medium block mb-1">Notes / Reason</label>
              <input
                type="text"
                placeholder="e.g. Rainy day, excess cooked"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-gray-800"
              />
            </div>

            {/* Calculated preview */}
            <div className="bg-gray-50 border border-gray-200 rounded p-2.5 text-[11px] text-gray-600 space-y-0.5">
              <div>Unsold Leftover: <strong>{leftoverQty} meals</strong></div>
              <div>Waste Rate: <strong>{wastePct}%</strong></div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 border border-red-200 rounded p-2 text-xs">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="bg-green-50 text-green-700 border border-green-200 rounded p-2 text-xs">
                {successMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs py-2 px-3 rounded transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Waste Record'}
            </button>
          </div>
        </form>

        {/* Records Table (2 cols) */}
        <div className="md:col-span-2 bg-white border border-gray-200 rounded-md p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h3 className="font-semibold text-sm text-gray-800">
              Logged Operational Records
            </h3>
            <span className="text-xs text-gray-500 font-mono">
              {records.length} records in CSV
            </span>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold sticky top-0">
                <tr>
                  <th className="py-2 px-2.5">Date</th>
                  <th className="py-2 px-2.5">Menu</th>
                  <th className="py-2 px-2.5 text-right">Prep</th>
                  <th className="py-2 px-2.5 text-right">Sold</th>
                  <th className="py-2 px-2.5 text-right">Leftover</th>
                  <th className="py-2 px-2.5 text-right">Discarded</th>
                  <th className="py-2 px-2.5 text-right">Waste %</th>
                  <th className="py-2 px-2.5 text-right">Cost Loss</th>
                  <th className="py-2 px-2.5">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="py-2 px-2.5 text-gray-900">{r.date}</td>
                    <td className="py-2 px-2.5 font-medium">{r.menu_type}</td>
                    <td className="py-2 px-2.5 text-right">{r.meals_prepared}</td>
                    <td className="py-2 px-2.5 text-right">{r.meals_sold}</td>
                    <td className="py-2 px-2.5 text-right">{r.leftover_meals}</td>
                    <td className="py-2 px-2.5 text-right font-semibold text-red-600">{r.discarded_meals}</td>
                    <td className="py-2 px-2.5 text-right font-semibold">{r.waste_percentage}%</td>
                    <td className="py-2 px-2.5 text-right text-orange-600">₹{r.wasted_cost}</td>
                    <td className="py-2 px-2.5 text-gray-500 truncate max-w-xs">{r.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-[11px] text-gray-400 pt-2 border-t border-gray-100">
            Note: Leftover food represents unsold portions. Only discarded food counts towards the food waste percentage.
          </div>
        </div>
      </div>
    </div>
  );
};
