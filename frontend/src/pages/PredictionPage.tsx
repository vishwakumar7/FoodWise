import React, { useState } from 'react';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.predictDemand(formData);
      setPrediction(res);
    } catch (err: any) {
      setError(err.message || 'Prediction failed. Check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white border border-gray-200 rounded-md p-4">
        <h2 className="text-lg font-bold text-gray-800">Demand Prediction Form</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Enter operational inputs to predict meal demand using the trained Random Forest model.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-md p-5 space-y-4">
          <h3 className="font-semibold text-sm text-gray-800 border-b border-gray-200 pb-2">
            Input Features
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-gray-700 font-medium mb-1">Date</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-gray-800 bg-white"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Menu Category</label>
              <select
                value={formData.menu_type}
                onChange={(e) => setFormData({ ...formData, menu_type: e.target.value })}
                className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-gray-800 bg-white"
              >
                {MENU_TYPES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Expected Attendance (Students)
              </label>
              <input
                type="number"
                min="10"
                max="1000"
                required
                value={formData.expected_attendance}
                onChange={(e) => setFormData({ ...formData, expected_attendance: parseInt(e.target.value) || 0 })}
                className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-gray-800"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Temperature (°C)
              </label>
              <input
                type="number"
                step="0.5"
                min="10"
                max="50"
                required
                value={formData.temperature}
                onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) || 0 })}
                className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-gray-800"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Previous Day's Sales
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.prev_day_sales}
                onChange={(e) => setFormData({ ...formData, prev_day_sales: parseFloat(e.target.value) || 0 })}
                className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-gray-800"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Holiday Indicator
              </label>
              <select
                value={formData.is_holiday}
                onChange={(e) => setFormData({ ...formData, is_holiday: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-gray-800 bg-white"
              >
                <option value={0}>0 - Regular Working Day</option>
                <option value={1}>1 - Weekend / College Holiday</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Planned Preparation (Meals)
              </label>
              <input
                type="number"
                min="0"
                value={formData.planned_meals}
                onChange={(e) => setFormData({ ...formData, planned_meals: parseInt(e.target.value) || 0 })}
                className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-gray-800"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Cost Per Meal (₹)
              </label>
              <input
                type="number"
                min="1"
                value={formData.cost_per_meal}
                onChange={(e) => setFormData({ ...formData, cost_per_meal: parseFloat(e.target.value) || 1 })}
                className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-gray-800"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm py-2 px-4 rounded transition-colors disabled:opacity-50"
            >
              {loading ? 'Predicting...' : 'Predict Demand'}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-2.5 rounded">
              {error}
            </div>
          )}
        </form>

        {/* Prediction Results */}
        <div className="bg-white border border-gray-200 rounded-md p-5 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-sm text-gray-800 border-b border-gray-200 pb-2 mb-4">
              Prediction Output
            </h3>

            {prediction ? (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-100 rounded p-4 text-center">
                  <span className="text-xs text-blue-700 uppercase font-semibold">Predicted Demand</span>
                  <div className="text-3xl font-bold text-blue-900 mt-1">
                    {prediction.rounded_prediction} meals
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Estimated 80% range: {prediction.uncertainty_lower} to {prediction.uncertainty_upper} meals
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="border border-gray-200 rounded p-3 bg-gray-50">
                    <span className="text-gray-500">Planned Meals:</span>
                    <div className="text-base font-bold text-gray-800">{prediction.planned_meals}</div>
                  </div>
                  <div className="border border-gray-200 rounded p-3 bg-gray-50">
                    <span className="text-gray-500">Day of Week:</span>
                    <div className="text-base font-bold text-gray-800">{prediction.day_of_week}</div>
                  </div>
                  <div className="border border-gray-200 rounded p-3 bg-gray-50">
                    <span className="text-gray-500">Expected Surplus:</span>
                    <div className={`text-base font-bold ${prediction.surplus > 0 ? 'text-orange-600' : 'text-gray-800'}`}>
                      {prediction.surplus > 0 ? `+${prediction.surplus}` : '0'} meals
                    </div>
                  </div>
                  <div className="border border-gray-200 rounded p-3 bg-gray-50">
                    <span className="text-gray-500">Expected Shortage:</span>
                    <div className={`text-base font-bold ${prediction.shortage > 0 ? 'text-red-600' : 'text-gray-800'}`}>
                      {prediction.shortage > 0 ? `-${prediction.shortage}` : '0'} meals
                    </div>
                  </div>
                  <div className="border border-gray-200 rounded p-3 bg-gray-50">
                    <span className="text-gray-500">Preparation Cost:</span>
                    <div className="text-base font-bold text-gray-800">₹{prediction.prep_cost}</div>
                  </div>
                  <div className="border border-gray-200 rounded p-3 bg-gray-50">
                    <span className="text-gray-500">Surplus Cost Risk:</span>
                    <div className="text-base font-bold text-gray-800">₹{prediction.surplus_cost}</div>
                  </div>
                </div>

                <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded border border-gray-200 leading-relaxed">
                  <strong>Recommendation:</strong> {prediction.recommendation}
                </div>
              </div>
            ) : (
              <div className="text-center text-xs text-gray-400 py-12">
                Fill in the form on the left and click "Predict Demand" to view the output.
              </div>
            )}
          </div>

          {prediction && (
            <div className="pt-3 border-t border-gray-100">
              <button
                onClick={() => onNavigateToScenarios(formData)}
                className="w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium text-xs py-2 px-3 rounded border border-gray-300 transition-colors"
              >
                Send to What-If Scenario Simulator &rarr;
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
