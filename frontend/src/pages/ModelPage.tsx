import React, { useState, useEffect } from 'react';
import {
  Activity,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
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
import { ModelMetrics } from '../types';

export const ModelPage: React.FC = () => {
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [retraining, setRetraining] = useState<boolean>(false);
  const [retrainMsg, setRetrainMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const data = await api.getModelMetrics();
      setMetrics(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load model metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleRetrain = async () => {
    setRetraining(true);
    setRetrainMsg(null);
    setError(null);
    try {
      const res = await api.retrainModel();
      setMetrics(res.metrics);
      setRetrainMsg('Pipeline retrained and reloaded into active memory successfully.');
    } catch (err: any) {
      setError(err.message || 'Pipeline retraining failed');
    } finally {
      setRetraining(false);
    }
  };

  const featureChartData = metrics?.feature_importances
    ? Object.entries(metrics.feature_importances).map(([k, v]) => ({
        feature: k.replace('cat__', '').replace('num__', ''),
        importance: Number((v * 100).toFixed(1)),
      })).slice(0, 10)
    : [];

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-line pb-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-500">
              <span>Statistical Validation</span>
              <span>•</span>
              <span className="text-olive-700">Pipeline Performance & Weights</span>
            </div>
            <h2 className="font-serif text-2xl lg:text-3xl font-bold text-ink-950 tracking-tight mt-1">
              Model Diagnostics & Evaluation
            </h2>
            <p className="text-xs text-ink-500 mt-1 max-w-2xl">
              Inspect test metrics, feature weights, and residual errors computed on strictly unseen chronological test observations.
            </p>
          </div>

          <button
            onClick={handleRetrain}
            disabled={retraining}
            className="px-4 py-2 rounded text-xs font-semibold bg-olive-700 hover:bg-olive-800 text-white flex items-center gap-2 transition-colors disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${retraining ? 'animate-spin' : ''}`} />
            {retraining ? 'Retraining Pipeline...' : 'Retrain Pipeline via API'}
          </button>
        </div>
      </div>

      {retrainMsg && (
        <div className="p-3 rounded border border-olive-200 bg-olive-50 text-olive-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-olive-600" />
          <span>{retrainMsg}</span>
        </div>
      )}

      {/* Architecture Spec Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-line rounded-lg p-4">
          <span className="text-[11px] font-semibold text-ink-500 uppercase tracking-wider">Algorithm</span>
          <div className="font-serif text-xl font-bold text-ink-950 mt-1">Random Forest</div>
          <span className="text-[11px] text-ink-400 mt-0.5 block font-mono">100 Trees • Max Depth 12</span>
        </div>

        <div className="bg-card border border-line rounded-lg p-4">
          <span className="text-[11px] font-semibold text-ink-500 uppercase tracking-wider">Temporal Partition</span>
          <div className="font-serif text-xl font-bold text-ink-950 mt-1 font-tabular">
            {metrics?.train_records} / {metrics?.test_records}
          </div>
          <span className="text-[11px] text-ink-400 mt-0.5 block font-mono">80% Train, 20% Test (No Leakage)</span>
        </div>

        <div className="bg-card border border-line rounded-lg p-4">
          <span className="text-[11px] font-semibold text-ink-500 uppercase tracking-wider">Test Set R²</span>
          <div className="font-serif text-2xl font-bold text-olive-800 mt-1 font-tabular">{metrics?.r2}</div>
          <span className="text-[11px] text-ink-400 mt-0.5 block">High variance explanation</span>
        </div>

        <div className="bg-card border border-line rounded-lg p-4">
          <span className="text-[11px] font-semibold text-ink-500 uppercase tracking-wider">Error Reduction</span>
          <div className="font-serif text-2xl font-bold text-warm-700 mt-1 font-tabular">+{metrics?.improvement_percent}%</div>
          <span className="text-[11px] text-ink-400 mt-0.5 block">Over mean baseline dummy</span>
        </div>
      </div>

      {/* Benchmark Evaluation Table */}
      <div className="border border-line rounded-lg overflow-hidden bg-card space-y-3 p-5">
        <div className="pb-3 border-b border-line">
          <h3 className="font-serif text-sm font-bold text-ink-950">
            Model Benchmark (Random Forest vs Mean Baseline Dummy)
          </h3>
          <p className="text-xs text-ink-500">
            Evaluated on strictly chronologically unseen holdout test observations
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-canvas-subtle border-b border-line text-ink-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Evaluation Metric</th>
                <th className="px-4 py-3">Baseline Model (Mean Strategy)</th>
                <th className="px-4 py-3">FoodWise Random Forest</th>
                <th className="px-4 py-3 text-right">Relative Accuracy Gain</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-ink-700">
              <tr>
                <td className="px-4 py-3 font-semibold text-ink-950">Mean Absolute Error (MAE)</td>
                <td className="px-4 py-3 font-mono text-ink-500 font-tabular">{metrics?.baseline_mae} portions</td>
                <td className="px-4 py-3 font-mono font-bold text-olive-800 font-tabular">{metrics?.mae} portions</td>
                <td className="px-4 py-3 font-mono font-bold text-olive-800 text-right font-tabular">
                  -{metrics?.improvement_percent}% error reduction
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-ink-950">Root Mean Squared Error (RMSE)</td>
                <td className="px-4 py-3 font-mono text-ink-500 font-tabular">{metrics?.baseline_rmse} portions</td>
                <td className="px-4 py-3 font-mono font-bold text-olive-800 font-tabular">{metrics?.rmse} portions</td>
                <td className="px-4 py-3 text-ink-600 text-right">Substantially lower peak error</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-ink-950">Coefficient of Determination (R²)</td>
                <td className="px-4 py-3 font-mono text-ink-500 font-tabular">{metrics?.baseline_r2}</td>
                <td className="px-4 py-3 font-mono font-bold text-olive-800 font-tabular">{metrics?.r2}</td>
                <td className="px-4 py-3 text-ink-600 text-right">Strong predictive variance coverage</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Feature Importances Chart */}
      <div className="border border-line rounded-lg p-5 bg-card space-y-4">
        <div className="pb-3 border-b border-line">
          <h3 className="font-serif text-sm font-bold text-ink-950">
            Feature Importance Weightings
          </h3>
          <p className="text-xs text-ink-500">
            Relative contribution of each feature to Random Forest decision splits
          </p>
        </div>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={featureChartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#E5E5DF" vertical={false} />
              <XAxis dataKey="feature" stroke="#77807A" fontSize={10} tickLine={false} angle={-20} textAnchor="end" />
              <YAxis stroke="#77807A" fontSize={10} tickLine={false} unit="%" />
              <Tooltip
                contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#D3D3CB', borderRadius: '4px', fontSize: '11px', color: '#1F2421' }}
                formatter={(val: any) => [`${val}%`, 'Relative Weight']}
              />
              <Bar dataKey="importance" fill="#314F3B" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Holdout Residual Inspection Table */}
      <div className="border border-line rounded-lg p-5 bg-card space-y-3">
        <div className="pb-3 border-b border-line">
          <h3 className="font-serif text-sm font-bold text-ink-950">
            Holdout Test Observations & Residual Errors
          </h3>
          <p className="text-xs text-ink-500">
            Sample test set comparison between actual recorded sales and model forecasts
          </p>
        </div>

        <div className="overflow-x-auto max-h-64">
          <table className="w-full text-left text-xs">
            <thead className="bg-canvas-subtle border-b border-line text-ink-600 font-semibold uppercase tracking-wider text-[11px] sticky top-0">
              <tr>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Menu</th>
                <th className="px-4 py-2.5 text-right">Actual Sold</th>
                <th className="px-4 py-2.5 text-right">Model Forecast</th>
                <th className="px-4 py-2.5 text-right">Residual Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-ink-700">
              {metrics?.sample_test_predictions.slice(0, 20).map((p, i) => (
                <tr key={i} className="hover:bg-canvas-subtle/70">
                  <td className="px-4 py-2 font-mono text-ink-900">{p.date}</td>
                  <td className="px-4 py-2 font-semibold text-ink-950">{p.menu_type}</td>
                  <td className="px-4 py-2 font-mono text-right font-tabular">{p.actual}</td>
                  <td className="px-4 py-2 font-mono text-right font-bold text-olive-800 font-tabular">{p.predicted}</td>
                  <td className="px-4 py-2 font-mono text-right font-tabular">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                      Math.abs(p.error) <= 10 ? 'text-olive-800 bg-olive-50' : 'text-ink-600'
                    }`}>
                      {p.error > 0 ? `+${p.error}` : p.error}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
