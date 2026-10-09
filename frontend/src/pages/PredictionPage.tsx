import React, { useState } from 'react';
import {
  BrainCircuit,
  Calendar,
  ChefHat,
  Users,
  Thermometer,
  History,
  Palmtree,
  Coins,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { PredictRequest, PredictResponse } from '../types';
import { NavTab } from '../components/Sidebar';

interface PredictionPageProps {
  onNavigateToScenarios: (request: PredictRequest) => void;
}

const MENU_TYPES = ['Meals', 'Variety Rice', 'Biryani', 'Dosa', 'Idli'];

export const PredictionPage: React.FC<PredictionPageProps> = ({ onNavigateToScenarios }) => {
  const [formData, setFormData] = useState<PredictRequest>({
    date: '2025-10-17',
    menu_type: 'Biryani',
    expected_attendance: 420,
    temperature: 29.5,
    prev_day_sales: 190,
    is_holiday: 0,
    planned_meals: 210,
    cost_per_meal: 65,
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [prediction, setPrediction] = useState<PredictResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Derive day of week dynamically from date for instant feedback
  const getDerivedDay = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { weekday: 'long' });
    } catch {
      return 'Friday';
    }
  };

  const currentDayName = getDerivedDay(formData.date);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.predictDemand(formData);
      setPrediction(res);
    } catch (err: any) {
      setError(err.message || 'Prediction failed. Ensure backend service is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-amber-500" />
            Demand Forecasting Engine
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Generate data-driven meal demand estimates using a trained Random Forest Regressor.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Input Form Panel (7 cols) */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 bg-[#111827] border border-slate-800 rounded-2xl p-6 lg:p-7 space-y-6 shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Operational Parameters
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Day: <span className="text-amber-400 font-bold">{currentDayName}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Prediction Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" /> Prediction Date
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            {/* Menu Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <ChefHat className="w-3.5 h-3.5 text-amber-400" /> Menu Category
              </label>
              <select
                value={formData.menu_type}
                onChange={(e) => setFormData({ ...formData, menu_type: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
              >
                {MENU_TYPES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Expected Attendance */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-sky-400" /> Expected Attendance
                </label>
                <span className="text-xs font-mono text-amber-400 font-bold">{formData.expected_attendance} people</span>
              </div>
              <input
                type="range"
                min="50"
                max="650"
                step="5"
                value={formData.expected_attendance}
                onChange={(e) => setFormData({ ...formData, expected_attendance: parseInt(e.target.value) })}
                className="w-full accent-amber-500 bg-slate-800 rounded-lg h-2 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>50 (Holiday/Quiet)</span>
                <span>350 (Normal)</span>
                <span>650 (Peak Campus)</span>
              </div>
            </div>

            {/* Temperature */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-orange-400" /> Temperature (°C)
                </label>
                <span className="text-xs font-mono text-orange-400 font-bold">{formData.temperature}°C</span>
              </div>
              <input
                type="range"
                min="18"
                max="44"
                step="0.5"
                value={formData.temperature}
                onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                className="w-full accent-orange-500 bg-slate-800 rounded-lg h-2 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>18°C (Cool/Winter)</span>
                <span>28°C (Moderate)</span>
                <span>44°C (Hot Summer)</span>
              </div>
            </div>

            {/* Previous Day's Sales */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-purple-400" /> Previous Day's Sales
              </label>
              <input
                type="number"
                min="0"
                max="1000"
                value={formData.prev_day_sales}
                onChange={(e) => setFormData({ ...formData, prev_day_sales: Math.max(0, parseFloat(e.target.value) || 0) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Autoregressive lag feature for baseline momentum</span>
            </div>

            {/* Holiday Toggle */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Palmtree className="w-3.5 h-3.5 text-emerald-400" /> Academic Schedule Status
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_holiday: 0 })}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    formData.is_holiday === 0
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  Regular College Day
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_holiday: 1 })}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    formData.is_holiday === 1
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  Holiday / Vacation
                </button>
              </div>
            </div>

            {/* Planned Preparation Meals */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <ChefHat className="w-3.5 h-3.5 text-amber-400" /> Planned Preparation Batch
              </label>
              <input
                type="number"
                min="0"
                max="1000"
                value={formData.planned_meals}
                onChange={(e) => setFormData({ ...formData, planned_meals: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Quantity kitchen plans to cook</span>
            </div>

            {/* Preparation Cost Per Meal */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-400" /> Direct Cost Per Meal (₹)
              </label>
              <input
                type="number"
                min="1"
                max="500"
                value={formData.cost_per_meal}
                onChange={(e) => setFormData({ ...formData, cost_per_meal: Math.max(1, parseFloat(e.target.value) || 1) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Raw ingredients and kitchen preparation cost</span>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  Running Random Forest Model...
                </>
              ) : (
                <>
                  <BrainCircuit className="w-4 h-4" />
                  Predict Demand
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </form>

        {/* Right Output Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {prediction ? (
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 lg:p-7 space-y-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[11px] font-semibold text-amber-500 uppercase tracking-wider">Prediction Output</span>
                  <h3 className="text-lg font-bold text-white mt-0.5">{prediction.menu_type} Demand</h3>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                  {prediction.day_of_week}
                </span>
              </div>

              {/* Big Prediction Number */}
              <div className="p-5 rounded-2xl bg-gradient-to-b from-amber-500/10 to-transparent border border-amber-500/20 text-center">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Model Predicted Demand</span>
                <div className="text-5xl font-black text-white mt-2 tracking-tight flex items-baseline justify-center gap-2">
                  <span className="text-amber-400">{prediction.rounded_prediction}</span>
                  <span className="text-base text-slate-400 font-normal">meals</span>
                </div>

                {/* Defensible Ensemble Interval */}
                <div className="mt-3 pt-3 border-t border-amber-500/15 flex items-center justify-center gap-4 text-xs font-medium">
                  <span className="text-slate-400">
                    80% Prediction Interval:{' '}
                    <span className="text-white font-mono font-bold">
                      [{prediction.uncertainty_lower} - {prediction.uncertainty_upper}]
                    </span>
                  </span>
                  <span className="text-slate-500 font-mono">(σ = ±{prediction.uncertainty_std})</span>
                </div>
              </div>

              {/* Explanation Note */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 leading-relaxed flex items-start gap-2">
                <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <span>{prediction.confidence_explanation}</span>
              </div>

              {/* Surplus / Shortage Comparison Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-xl border ${prediction.surplus > 0 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-900 border-slate-800'}`}>
                  <span className="text-[11px] text-slate-400 font-semibold block">Estimated Surplus</span>
                  <span className={`text-xl font-bold mt-1 block ${prediction.surplus > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                    {prediction.surplus > 0 ? `+${prediction.surplus} meals` : '0 meals'}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1 block">Prepared &gt; Demand</span>
                </div>

                <div className={`p-4 rounded-xl border ${prediction.shortage > 0 ? 'bg-rose-500/10 border-rose-500/30' : 'bg-slate-900 border-slate-800'}`}>
                  <span className="text-[11px] text-slate-400 font-semibold block">Estimated Shortage</span>
                  <span className={`text-xl font-bold mt-1 block ${prediction.shortage > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                    {prediction.shortage > 0 ? `-${prediction.shortage} meals` : '0 meals'}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1 block">Demand &gt; Prepared</span>
                </div>
              </div>

              {/* Cost Analysis */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Total Planned Batch Cost</span>
                  <span className="text-white font-bold font-mono">₹{prediction.prep_cost.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Estimated Surplus Food Cost</span>
                  <span className={`font-bold font-mono ${prediction.surplus_cost > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    ₹{prediction.surplus_cost.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500">
                  Surplus cost = Surplus Meals × Unit Cost. Realized loss depends on kitchen donation or repurposing.
                </div>
              </div>

              {/* Recommendation Callout */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1">
                  Kitchen Operational Guidance
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">{prediction.recommendation}</p>
              </div>

              {/* Action Button: Send to Simulator */}
              <button
                type="button"
                onClick={() => onNavigateToScenarios(formData)}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 transition-all flex items-center justify-center gap-2"
              >
                Send to What-If Scenario Simulator <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="h-full min-h-[400px] bg-[#111827] border border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <BrainCircuit className="w-7 h-7" />
              </div>
              <div className="max-w-xs space-y-1">
                <h4 className="text-sm font-bold text-white">Prediction Engine Standby</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Configure attendance, menu type, and temperature on the left, then click <strong>Predict Demand</strong> to run machine learning inference.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
