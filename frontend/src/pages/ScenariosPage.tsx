import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  ChefHat,
  RefreshCw,
  Scale,
  Info,
  Check,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
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
      setError(err.message || 'Failed to evaluate preparation scenarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    evaluate();
  }, [params.menu_type, params.expected_attendance, params.cost_per_meal]);

  const chartData = scenarioData?.scenarios.map((s) => ({
    name: s.strategy_type === 'conservative' ? 'Conservative' : s.strategy_type === 'predicted' ? 'Forecast' : s.strategy_type === 'buffer' ? 'Safety Buffer' : 'Custom',
    planned: s.planned_meals,
    predicted: Math.round(s.predicted_demand),
    surplus: s.surplus,
    shortage: s.shortage,
    prep_cost: s.prep_cost,
    surplus_cost: s.surplus_cost,
  })) || [];

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-line pb-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-500">
              <span>Production Planning</span>
              <span>•</span>
              <span className="text-olive-700">What-If Batch Size Simulator</span>
            </div>
            <h2 className="font-serif text-2xl lg:text-3xl font-bold text-ink-950 tracking-tight mt-1">
              Batch Preparation Strategies
            </h2>
            <p className="text-xs text-ink-500 mt-1 max-w-2xl">
              Compare trade-offs between zero-waste conservative cooking, exact forecast matching, and customer service safety buffers.
            </p>
          </div>

          <button
            onClick={evaluate}
            disabled={loading}
            className="px-4 py-2 rounded text-xs font-semibold bg-olive-700 hover:bg-olive-800 text-white flex items-center gap-2 transition-colors disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Recalculate Batch Scenarios
          </button>
        </div>
      </div>

      {/* Control Strip */}
      <div className="p-4 rounded-lg bg-card border border-line flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <ChefHat className="w-3.5 h-3.5 text-ink-400" />
            <span className="text-ink-600 font-medium">Menu Category:</span>
            <select
              value={params.menu_type}
              onChange={(e) => setParams({ ...params, menu_type: e.target.value })}
              className="bg-canvas-subtle border border-line rounded px-2.5 py-1 text-ink-900 font-semibold focus:outline-none focus:border-olive-700"
            >
              {MENU_TYPES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-ink-600 font-medium">Headcount:</span>
            <input
              type="number"
              min="50"
              max="700"
              value={params.expected_attendance}
              onChange={(e) => setParams({ ...params, expected_attendance: parseInt(e.target.value) || 100 })}
              className="w-20 bg-canvas-subtle border border-line rounded px-2 py-1 text-ink-900 font-semibold font-mono text-center focus:outline-none focus:border-olive-700"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-ink-600 font-medium">Unit Cost:</span>
            <div className="relative">
              <span className="absolute left-2 top-1 text-ink-400 text-xs">₹</span>
              <input
                type="number"
                min="5"
                max="500"
                value={params.cost_per_meal}
                onChange={(e) => setParams({ ...params, cost_per_meal: parseFloat(e.target.value) || 50 })}
                className="w-20 pl-5 pr-2 bg-canvas-subtle border border-line rounded py-1 text-ink-900 font-semibold font-mono text-center focus:outline-none focus:border-olive-700"
              />
            </div>
          </div>
        </div>

        {scenarioData && (
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-ink-500">Model Baseline Forecast:</span>
            <span className="font-bold text-olive-800 bg-olive-50 px-2 py-0.5 rounded border border-olive-200">
              {scenarioData.predicted_demand} portions
            </span>
          </div>
        )}
      </div>

      {/* Strategy Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {scenarioData?.scenarios.map((s) => {
          const isSelected = selectedStrategy === s.strategy_type;
          return (
            <div
              key={s.strategy_type}
              onClick={() => setSelectedStrategy(s.strategy_type)}
              className={`cursor-pointer bg-card border rounded-lg p-5 space-y-4 transition-colors flex flex-col justify-between ${
                isSelected
                  ? 'border-olive-700 ring-1 ring-olive-700/30 shadow-sm'
                  : 'border-line hover:border-line-strong'
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-line">
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink-800">
                    {s.scenario_name}
                  </span>
                  {isSelected && (
                    <span className="text-[10px] font-semibold text-olive-800 bg-olive-50 px-2 py-0.5 rounded border border-olive-200">
                      Active
                    </span>
                  )}
                </div>

                {/* Planned Quantity Input */}
                <div className="mt-3 space-y-1">
                  <span className="text-[11px] text-ink-500">Planned Batch Quantity:</span>
                  <div className="flex items-center gap-1.5">
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
                      className="w-full bg-canvas-subtle border border-line rounded px-3 py-1.5 font-serif text-xl font-bold text-ink-950 font-tabular text-center focus:outline-none focus:border-olive-700"
                    />
                    <span className="text-xs text-ink-500 font-sans">portions</span>
                  </div>
                </div>

                {/* Surplus & Shortage Stats */}
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-line text-xs font-mono">
                  <div className="p-2 rounded bg-canvas-subtle border border-line">
                    <span className="text-[10px] text-ink-400 block font-sans">Est. Surplus</span>
                    <span className={`text-sm font-bold block ${s.surplus > 0 ? 'text-warm-700' : 'text-ink-600'}`}>
                      {s.surplus > 0 ? `+${s.surplus}` : '0'}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-canvas-subtle border border-line">
                    <span className="text-[10px] text-ink-400 block font-sans">Est. Shortage</span>
                    <span className={`text-sm font-bold block ${s.shortage > 0 ? 'text-terracotta-700' : 'text-ink-600'}`}>
                      {s.shortage > 0 ? `-${s.shortage}` : '0'}
                    </span>
                  </div>
                </div>

                {/* Cost Outlay Breakdown */}
                <div className="space-y-1.5 mt-3 text-xs">
                  <div className="flex justify-between text-ink-600">
                    <span>Batch Prep Cost:</span>
                    <span className="font-mono font-bold text-ink-900">₹{s.prep_cost.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-ink-600">
                    <span>Surplus Cost Risk:</span>
                    <span className={`font-mono font-bold ${s.surplus_cost > 0 ? 'text-warm-700' : 'text-olive-700'}`}>
                      ₹{s.surplus_cost.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Assessment Text */}
              <div className="pt-3 border-t border-line text-[11px] text-ink-600 leading-relaxed">
                {s.risk_assessment}
              </div>
            </div>
          );
        })}
      </div>

      {/* Trade-Off Comparison Chart */}
      <div className="border border-line rounded-lg p-5 bg-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-line">
          <div>
            <h3 className="font-serif text-sm font-bold text-ink-950">
              Strategy Trade-Off Visual Comparison
            </h3>
            <p className="text-xs text-ink-500">
              Planned batch quantities against expected surplus and stockout exposure
            </p>
          </div>
          <span className="text-[11px] text-ink-400 font-mono">
            Surplus = max(0, Prep - Pred) • Shortage = max(0, Pred - Prep)
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 15, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#E5E5DF" vertical={false} />
              <XAxis dataKey="name" stroke="#77807A" fontSize={11} tickLine={false} />
              <YAxis stroke="#77807A" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#D3D3CB', borderRadius: '4px', fontSize: '11px', color: '#1F2421' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="planned" fill="#2E3430" name="Planned Quantity" radius={[2, 2, 0, 0]} />
              <Bar dataKey="predicted" fill="#77807A" name="Model Forecast" radius={[2, 2, 0, 0]} />
              <Bar dataKey="surplus" fill="#A4771D" name="Potential Surplus" radius={[2, 2, 0, 0]} />
              <Bar dataKey="shortage" fill="#C85435" name="Potential Shortage" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Advisory & Financial Transparency Notes */}
      {scenarioData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="border border-line rounded-lg p-4 bg-card space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-olive-800">
              Operational Recommendation
            </h4>
            <p className="text-xs text-ink-700 leading-relaxed">
              {scenarioData.recommendation}
            </p>
            <p className="text-[11px] text-ink-500 pt-2 border-t border-line">
              The kitchen supervisor retains final authority over portion adjustments.
            </p>
          </div>

          <div className="border border-line rounded-lg p-4 bg-card space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-500">
              Financial Calculation Method
            </h4>
            <p className="text-xs text-ink-600 leading-relaxed">
              {scenarioData.cost_explanation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
