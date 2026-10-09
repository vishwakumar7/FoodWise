import React, { useState, useEffect } from 'react';
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
import { PredictRequest, ScenariosResponse } from '../types';

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
      setError(err.message || 'Failed to evaluate scenarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    evaluate();
  }, [params.menu_type, params.expected_attendance, params.cost_per_meal]);

  const chartData = scenarioData?.scenarios.map((s) => ({
    name: s.strategy_type === 'conservative' ? 'Conservative' : s.strategy_type === 'predicted' ? 'Predicted' : s.strategy_type === 'buffer' ? 'Safety Buffer' : 'Custom',
    planned: s.planned_meals,
    predicted: Math.round(s.predicted_demand),
    surplus: s.surplus,
    shortage: s.shortage,
    prep_cost: s.prep_cost,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-md p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800">What-If Scenario Simulator</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Compare conservative, predicted, and safety buffer preparation strategies to balance food waste risk.
          </p>
        </div>

        {/* Input Controls */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <label className="text-gray-600 font-medium">Menu:</label>
            <select
              value={params.menu_type}
              onChange={(e) => setParams({ ...params, menu_type: e.target.value })}
              className="border border-gray-300 rounded px-2 py-1 text-gray-800 bg-white"
            >
              {MENU_TYPES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-gray-600 font-medium">Attendance:</label>
            <input
              type="number"
              min="50"
              max="700"
              value={params.expected_attendance}
              onChange={(e) => setParams({ ...params, expected_attendance: parseInt(e.target.value) || 100 })}
              className="border border-gray-300 rounded px-2 py-1 text-gray-800 w-16 text-center"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-gray-600 font-medium">Cost/Meal (₹):</label>
            <input
              type="number"
              min="5"
              max="500"
              value={params.cost_per_meal}
              onChange={(e) => setParams({ ...params, cost_per_meal: parseFloat(e.target.value) || 50 })}
              className="border border-gray-300 rounded px-2 py-1 text-gray-800 w-16 text-center"
            />
          </div>

          <button
            onClick={evaluate}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs py-1.5 px-3 rounded transition-colors"
          >
            {loading ? 'Recalculating...' : 'Recalculate'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded">
          {error}
        </div>
      )}

      {/* Scenario Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {scenarioData?.scenarios.map((s) => (
          <div key={s.strategy_type} className="bg-white border border-gray-200 rounded-md p-4 space-y-3">
            <div className="font-semibold text-sm text-gray-800 border-b border-gray-100 pb-2">
              {s.scenario_name}
            </div>

            <div className="text-xs space-y-1">
              <label className="text-gray-500 block">Planned Quantity:</label>
              <input
                type="number"
                min="0"
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
                className="w-full border border-gray-300 rounded px-2 py-1 text-base font-bold text-gray-800 text-center"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="bg-gray-50 border border-gray-200 rounded p-2 text-center">
                <span className="text-gray-500 text-[10px]">Surplus</span>
                <div className={`font-bold ${s.surplus > 0 ? 'text-orange-600' : 'text-gray-700'}`}>
                  {s.surplus > 0 ? `+${s.surplus}` : '0'}
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded p-2 text-center">
                <span className="text-gray-500 text-[10px]">Shortage</span>
                <div className={`font-bold ${s.shortage > 0 ? 'text-red-600' : 'text-gray-700'}`}>
                  {s.shortage > 0 ? `-${s.shortage}` : '0'}
                </div>
              </div>
            </div>

            <div className="text-xs space-y-1 pt-1 text-gray-600">
              <div className="flex justify-between">
                <span>Batch Cost:</span>
                <span className="font-semibold">₹{s.prep_cost}</span>
              </div>
              <div className="flex justify-between">
                <span>Surplus Cost:</span>
                <span className="font-semibold text-orange-600">₹{s.surplus_cost}</span>
              </div>
            </div>

            <p className="text-[11px] text-gray-500 pt-2 border-t border-gray-100">
              {s.risk_assessment}
            </p>
          </div>
        ))}
      </div>

      {/* Comparison Chart */}
      <div className="bg-white border border-gray-200 rounded-md p-4">
        <h3 className="font-semibold text-sm text-gray-800 mb-2">
          Scenario Trade-Off Chart
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Comparing planned batch quantities vs predicted demand, surplus, and shortage
        </p>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '4px', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
              <Bar dataKey="planned" fill="#3b82f6" name="Planned Quantity" />
              <Bar dataKey="predicted" fill="#94a3b8" name="Predicted Demand" />
              <Bar dataKey="surplus" fill="#f97316" name="Surplus Meals" />
              <Bar dataKey="shortage" fill="#ef4444" name="Shortage Meals" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Explanation */}
      {scenarioData && (
        <div className="bg-blue-50 border border-blue-200 text-blue-900 rounded-md p-4 text-xs space-y-1">
          <strong>Recommendation:</strong>
          <p>{scenarioData.recommendation}</p>
          <p className="text-gray-600 text-[11px] pt-1">{scenarioData.cost_explanation}</p>
        </div>
      )}
    </div>
  );
};
