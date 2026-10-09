import React, { useState, useEffect } from 'react';
import {
  Trash2,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  ChefHat,
  TrendingDown,
  Info,
  Coins,
  History,
  Sparkles
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { api } from '../services/api';
import { WasteRecord, WasteRecordCreate } from '../types';

const MENU_TYPES = ['Meals', 'Variety Rice', 'Biryani', 'Dosa', 'Idli'];

export const WastePage: React.FC = () => {
  const [records, setRecords] = useState<WasteRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<WasteRecordCreate>({
    date: new Date().toISOString().split('T')[0],
    menu_type: 'Meals',
    meals_prepared: 200,
    meals_sold: 185,
    discarded_meals: 10,
    cost_per_meal: 45,
    notes: 'Regular lunch service',
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

    // Validation
    if (formData.meals_sold > formData.meals_prepared) {
      setError('Meals sold cannot exceed meals prepared.');
      setSubmitting(false);
      return;
    }
    if (formData.discarded_meals > formData.meals_prepared) {
      setError('Discarded meals cannot exceed total meals prepared.');
      setSubmitting(false);
      return;
    }

    try {
      await api.createWasteRecord(formData);
      setSuccessMsg('Operational record logged and persisted to CSV successfully.');
      await fetchRecords();
      // Reset notes
      setFormData({
        ...formData,
        notes: '',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to record waste entry');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculations for current inputs (live preview)
  const previewLeftover = Math.max(0, formData.meals_prepared - formData.meals_sold);
  const previewWastePct = formData.meals_prepared > 0
    ? ((formData.discarded_meals / formData.meals_prepared) * 100).toFixed(1)
    : '0';
  const previewWastedCost = formData.discarded_meals * formData.cost_per_meal;

  // Aggregate stats
  const totalPrepared = records.reduce((acc, r) => acc + r.meals_prepared, 0);
  const totalSold = records.reduce((acc, r) => acc + r.meals_sold, 0);
  const totalDiscarded = records.reduce((acc, r) => acc + r.discarded_meals, 0);
  const totalWastedCost = records.reduce((acc, r) => acc + r.wasted_cost, 0);
  const avgWastePct = totalPrepared > 0 ? ((totalDiscarded / totalPrepared) * 100).toFixed(1) : '0';

  // Group by Menu for highest-waste categories
  const menuAgg: Record<string, { prepared: number; discarded: number; cost: number }> = {};
  records.forEach((r) => {
    if (!menuAgg[r.menu_type]) {
      menuAgg[r.menu_type] = { prepared: 0, discarded: 0, cost: 0 };
    }
    menuAgg[r.menu_type].prepared += r.meals_prepared;
    menuAgg[r.menu_type].discarded += r.discarded_meals;
    menuAgg[r.menu_type].cost += r.wasted_cost;
  });

  const menuBreakdownChart = Object.entries(menuAgg).map(([menu, d]) => ({
    menu,
    waste_percentage: d.prepared > 0 ? Number(((d.discarded / d.prepared) * 100).toFixed(1)) : 0,
    discarded: d.discarded,
    wasted_cost: Math.round(d.cost),
  })).sort((a, b) => b.waste_percentage - a.waste_percentage);

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Trash2 className="w-6 h-6 text-rose-500" />
            Kitchen Food Waste Operational Tracker
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Log actual cafeteria operations to distinguish between safely reused leftovers and discarded waste.
          </p>
        </div>
      </div>

      {/* Distinction Caveat Banner */}
      <div className="p-4 rounded-2xl bg-[#111827] border border-slate-800 flex items-start gap-3">
        <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 leading-relaxed">
          <strong className="text-white">Crucial Distinction: Leftover vs. Discarded Food:</strong>
          {' '}Unsold food (meals prepared minus meals sold) is not necessarily food waste. Unsold meals safely donated to student dormitories, chilled for breakfast reprocessing, or sold at late discounts are salvaged. Only meals explicitly thrown out / spoiled are counted as <strong>Discarded Waste</strong>.
        </div>
      </div>

      {/* High-level Waste KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Waste Rate</span>
          <div className="text-2xl font-black text-rose-400 mt-2">{avgWastePct}%</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Of all prepared meal volume</span>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Discarded Meals</span>
          <div className="text-2xl font-black text-white mt-2">{totalDiscarded} meals</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Across {records.length} operational shifts</span>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estimated Cost Loss</span>
          <div className="text-2xl font-black text-amber-400 mt-2">₹{totalWastedCost.toLocaleString('en-IN')}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Direct ingredient loss</span>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Storage Target</span>
          <div className="text-2xl font-black text-emerald-400 mt-2">CSV Persistence</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Stored in backend/data/waste_records.csv</span>
        </div>
      </div>

      {/* Main Grid: Entry Form + High-Waste Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Entry Form (6 cols) */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-6 bg-[#111827] border border-slate-800 rounded-2xl p-6 lg:p-7 space-y-5 shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-rose-500" />
              Log Kitchen Operational Shift
            </h3>
            <span className="text-[10px] font-mono text-slate-500">CSV Form</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Date</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Menu Category</label>
              <select
                value={formData.menu_type}
                onChange={(e) => setFormData({ ...formData, menu_type: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
              >
                {MENU_TYPES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Meals Prepared</label>
              <input
                type="number"
                min="0"
                required
                value={formData.meals_prepared}
                onChange={(e) => setFormData({ ...formData, meals_prepared: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Meals Sold</label>
              <input
                type="number"
                min="0"
                required
                value={formData.meals_sold}
                onChange={(e) => setFormData({ ...formData, meals_sold: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Discarded / Wasted Meals</label>
              <input
                type="number"
                min="0"
                required
                value={formData.discarded_meals}
                onChange={(e) => setFormData({ ...formData, discarded_meals: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Cost Per Meal (₹)</label>
              <input
                type="number"
                min="1"
                required
                value={formData.cost_per_meal}
                onChange={(e) => setFormData({ ...formData, cost_per_meal: parseFloat(e.target.value) || 1 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Operational Remarks / Cause</label>
            <input
              type="text"
              placeholder="e.g. Rainy evening, hostel event cancellation, or over-preparation"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Real-time Computed Values Preview */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <span className="text-slate-500 block text-[10px]">Total Leftover</span>
              <span className="font-bold text-white">{previewLeftover} meals</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Discard Rate</span>
              <span className="font-bold text-rose-400">{previewWastePct}%</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">Wasted Cost</span>
              <span className="font-bold text-amber-400">₹{previewWastedCost}</span>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? 'Persisting Record...' : 'Save Record to Operational CSV'}
          </button>
        </form>

        {/* Highest Waste Categories (6 cols) */}
        <div className="lg:col-span-6 bg-[#111827] border border-slate-800 rounded-2xl p-6 lg:p-7 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Highest-Waste Categories</h3>
              <p className="text-xs text-slate-400 mt-0.5">Average discard rate by menu item</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={menuBreakdownChart} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
                <XAxis type="number" stroke="#64748B" fontSize={11} tickLine={false} unit="%" />
                <YAxis dataKey="menu" type="category" stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#334155', borderRadius: '8px', color: '#F8FAFC' }}
                  formatter={(val: any) => [`${val}%`, 'Waste Rate']}
                />
                <Bar dataKey="waste_percentage" fill="#EF4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Explanation */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
            Formula: <code>Waste % = (Discarded Meals / Prepared Meals) × 100</code>. Safely handles zero meals prepared without division errors.
          </div>
        </div>
      </div>

      {/* Operational Logs History Table */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <History className="w-4 h-4 text-amber-500" />
            Operational Log History (CSV Backed)
          </h3>
          <span className="text-xs text-slate-400 font-mono">{records.length} records logged</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Menu</th>
                <th className="px-4 py-3">Prepared</th>
                <th className="px-4 py-3">Sold</th>
                <th className="px-4 py-3">Leftover</th>
                <th className="px-4 py-3">Discarded</th>
                <th className="px-4 py-3">Waste %</th>
                <th className="px-4 py-3">Cost Loss</th>
                <th className="px-4 py-3">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-2.5 font-mono text-slate-500">{r.id}</td>
                  <td className="px-4 py-2.5 font-mono">{r.date}</td>
                  <td className="px-4 py-2.5 font-semibold text-white">{r.menu_type}</td>
                  <td className="px-4 py-2.5 font-mono">{r.meals_prepared}</td>
                  <td className="px-4 py-2.5 font-mono">{r.meals_sold}</td>
                  <td className="px-4 py-2.5 font-mono text-sky-400">{r.leftover_meals}</td>
                  <td className="px-4 py-2.5 font-mono text-rose-400 font-bold">{r.discarded_meals}</td>
                  <td className="px-4 py-2.5 font-mono">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${r.waste_percentage > 10 ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-800 text-slate-300'}`}>
                      {r.waste_percentage}%
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-amber-400 font-semibold">₹{r.wasted_cost}</td>
                  <td className="px-4 py-2.5 text-slate-400 truncate max-w-xs">{r.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
