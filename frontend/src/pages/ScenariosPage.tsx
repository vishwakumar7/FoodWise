import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  ShieldCheck,
  Target,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Info,
  CheckCircle2,
  Scale,
  DollarSign,
  ChefHat,
  RefreshCw
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { api } from '../services/api';
import { PredictRequest, ScenariosResponse, ScenarioItem } from '../types';

interface ScenariosPageProps {
  initialRequest?: PredictRequest | null;
}

const MENU_TYPES = ['Meals', 'Variety Rice', 'Biryani', 'Dosa', 'Idli'];

export const ScenariosPage: React.FC<ScenariosPageProps> = ({ initialRequest }) => {
  const [params, setParams] = useState<PredictRequest>(
    initialRequest || {
      date: '2025-10-17',
      menu_type: 'Biryani',
      expected_attendance: 420,
      temperature: 29.5,
      prev_day_sales: 190,
      is_holiday: 0,
      planned_meals: 200,
      cost_per_meal: 65,
    }
  );

  // Custom preparation quantities override
  const [conservativePlanned, setConservativePlanned] = useState<number | ''>('');
  const [predictedPlanned, setPredictedPlanned] = useState<number | ''>('');
  const [bufferPlanned, setBufferPlanned] = useState<number | ''>('');
  const [customPlanned, setCustomPlanned] = useState<number>(230);

  const [loading, setLoading] = useState<boolean>(false);
  const [scenarioData, setScenarioData] = useState<ScenariosResponse | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<string>('predicted');
  const [error, setError] = useState<string | null>(null);

  const evaluate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.evaluateScenarios({
        predict_request: params,
        conservative_planned: conservativePlanned === '' ? undefined : Number(conservativePlanned),
        predicted_planned: predictedPlanned === '' ? undefined : Number(predictedPlanned),
        buffer_planned: bufferPlanned === '' ? undefined : Number(bufferPlanned),
        custom_planned: customPlanned,
      });
      setScenarioData(res);
      // Auto-populate default values if empty
      if (conservativePlanned === '' && res.scenarios[0]) {
        setConservativePlanned(res.scenarios[0].planned_meals);
      }
      if (predictedPlanned === '' && res.scenarios[1]) {
        setPredictedPlanned(res.scenarios[1].planned_meals);
      }
      if (bufferPlanned === '' && res.scenarios[2]) {
        setBufferPlanned(res.scenarios[2].planned_meals);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to evaluate scenarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    evaluate();
  }, [params.menu_type, params.expected_attendance, params.cost_per_meal]);

  // Chart data preparation
  const chartData = scenarioData?.scenarios.map((s) => ({
    name: s.strategy_type === 'conservative' ? 'Conservative' : s.strategy_type === 'predicted' ? 'Predicted' : s.strategy_type === 'buffer' ? 'Safety Buffer' : 'Custom',
    planned: s.planned_meals,
    predicted: Math.round(s.predicted_demand),
    surplus: s.surplus,
    shortage: s.shortage,
    surplus_cost: s.surplus_cost,
    prep_cost: s.prep_cost,
  })) || [];

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <SlidersHorizontal className="w-6 h-6 text-amber-500" />
            What-If Preparation Scenario Simulator
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Compare batch preparation strategies to balance food waste risk versus stockout risk.
          </p>
        </div>

        <button
          onClick={evaluate}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-2 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Recalculate Scenarios
        </button>
      </div>

      {/* Control Bar */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <ChefHat className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-slate-300">Menu Category:</span>
            <select
              value={params.menu_type}
              onChange={(e) => setParams({ ...params, menu_type: e.target.value })}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              {MENU_TYPES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-400">Attendance:</span>
            <input
              type="number"
              min="50"
              max="700"
              value={params.expected_attendance}
              onChange={(e) => setParams({ ...params, expected_attendance: parseInt(e.target.value) || 100 })}
              className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white text-center focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-400">Unit Cost:</span>
            <div className="relative">
              <span className="absolute left-2.5 top-1 text-xs text-slate-500">₹</span>
              <input
                type="number"
                min="5"
                max="500"
                value={params.cost_per_meal}
                onChange={(e) => setParams({ ...params, cost_per_meal: parseFloat(e.target.value) || 50 })}
                className="w-20 pl-6 bg-slate-900 border border-slate-700 rounded-lg py-1 text-xs text-white text-center focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {scenarioData && (
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400">Base ML Forecast:</span>
            <span className="text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
              {scenarioData.predicted_demand} meals
            </span>
          </div>
        )}
      </div>

      {/* Scenario Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {scenarioData?.scenarios.map((s) => {
          const isSelected = selectedStrategy === s.strategy_type;
          return (
            <div
              key={s.strategy_type}
              onClick={() => setSelectedStrategy(s.strategy_type)}
              className={`cursor-pointer bg-[#111827] border rounded-2xl p-5 space-y-4 transition-all duration-200 relative ${
                isSelected
                  ? 'border-amber-500/60 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/40'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider">{s.scenario_name}</span>
                {isSelected && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500 text-slate-950">
                    Selected
                  </span>
                )}
              </div>

              {/* Quantity Customization Input */}
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400">Planned Meals:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    value={
                      s.strategy_type === 'conservative'
                        ? conservativePlanned
                        : s.strategy_type === 'predicted'
                        ? predictedPlanned
                        : s.strategy_type === 'buffer'
                        ? bufferPlanned
                        : customPlanned
                    }
                    onChange={(e) => {
                      const val = Math.max(0, parseInt(e.target.value) || 0);
                      if (s.strategy_type === 'conservative') setConservativePlanned(val);
                      else if (s.strategy_type === 'predicted') setPredictedPlanned(val);
                      else if (s.strategy_type === 'buffer') setBufferPlanned(val);
                      else setCustomPlanned(val);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-base font-extrabold text-white text-center focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Surplus & Shortage Stats */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-center">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Surplus</span>
                  <span className={`text-sm font-bold block ${s.surplus > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                    {s.surplus > 0 ? `+${s.surplus}` : '0'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">Shortage</span>
                  <span className={`text-sm font-bold block ${s.shortage > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                    {s.shortage > 0 ? `-${s.shortage}` : '0'}
                  </span>
                </div>
              </div>

              {/* Cost Metrics */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Batch Prep Cost:</span>
                  <span className="font-mono text-white font-semibold">₹{s.prep_cost.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Est. Surplus Cost:</span>
                  <span className={`font-mono font-semibold ${s.surplus_cost > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    ₹{s.surplus_cost.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Assessment Text */}
              <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800 leading-relaxed">
                {s.risk_assessment}
              </p>
            </div>
          );
        })}
      </div>

      {/* Comparison Chart Section */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 lg:p-7 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-amber-500" />
              Scenario Trade-Off Comparison Chart
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Visualizing Planned Meals vs Potential Surplus and Shortages across strategies
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Formula: Surplus = max(0, Prep - Pred) | Shortage = max(0, Pred - Prep)
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
              <XAxis dataKey="name" stroke="#64748B" fontSize={12} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#334155', borderRadius: '8px', color: '#F8FAFC' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="planned" fill="#3B82F6" name="Planned Quantity" radius={[4, 4, 0, 0]} />
              <Bar dataKey="predicted" fill="#64748B" name="Predicted Demand" radius={[4, 4, 0, 0]} />
              <Bar dataKey="surplus" fill="#F59E0B" name="Potential Surplus" radius={[4, 4, 0, 0]} />
              <Bar dataKey="shortage" fill="#EF4444" name="Potential Shortage" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Operational Recommendation & Cost Caveat */}
      {scenarioData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 space-y-2">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Recommended Decision Path
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">{scenarioData.recommendation}</p>
            <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-800">
              Final decision remains with the cafeteria chef or inventory supervisor.
            </p>
          </div>

          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 space-y-2">
            <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-4 h-4" /> Financial Calculation Transparency
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">{scenarioData.cost_explanation}</p>
          </div>
        </div>
      )}
    </div>
  );
};
