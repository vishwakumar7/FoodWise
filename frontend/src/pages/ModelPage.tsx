import React, { useState, useEffect } from 'react';
import {
  Cpu,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Database,
  BarChart,
  ShieldCheck,
  Award,
  TrendingUp,
  Info
} from 'lucide-react';
import { ResponsiveContainer, BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
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
      setRetrainMsg('Model successfully retrained with latest records and reloaded in memory!');
    } catch (err: any) {
      setError(err.message || 'Retraining failed');
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Cpu className="w-6 h-6 text-amber-500" />
            Machine Learning Pipeline & Evaluation
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Random Forest Regressor evaluated against a baseline dummy model on temporal hold-out test records.
          </p>
        </div>

        <button
          onClick={handleRetrain}
          disabled={retraining}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-2 transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${retraining ? 'animate-spin' : ''}`} />
          {retraining ? 'Retraining Pipeline...' : 'Retrain Model via API'}
        </button>
      </div>

      {retrainMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{retrainMsg}</span>
        </div>
      )}

      {/* Model Spec Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Algorithm</span>
          <div className="text-xl font-black text-white mt-2">Random Forest</div>
          <span className="text-[11px] text-amber-400 mt-1 block">100 Estimators, Max Depth 12</span>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Temporal Train / Test Split</span>
          <div className="text-xl font-black text-white mt-2">
            {metrics?.train_records} / {metrics?.test_records}
          </div>
          <span className="text-[11px] text-sky-400 mt-1 block">80% Train, 20% Test (No Temporal Leakage)</span>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Model R² Score</span>
          <div className="text-2xl font-black text-emerald-400 mt-2">{metrics?.r2}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">High variance explanation</span>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Accuracy Improvement</span>
          <div className="text-2xl font-black text-amber-400 mt-2">+{metrics?.improvement_percent}%</div>
          <span className="text-[11px] text-slate-500 mt-1 block">MAE reduction over mean baseline</span>
        </div>
      </div>

      {/* Benchmark Comparison: Random Forest vs Baseline */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 lg:p-7 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              Evaluation Benchmark (Random Forest vs Baseline Dummy)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Evaluation on strictly unseen chronological test observations</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Evaluation Metric</th>
                <th className="px-4 py-3">Baseline Model (Mean Strategy)</th>
                <th className="px-4 py-3">FoodWise Random Forest</th>
                <th className="px-4 py-3 text-right">Relative Performance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr>
                <td className="px-4 py-3 font-semibold text-white">Mean Absolute Error (MAE)</td>
                <td className="px-4 py-3 font-mono text-slate-400">{metrics?.baseline_mae} meals</td>
                <td className="px-4 py-3 font-mono font-bold text-emerald-400">{metrics?.mae} meals</td>
                <td className="px-4 py-3 font-mono font-bold text-emerald-400 text-right">
                  -{metrics?.improvement_percent}% error
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-white">Root Mean Squared Error (RMSE)</td>
                <td className="px-4 py-3 font-mono text-slate-400">{metrics?.baseline_rmse} meals</td>
                <td className="px-4 py-3 font-mono font-bold text-emerald-400">{metrics?.rmse} meals</td>
                <td className="px-4 py-3 font-mono font-bold text-emerald-400 text-right">Substantially lower outlier error</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-white">Coefficient of Determination (R²)</td>
                <td className="px-4 py-3 font-mono text-slate-400">{metrics?.baseline_r2}</td>
                <td className="px-4 py-3 font-mono font-bold text-emerald-400">{metrics?.r2}</td>
                <td className="px-4 py-3 font-mono font-bold text-emerald-400 text-right">Strong predictive fit</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Feature Importances Bar Chart */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 lg:p-7 space-y-5">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Top Predictive Feature Importances</h3>
          <p className="text-xs text-slate-400 mt-0.5">Contribution of each input feature to tree ensemble decisions</p>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ReBarChart data={featureChartData} margin={{ top: 10, right: 20, left: 20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
              <XAxis dataKey="feature" stroke="#64748B" fontSize={11} tickLine={false} angle={-25} textAnchor="end" />
              <YAxis stroke="#64748B" fontSize={11} tickLine={false} unit="%" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#334155', borderRadius: '8px', color: '#F8FAFC' }}
                formatter={(val: any) => [`${val}%`, 'Relative Importance']}
              />
              <Bar dataKey="importance" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </ReBarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sample Test Holdout Predictions Table */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white">Hold-out Test Observations (Actual vs Model Prediction)</h3>
        <div className="overflow-x-auto max-h-72">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase font-semibold sticky top-0 border-b border-slate-800">
              <tr>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Menu</th>
                <th className="px-4 py-2.5 text-right">Actual Sold</th>
                <th className="px-4 py-2.5 text-right">Model Prediction</th>
                <th className="px-4 py-2.5 text-right">Residual Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {metrics?.sample_test_predictions.slice(0, 20).map((p, i) => (
                <tr key={i} className="hover:bg-slate-800/40">
                  <td className="px-4 py-2 font-mono">{p.date}</td>
                  <td className="px-4 py-2 font-semibold text-white">{p.menu_type}</td>
                  <td className="px-4 py-2 font-mono text-right">{p.actual}</td>
                  <td className="px-4 py-2 font-mono text-right text-amber-400 font-bold">{p.predicted}</td>
                  <td className="px-4 py-2 font-mono text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${Math.abs(p.error) <= 10 ? 'text-emerald-400' : 'text-slate-400'}`}>
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
