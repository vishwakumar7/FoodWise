import React, { useState, useEffect } from 'react';
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
      setRetrainMsg('Model retrained successfully on latest dataset.');
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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-md p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800">ML Model Performance & Evaluation</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Random Forest Regressor trained on 1,825 records with 80% train / 20% test chronological split.
          </p>
        </div>

        <button
          onClick={handleRetrain}
          disabled={retraining}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs py-2 px-3.5 rounded transition-colors disabled:opacity-50"
        >
          {retraining ? 'Retraining...' : 'Retrain Model'}
        </button>
      </div>

      {retrainMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-xs p-3 rounded">
          {retrainMsg}
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-md p-3.5 text-center">
          <div className="text-xs text-gray-500 font-medium">Model R² Score</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{metrics?.r2}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-md p-3.5 text-center">
          <div className="text-xs text-gray-500 font-medium">Mean Absolute Error</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{metrics?.mae} meals</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-md p-3.5 text-center">
          <div className="text-xs text-gray-500 font-medium">Baseline Error</div>
          <div className="text-2xl font-bold text-gray-500 mt-1">{metrics?.baseline_mae} meals</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-md p-3.5 text-center">
          <div className="text-xs text-gray-500 font-medium">Accuracy Gain</div>
          <div className="text-2xl font-bold text-green-600 mt-1">+{metrics?.improvement_percent}%</div>
        </div>
      </div>

      {/* Evaluation Table & Feature Importance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-md p-4 space-y-3">
          <h3 className="font-semibold text-sm text-gray-800 border-b border-gray-100 pb-2">
            Evaluation Metrics Comparison
          </h3>

          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
              <tr>
                <th className="py-2 px-3">Metric</th>
                <th className="py-2 px-3 text-right">Baseline Model</th>
                <th className="py-2 px-3 text-right">Random Forest</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              <tr>
                <td className="py-2 px-3 font-medium">MAE (Mean Absolute Error)</td>
                <td className="py-2 px-3 text-right text-gray-500">{metrics?.baseline_mae} meals</td>
                <td className="py-2 px-3 text-right font-bold text-blue-600">{metrics?.mae} meals</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-medium">RMSE (Root Mean Squared Error)</td>
                <td className="py-2 px-3 text-right text-gray-500">{metrics?.baseline_rmse} meals</td>
                <td className="py-2 px-3 text-right font-bold text-blue-600">{metrics?.rmse} meals</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-medium">R² Score</td>
                <td className="py-2 px-3 text-right text-gray-500">{metrics?.baseline_r2}</td>
                <td className="py-2 px-3 text-right font-bold text-blue-600">{metrics?.r2}</td>
              </tr>
            </tbody>
          </table>

          <div className="text-[11px] text-gray-500 pt-2 border-t border-gray-100">
            Note: Baseline model uses DummyRegressor predicting average demand. The Random Forest model achieves a +{metrics?.improvement_percent}% reduction in forecast error.
          </div>
        </div>

        {/* Feature Importance Chart */}
        <div className="bg-white border border-gray-200 rounded-md p-4 space-y-3">
          <h3 className="font-semibold text-sm text-gray-800 border-b border-gray-100 pb-2">
            Feature Importance Weightings (%)
          </h3>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={featureChartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="feature" stroke="#64748b" fontSize={10} tickLine={false} angle={-20} textAnchor="end" />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '4px', fontSize: '11px' }} />
                <Bar dataKey="importance" fill="#3b82f6" radius={[2, 2, 0, 0]} name="Weight" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
