import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
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

    if (formData.meals_sold > formData.meals_prepared) {
      setError('Meals sold cannot exceed total portions prepared.');
      setSubmitting(false);
      return;
    }
    if (formData.discarded_meals > formData.meals_prepared) {
      setError('Discarded portions cannot exceed total portions prepared.');
      setSubmitting(false);
      return;
    }

    try {
      await api.createWasteRecord(formData);
      setSuccessMsg('Operational shift record saved to CSV successfully.');
      await fetchRecords();
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

  const previewLeftover = Math.max(0, formData.meals_prepared - formData.meals_sold);
  const previewWastePct = formData.meals_prepared > 0
    ? ((formData.discarded_meals / formData.meals_prepared) * 100).toFixed(1)
    : '0';
  const previewWastedCost = formData.discarded_meals * formData.cost_per_meal;

  const totalPrepared = records.reduce((acc, r) => acc + r.meals_prepared, 0);
  const totalDiscarded = records.reduce((acc, r) => acc + r.discarded_meals, 0);
  const totalWastedCost = records.reduce((acc, r) => acc + r.wasted_cost, 0);
  const avgWastePct = totalPrepared > 0 ? ((totalDiscarded / totalPrepared) * 100).toFixed(1) : '0';

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
      <div className="border-b border-line pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-500">
          <span>Kitchen Accounting</span>
          <span>•</span>
          <span className="text-olive-700">Production Variance & Loss Log</span>
        </div>
        <h2 className="font-serif text-2xl lg:text-3xl font-bold text-ink-950 tracking-tight mt-1">
          Shift Food Waste & Salvage Log
        </h2>
        <p className="text-xs text-ink-500 mt-1 max-w-2xl">
          Record actual operational kitchen outputs to differentiate unsold food from discarded waste and compute ingredient cost losses.
        </p>
      </div>

      {/* Distinction Note */}
      <div className="p-4 rounded-lg bg-card border border-line flex items-start gap-3">
        <Info className="w-4 h-4 text-olive-700 shrink-0 mt-0.5" />
        <div className="text-xs text-ink-600 leading-relaxed">
          <strong className="text-ink-900 font-semibold">Operational Distinction: Leftover vs. Discarded Food:</strong>
          {' '}Unsold food (Prepared − Sold) is not automatically classified as waste. Unsold portions safely donated to student dormitories or preserved for reprocessing are salvaged. Only food spoiled or discarded due to expiry is logged as <strong>Discarded Waste</strong>.
        </div>
      </div>

      {/* Aggregate Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-line rounded-lg p-4">
          <span className="text-[11px] font-semibold text-ink-500 uppercase tracking-wider">Average Waste Rate</span>
          <div className="font-serif text-2xl font-bold text-terracotta-700 mt-1 font-tabular">{avgWastePct}%</div>
          <span className="text-[11px] text-ink-400 mt-0.5 block">Of all prepared batch portions</span>
        </div>

        <div className="bg-card border border-line rounded-lg p-4">
          <span className="text-[11px] font-semibold text-ink-500 uppercase tracking-wider">Discarded Portions</span>
          <div className="font-serif text-2xl font-bold text-ink-950 mt-1 font-tabular">{totalDiscarded} portions</div>
          <span className="text-[11px] text-ink-400 mt-0.5 block">Across {records.length} logged kitchen shifts</span>
        </div>

        <div className="bg-card border border-line rounded-lg p-4">
          <span className="text-[11px] font-semibold text-ink-500 uppercase tracking-wider">Unrecovered Cost Loss</span>
          <div className="font-serif text-2xl font-bold text-warm-700 mt-1 font-tabular">₹{totalWastedCost.toLocaleString('en-IN')}</div>
          <span className="text-[11px] text-ink-400 mt-0.5 block">Direct ingredient expenditure lost</span>
        </div>

        <div className="bg-card border border-line rounded-lg p-4">
          <span className="text-[11px] font-semibold text-ink-500 uppercase tracking-wider">Storage Architecture</span>
          <div className="font-serif text-lg font-bold text-olive-800 mt-1">Local CSV Storage</div>
          <span className="text-[11px] text-ink-400 mt-0.5 block font-mono">waste_records.csv</span>
        </div>
      </div>

      {/* Shift Entry Form + Category Discard Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Entry Form (6 cols) */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-6 bg-card border border-line rounded-lg p-6 space-y-4"
        >
          <div className="pb-2 border-b border-line flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-800 flex items-center gap-2">
              <PlusCircle className="w-3.5 h-3.5 text-olive-700" />
              Log Kitchen Shift Record
            </h3>
            <span className="text-[10px] font-mono text-ink-400">CSV Form</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-ink-700 font-medium block mb-1">Shift Date</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-canvas-subtle border border-line rounded p-2 text-ink-900 focus:outline-none focus:border-olive-700"
              />
            </div>

            <div>
              <label className="text-ink-700 font-medium block mb-1">Menu Category</label>
              <select
                value={formData.menu_type}
                onChange={(e) => setFormData({ ...formData, menu_type: e.target.value })}
                className="w-full bg-canvas-subtle border border-line rounded p-2 text-ink-900 font-semibold focus:outline-none focus:border-olive-700"
              >
                {MENU_TYPES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-ink-700 font-medium block mb-1">Portions Prepared</label>
              <input
                type="number"
                min="0"
                required
                value={formData.meals_prepared}
                onChange={(e) => setFormData({ ...formData, meals_prepared: parseInt(e.target.value) || 0 })}
                className="w-full bg-canvas-subtle border border-line rounded p-2 text-ink-900 font-mono focus:outline-none focus:border-olive-700"
              />
            </div>

            <div>
              <label className="text-ink-700 font-medium block mb-1">Portions Sold</label>
              <input
                type="number"
                min="0"
                required
                value={formData.meals_sold}
                onChange={(e) => setFormData({ ...formData, meals_sold: parseInt(e.target.value) || 0 })}
                className="w-full bg-canvas-subtle border border-line rounded p-2 text-ink-900 font-mono focus:outline-none focus:border-olive-700"
              />
            </div>

            <div>
              <label className="text-ink-700 font-medium block mb-1">Discarded Portions</label>
              <input
                type="number"
                min="0"
                required
                value={formData.discarded_meals}
                onChange={(e) => setFormData({ ...formData, discarded_meals: parseInt(e.target.value) || 0 })}
                className="w-full bg-canvas-subtle border border-line rounded p-2 text-ink-900 font-mono focus:outline-none focus:border-olive-700"
              />
            </div>

            <div>
              <label className="text-ink-700 font-medium block mb-1">Cost Per Portion (₹)</label>
              <input
                type="number"
                min="1"
                required
                value={formData.cost_per_meal}
                onChange={(e) => setFormData({ ...formData, cost_per_meal: parseFloat(e.target.value) || 1 })}
                className="w-full bg-canvas-subtle border border-line rounded p-2 text-ink-900 font-mono focus:outline-none focus:border-olive-700"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="text-ink-700 font-medium block mb-1">Operational Cause / Shift Notes</label>
            <input
              type="text"
              placeholder="e.g. Inclement weather, student symposium cancellation, over-preparation"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-canvas-subtle border border-line rounded p-2 text-ink-900 focus:outline-none focus:border-olive-700 text-xs"
            />
          </div>

          {/* Computed Preview */}
          <div className="p-3 rounded bg-canvas-subtle border border-line grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <span className="text-ink-500 block text-[10px]">Unsold Leftover</span>
              <span className="font-bold text-ink-900 font-mono">{previewLeftover}</span>
            </div>
            <div>
              <span className="text-ink-500 block text-[10px]">Discard Rate</span>
              <span className="font-bold text-terracotta-700 font-mono">{previewWastePct}%</span>
            </div>
            <div>
              <span className="text-ink-500 block text-[10px]">Cost Loss</span>
              <span className="font-bold text-warm-700 font-mono">₹{previewWastedCost}</span>
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded border border-terracotta-200 bg-terracotta-50 text-terracotta-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-terracotta-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 rounded border border-olive-200 bg-olive-50 text-olive-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-olive-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded text-xs font-semibold bg-olive-700 hover:bg-olive-800 text-white transition-colors disabled:opacity-50"
          >
            {submitting ? 'Saving Shift Record...' : 'Save Record to Operational CSV'}
          </button>
        </form>

        {/* Highest Discard Categories (6 cols) */}
        <div className="lg:col-span-6 bg-card border border-line rounded-lg p-6 space-y-4">
          <div className="pb-2 border-b border-line">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-800">
              Highest-Waste Menu Categories
            </h3>
            <p className="text-xs text-ink-500">
              Historical discard rate by menu offering
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={menuBreakdownChart} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#E5E5DF" horizontal={false} />
                <XAxis type="number" stroke="#77807A" fontSize={10} tickLine={false} unit="%" />
                <YAxis dataKey="menu" type="category" stroke="#77807A" fontSize={11} tickLine={false} width={80} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#D3D3CB', borderRadius: '4px', fontSize: '11px', color: '#1F2421' }}
                  formatter={(val: any) => [`${val}%`, 'Discard Rate']}
                />
                <Bar dataKey="waste_percentage" fill="#AF4326" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 rounded bg-canvas-subtle border border-line text-[11px] text-ink-500 font-mono">
            Calculation: Discard % = (Discarded Portions / Prepared Portions) × 100
          </div>
        </div>
      </div>

      {/* Operational Shift Logs Table */}
      <div className="border border-line rounded-lg overflow-hidden bg-card space-y-3 p-5">
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <h3 className="font-serif text-sm font-bold text-ink-950">
            Recorded Operational Shift Logs
          </h3>
          <span className="text-xs font-mono text-ink-500">{records.length} shifts logged</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-canvas-subtle border-b border-line text-ink-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Shift ID</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Menu</th>
                <th className="px-4 py-3 text-right">Prepared</th>
                <th className="px-4 py-3 text-right">Sold</th>
                <th className="px-4 py-3 text-right">Leftover</th>
                <th className="px-4 py-3 text-right">Discarded</th>
                <th className="px-4 py-3 text-right">Waste %</th>
                <th className="px-4 py-3 text-right">Cost Loss</th>
                <th className="px-4 py-3">Operational Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-ink-700">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-canvas-subtle/70 transition-colors">
                  <td className="px-4 py-2.5 font-mono text-ink-400">{r.id}</td>
                  <td className="px-4 py-2.5 font-mono text-ink-900">{r.date}</td>
                  <td className="px-4 py-2.5 font-semibold text-ink-950">{r.menu_type}</td>
                  <td className="px-4 py-2.5 font-mono text-right font-tabular">{r.meals_prepared}</td>
                  <td className="px-4 py-2.5 font-mono text-right font-tabular">{r.meals_sold}</td>
                  <td className="px-4 py-2.5 font-mono text-right font-tabular text-ink-600">{r.leftover_meals}</td>
                  <td className="px-4 py-2.5 font-mono text-right font-tabular font-bold text-terracotta-700">{r.discarded_meals}</td>
                  <td className="px-4 py-2.5 font-mono text-right font-tabular">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                      r.waste_percentage > 10
                        ? 'bg-terracotta-50 text-terracotta-800 border-terracotta-200'
                        : 'bg-canvas-subtle text-ink-600 border-line'
                    }`}>
                      {r.waste_percentage}%
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-right font-tabular text-warm-700 font-semibold">
                    ₹{r.wasted_cost}
                  </td>
                  <td className="px-4 py-2.5 text-ink-500 truncate max-w-xs">{r.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
