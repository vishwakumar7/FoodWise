import React, { useState } from 'react';
import {
  Calendar,
  ChefHat,
  Users,
  Thermometer,
  RotateCcw,
  SlidersHorizontal,
  Info,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Scale
} from 'lucide-react';
import { api } from '../services/api';
import { PredictRequest, PredictResponse } from '../types';

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
      setError(err.message || 'Forecast calculation failed. Ensure API service is reachable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-line pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-500">
          <span>Inference Pipeline</span>
          <span>•</span>
          <span className="text-olive-700">Random Forest Regressor</span>
        </div>
        <h2 className="font-serif text-2xl lg:text-3xl font-bold text-ink-950 tracking-tight mt-1">
          Shift Demand Forecasting
        </h2>
        <p className="text-xs text-ink-500 mt-1 max-w-2xl">
          Enter operational shift parameters to calculate expected meal portion demand, kitchen preparation outlay, and tree-ensemble prediction bounds.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Input Form Panel (7 cols) */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 bg-card border border-line rounded-lg p-6 space-y-6"
        >
          {/* Section 1: Schedule & Timing */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-700 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-olive-700" />
                1. Schedule & Calendar Setting
              </h3>
              <span className="text-xs font-mono text-ink-500">
                Weekday: <strong className="text-olive-800">{currentDayName}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-ink-700 mb-1">
                  Service Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-canvas-subtle border border-line rounded px-3 py-2 text-xs text-ink-900 focus:outline-none focus:border-olive-700 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-700 mb-1">
                  Campus Schedule Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_holiday: 0 })}
                    className={`py-2 px-2.5 rounded text-xs font-medium border text-center transition-colors ${
                      formData.is_holiday === 0
                        ? 'bg-olive-50 text-olive-900 border-olive-300 font-semibold'
                        : 'bg-canvas-subtle text-ink-600 border-line hover:text-ink-900'
                    }`}
                  >
                    Regular Class Day
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_holiday: 1 })}
                    className={`py-2 px-2.5 rounded text-xs font-medium border text-center transition-colors ${
                      formData.is_holiday === 1
                        ? 'bg-olive-50 text-olive-900 border-olive-300 font-semibold'
                        : 'bg-canvas-subtle text-ink-600 border-line hover:text-ink-900'
                    }`}
                  >
                    Holiday / Break
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Campus Operating Conditions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-700 flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-olive-700" />
                2. Campus Operating Dynamics
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-ink-700">Expected Headcount</label>
                  <span className="text-xs font-mono font-bold text-ink-900 font-tabular">{formData.expected_attendance} people</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="650"
                  step="5"
                  value={formData.expected_attendance}
                  onChange={(e) => setFormData({ ...formData, expected_attendance: parseInt(e.target.value) })}
                  className="w-full accent-olive-700 bg-canvas-subtle rounded h-1.5 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-ink-400 mt-1 font-mono">
                  <span>50 (Minimal)</span>
                  <span>350 (Normal)</span>
                  <span>650 (Peak Campus)</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-ink-700">Temperature Forecast</label>
                  <span className="text-xs font-mono font-bold text-ink-900 font-tabular">{formData.temperature}°C</span>
                </div>
                <input
                  type="range"
                  min="18"
                  max="42"
                  step="0.5"
                  value={formData.temperature}
                  onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                  className="w-full accent-terracotta-700 bg-canvas-subtle rounded h-1.5 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-ink-400 mt-1 font-mono">
                  <span>18°C (Cool)</span>
                  <span>28°C (Moderate)</span>
                  <span>42°C (High Summer)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Kitchen Batch & Costing */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-700 flex items-center gap-2">
                <ChefHat className="w-3.5 h-3.5 text-olive-700" />
                3. Menu & Kitchen Preparation Batch
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-ink-700 mb-1">
                  Menu Category
                </label>
                <select
                  value={formData.menu_type}
                  onChange={(e) => setFormData({ ...formData, menu_type: e.target.value })}
                  className="w-full bg-canvas-subtle border border-line rounded px-3 py-2 text-xs text-ink-900 focus:outline-none focus:border-olive-700 transition-colors"
                >
                  {MENU_TYPES.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-700 mb-1">
                  Previous Shift Sales Volume (Portions)
                </label>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={formData.prev_day_sales}
                  onChange={(e) => setFormData({ ...formData, prev_day_sales: Math.max(0, parseFloat(e.target.value) || 0) })}
                  className="w-full bg-canvas-subtle border border-line rounded px-3 py-2 text-xs text-ink-900 focus:outline-none focus:border-olive-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-700 mb-1">
                  Planned Kitchen Batch (Portions)
                </label>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={formData.planned_meals}
                  onChange={(e) => setFormData({ ...formData, planned_meals: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="w-full bg-canvas-subtle border border-line rounded px-3 py-2 text-xs text-ink-900 focus:outline-none focus:border-olive-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-700 mb-1">
                  Direct Cost Per Portion (₹)
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={formData.cost_per_meal}
                  onChange={(e) => setFormData({ ...formData, cost_per_meal: Math.max(1, parseFloat(e.target.value) || 1) })}
                  className="w-full bg-canvas-subtle border border-line rounded px-3 py-2 text-xs text-ink-900 focus:outline-none focus:border-olive-700"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-2 flex items-center justify-between border-t border-line">
            <span className="text-[11px] text-ink-500 font-mono">
              Algorithm: Random Forest (100 Trees)
            </span>

            <button
              type="submit"
              disabled={loading}
              className="py-2.5 px-6 rounded text-xs font-semibold bg-olive-700 hover:bg-olive-800 text-white transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <>Computing Model Forecast...</>
              ) : (
                <>
                  <TrendingUp className="w-3.5 h-3.5" />
                  Compute Demand Forecast
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="p-3 rounded border border-terracotta-200 bg-terracotta-50 text-terracotta-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-terracotta-600" />
              <span>{error}</span>
            </div>
          )}
        </form>

        {/* Prediction Results Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {prediction ? (
            <div className="bg-card border border-line rounded-lg p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">
                    Model Inference Result
                  </span>
                  <h3 className="font-serif text-lg font-bold text-ink-950 mt-0.5">
                    {prediction.menu_type} Portion Forecast
                  </h3>
                </div>
                <span className="text-xs px-2 py-0.5 rounded border border-line bg-canvas-subtle text-ink-600 font-mono">
                  {prediction.day_of_week}
                </span>
              </div>

              {/* Forecast Numeral Block */}
              <div className="p-5 rounded-lg bg-canvas-subtle border border-line text-center">
                <span className="text-[11px] font-semibold text-ink-500 uppercase tracking-wider">
                  Predicted Shift Demand
                </span>
                <div className="font-serif text-4xl font-bold text-ink-950 mt-1 font-tabular">
                  {prediction.rounded_prediction} <span className="text-sm font-sans font-normal text-ink-500">portions</span>
                </div>

                {/* Defensible Tree Ensemble Interval */}
                <div className="mt-3 pt-3 border-t border-line/70 text-xs text-ink-600 flex items-center justify-center gap-2 font-mono">
                  <span>80% Interval: [{prediction.uncertainty_lower} - {prediction.uncertainty_upper}]</span>
                  <span>•</span>
                  <span>σ = ±{prediction.uncertainty_std}</span>
                </div>
              </div>

              {/* Tree Ensemble Explanation */}
              <div className="text-[11px] text-ink-500 leading-relaxed bg-card p-3 rounded border border-line">
                <strong className="text-ink-700 font-medium">Statistical Basis:</strong> {prediction.confidence_explanation}
              </div>

              {/* Variance Comparison */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded border border-line bg-canvas-subtle">
                  <span className="text-ink-500 block text-[11px]">Estimated Surplus</span>
                  <span className="font-serif text-lg font-bold mt-0.5 block text-ink-900 font-tabular">
                    {prediction.surplus > 0 ? `+${prediction.surplus} portions` : '0 portions'}
                  </span>
                  <span className="text-[10px] text-ink-400">Planned &gt; Forecast</span>
                </div>

                <div className="p-3 rounded border border-line bg-canvas-subtle">
                  <span className="text-ink-500 block text-[11px]">Estimated Shortage</span>
                  <span className="font-serif text-lg font-bold mt-0.5 block text-ink-900 font-tabular">
                    {prediction.shortage > 0 ? `-${prediction.shortage} portions` : '0 portions'}
                  </span>
                  <span className="text-[10px] text-ink-400">Forecast &gt; Planned</span>
                </div>
              </div>

              {/* Financial Outlay Breakdown */}
              <div className="space-y-2 pt-2 border-t border-line text-xs">
                <div className="flex justify-between text-ink-600">
                  <span>Planned Batch Cost:</span>
                  <span className="font-mono font-bold text-ink-900">₹{prediction.prep_cost.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-ink-600">
                  <span>Potential Surplus Exposure:</span>
                  <span className="font-mono font-bold text-terracotta-700">₹{prediction.surplus_cost.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Operational Recommendation */}
              <div className="p-3.5 rounded bg-olive-50/70 border border-olive-200 text-xs text-olive-900 space-y-1">
                <span className="font-semibold block text-[11px] uppercase tracking-wider text-olive-800">
                  Production Guidance
                </span>
                <p className="leading-relaxed">{prediction.recommendation}</p>
              </div>

              {/* Action Button: Send to Simulator */}
              <button
                type="button"
                onClick={() => onNavigateToScenarios(formData)}
                className="w-full py-2.5 px-4 rounded text-xs font-semibold border border-line bg-canvas-subtle hover:bg-canvas-muted text-ink-800 transition-colors flex items-center justify-center gap-2"
              >
                Send to Batch Strategy Simulator <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="border border-line rounded-lg p-8 bg-card flex flex-col items-center justify-center text-center space-y-3 min-h-[360px]">
              <Scale className="w-8 h-8 text-ink-400" />
              <div className="max-w-xs space-y-1">
                <h4 className="font-serif text-sm font-bold text-ink-900">Forecasting Engine Ready</h4>
                <p className="text-xs text-ink-500 leading-relaxed">
                  Adjust schedule, headcount, and menu parameters, then click <strong>Compute Demand Forecast</strong> to run ML prediction.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
