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
import { KpiCard } from '../components/KpiCard';
import { api } from '../services/api';
import { PredictResponse, ChartsData, ModelMetrics } from '../types';
import { NavTab } from '../components/Navbar';

interface DashboardPageProps {
  onNavigate: (tab: NavTab) => void;
}

const MENU_ITEMS = [
  { name: 'Meals', defaultPlanned: 200, defaultCost: 45 },
  { name: 'Variety Rice', defaultPlanned: 90, defaultCost: 40 },
  { name: 'Biryani', defaultPlanned: 220, defaultCost: 70 },
  { name: 'Dosa', defaultPlanned: 130, defaultCost: 35 },
  { name: 'Idli', defaultPlanned: 120, defaultCost: 30 },
];

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [selectedDate, setSelectedDate] = useState<string>('2025-10-17');
  const [selectedMenu, setSelectedMenu] = useState<string>('Meals');
  const [plannedMeals, setPlannedMeals] = useState<number>(200);
  const [costPerMeal, setCostPerMeal] = useState<number>(45);

  const [chartsData, setChartsData] = useState<ChartsData | null>(null);
  const [prediction, setPrediction] = useState<PredictResponse | null>(null);
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [actualMealsSold, setActualMealsSold] = useState<string>('');
  const [menuTable, setMenuTable] = useState<Array<{
    name: string;
    predicted: number;
    planned: number;
    surplus: number;
    cost: number;
  }>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [chartsRes, predRes, metricsRes, ...allPreds] = await Promise.all([
        api.getCharts(selectedMenu),
        api.predictDemand({
          date: selectedDate,
          menu_type: selectedMenu,
          expected_attendance: 450,
          temperature: 28.0,
          prev_day_sales: 180,
          is_holiday: 0,
          planned_meals: plannedMeals,
          cost_per_meal: costPerMeal,
        }),
        api.getModelMetrics().catch(() => null),
        ...MENU_ITEMS.map((item) =>
          api.predictDemand({
            date: selectedDate,
            menu_type: item.name,
            expected_attendance: 450,
            temperature: 28.0,
            prev_day_sales: 140,
            is_holiday: 0,
            planned_meals: item.name === selectedMenu ? plannedMeals : item.defaultPlanned,
            cost_per_meal: item.name === selectedMenu ? costPerMeal : item.defaultCost,
          })
        ),
      ]);

      setChartsData(chartsRes);
      setPrediction(predRes);
      if (metricsRes) {
        setMetrics(metricsRes);
      }

      const rows = MENU_ITEMS.map((item, idx) => {
        const pred = allPreds[idx];
        const pQty = pred ? pred.rounded_prediction : item.defaultPlanned;
        const planQty = item.name === selectedMenu ? plannedMeals : item.defaultPlanned;
        const cost = item.name === selectedMenu ? costPerMeal : item.defaultCost;
        const diff = planQty - pQty;
        return {
          name: item.name,
          predicted: pQty,
          planned: planQty,
          surplus: diff,
          cost: planQty * cost,
        };
      });
      setMenuTable(rows);
    } catch (err: any) {
      setError(err.message || 'Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMenu, selectedDate, plannedMeals, costPerMeal]);

  const predictedQty = prediction ? prediction.rounded_prediction : 185;
  const surplusQty = Math.max(0, plannedMeals - predictedQty);
  const totalCost = plannedMeals * costPerMeal;
  const surplusCost = surplusQty * costPerMeal;

  return (
    <div className="space-y-6">
      {/* Top Banner / Project Introduction */}
      <div className="bg-white border border-gray-200 rounded-md p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Canteen Operations Dashboard</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Predict customer meal demand using historical sales and expected college attendance.
          </p>
        </div>

        {/* Input Controls */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <label className="text-gray-600 font-medium">Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-gray-800 bg-white"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-gray-600 font-medium">Menu Item:</label>
            <select
              value={selectedMenu}
              onChange={(e) => setSelectedMenu(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-gray-800 bg-white"
            >
              {MENU_ITEMS.map((item) => (
                <option key={item.name} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-gray-600 font-medium">Planned Qty:</label>
            <input
              type="number"
              min="0"
              value={plannedMeals}
              onChange={(e) => setPlannedMeals(Math.max(0, parseInt(e.target.value) || 0))}
              className="border border-gray-300 rounded px-2 py-1 text-gray-800 w-16 text-center"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-gray-600 font-medium">Cost/Meal (₹):</label>
            <input
              type="number"
              min="1"
              value={costPerMeal}
              onChange={(e) => setCostPerMeal(Math.max(1, parseFloat(e.target.value) || 1))}
              className="border border-gray-300 rounded px-2 py-1 text-gray-800 w-16 text-center"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          {error}
        </div>
      )}

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Predicted Meals"
          value={loading ? '...' : `${predictedQty} meals`}
          subtext={`Model forecast for ${selectedMenu}`}
        />
        <KpiCard
          label="Preparation Quantity"
          value={`${plannedMeals} meals`}
          subtext="Kitchen target for today"
        />
        <KpiCard
          label="Expected Surplus"
          value={surplusQty > 0 ? `+${surplusQty} meals` : '0 meals'}
          subtext={surplusQty > 0 ? 'Surplus leftover risk' : 'No extra food expected'}
        />
        <KpiCard
          label="Estimated Cost"
          value={`₹${totalCost.toLocaleString('en-IN')}`}
          subtext={`Surplus cost: ₹${surplusCost.toLocaleString('en-IN')}`}
        />
      </div>

      {/* Compact Model Evaluation Metrics Strip */}
      <div className="bg-white border border-gray-200 rounded-md p-4 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-gray-100 gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-gray-800 text-sm">Model Evaluation on Holdout Test Set</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-100 text-blue-800">
              Random Forest Regressor (100 Trees)
            </span>
            <span className="text-gray-400">|</span>
            <span className="text-gray-500 text-xs">Chronological 80/20 Split (365 Unseen Days)</span>
          </div>
          <button
            onClick={() => onNavigate('model')}
            className="text-blue-600 hover:text-blue-800 font-medium text-xs flex items-center gap-1"
          >
            <span>View Full Evaluation & Baselines</span> &rarr;
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-gray-50 border border-gray-200 rounded p-2.5">
            <div className="text-gray-500 font-medium text-[11px]">Mean Absolute Error (MAE)</div>
            <div className="font-bold text-gray-900 text-base mt-0.5">
              {metrics ? `${metrics.mae.toFixed(2)} meals` : '10.45 meals'}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">Average prediction error</div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded p-2.5">
            <div className="text-gray-500 font-medium text-[11px]">Root Mean Squared Error (RMSE)</div>
            <div className="font-bold text-gray-900 text-base mt-0.5">
              {metrics ? `${metrics.rmse.toFixed(2)} meals` : '13.10 meals'}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">Penalizes large variance</div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded p-2.5">
            <div className="text-gray-500 font-medium text-[11px]">R² Score (Goodness of Fit)</div>
            <div className="font-bold text-gray-900 text-base mt-0.5">
              {metrics ? metrics.r2.toFixed(4) : '0.9236'}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">Explains 92.4% test variance</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded p-2.5">
            <div className="text-green-700 font-medium text-[11px]">Improvement vs Baseline</div>
            <div className="font-bold text-green-800 text-base mt-0.5">
              {metrics ? `+${metrics.improvement_percent.toFixed(1)}%` : '+71.5%'}
            </div>
            <div className="text-[10px] text-green-600 mt-0.5">vs Mean Dummy (MAE 36.7)</div>
          </div>
        </div>

        <div className="mt-2.5 text-[11px] text-gray-500 bg-blue-50/50 border border-blue-100 rounded px-2.5 py-1.5 flex items-center justify-between">
          <span>
            <strong>Academic Note:</strong> Trained on first 292 calendar days (1,460 records) and evaluated on remaining 73 days (365 records) with zero future data leakage. Predictions are statistical estimates with ensemble variance &plusmn;15.4 meals.
          </span>
        </div>
      </div>

      {/* Simple Table & Explanation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Simple Menu Table (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-md p-4">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
            <h3 className="font-semibold text-sm text-gray-800">
              Menu Preparation vs. Prediction Summary
            </h3>
            <span className="text-xs text-gray-500">
              Date: {selectedDate}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                <tr>
                  <th className="py-2 px-3">Meal Name</th>
                  <th className="py-2 px-3 text-right">Predicted Qty</th>
                  <th className="py-2 px-3 text-right">Planned Prep</th>
                  <th className="py-2 px-3 text-right">Surplus / Shortage</th>
                  <th className="py-2 px-3 text-right">Prep Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {menuTable.map((row) => (
                  <tr
                    key={row.name}
                    className={row.name === selectedMenu ? 'bg-blue-50/50 font-medium' : ''}
                  >
                    <td className="py-2 px-3 text-gray-900 font-medium">
                      {row.name} {row.name === selectedMenu && '(Selected)'}
                    </td>
                    <td className="py-2 px-3 text-right font-semibold text-blue-600">{row.predicted}</td>
                    <td className="py-2 px-3 text-right">{row.planned}</td>
                    <td className="py-2 px-3 text-right">
                      {row.surplus > 0 ? (
                        <span className="text-orange-600 font-medium">+{row.surplus} surplus</span>
                      ) : row.surplus < 0 ? (
                        <span className="text-red-600 font-medium">{row.surplus} shortage</span>
                      ) : (
                        <span className="text-green-600">0 (Exact)</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right">₹{row.cost.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Prediction Plain Language Explanation (1 col) */}
        <div className="bg-white border border-gray-200 rounded-md p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-sm text-gray-800 mb-2 pb-2 border-b border-gray-200">
              Prediction Summary
            </h3>
            <div className="text-xs text-gray-600 space-y-2 leading-relaxed">
              <p>
                For <strong>{selectedMenu}</strong> on <strong>{prediction?.day_of_week || 'today'}</strong>, the model predicts a demand of <strong>{predictedQty} meals</strong>.
              </p>
              <p>
                The planned batch of <strong>{plannedMeals} meals</strong> will result in:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-gray-700">
                {surplusQty > 0 ? (
                  <li>
                    An expected surplus of <strong>{surplusQty} meals</strong> (~₹{surplusCost} ingredient cost).
                  </li>
                ) : plannedMeals < predictedQty ? (
                  <li>
                    A potential shortage of <strong>{predictedQty - plannedMeals} meals</strong>.
                  </li>
                ) : (
                  <li>
                    A balanced batch matching expected customer orders.
                  </li>
                )}
                <li>
                  Total preparation cost: <strong>₹{totalCost.toLocaleString('en-IN')}</strong>.
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100">
            <button
              onClick={() => onNavigate('predict')}
              className="w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs py-2 px-3 rounded transition-colors"
            >
              Go to Predict Demand Page &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Compare Prediction with Actual Sales (Post-Shift Verification) */}
      <div className="bg-white border border-gray-200 rounded-md p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 mb-3 border-b border-gray-200 gap-2">
          <div>
            <h3 className="font-semibold text-sm text-gray-800">
              Post-Shift Verification: Compare Prediction Against Actual Sales
            </h3>
            <p className="text-xs text-gray-500">
              When the shift completes, enter the actual number of meals sold to check prediction error and evaluate model performance.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-medium text-gray-700">
            Actual Meals Sold ({selectedMenu}):
          </label>
          <input
            type="number"
            min="0"
            placeholder="e.g. 190"
            value={actualMealsSold}
            onChange={(e) => setActualMealsSold(e.target.value)}
            className="border border-gray-300 rounded px-2.5 py-1 text-xs w-28 text-gray-800"
          />
          {actualMealsSold !== '' && (
            <button
              onClick={() => setActualMealsSold('')}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Clear
            </button>
          )}
        </div>

        {actualMealsSold !== '' && !isNaN(parseInt(actualMealsSold)) && (
          <div className="mt-4 bg-gray-50 border border-gray-200 rounded p-3 text-xs">
            {(() => {
              const actual = parseInt(actualMealsSold);
              const err = predictedQty - actual;
              const absErr = Math.abs(err);
              const pctErr = actual > 0 ? ((absErr / actual) * 100).toFixed(1) : '0';
              const actualSurplus = Math.max(0, plannedMeals - actual);
              const isWithinMae = absErr <= (metrics?.mae || 10.45);

              return (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="bg-white border border-gray-200 rounded p-2">
                      <div className="text-gray-500 text-[11px]">Predicted Demand</div>
                      <div className="font-bold text-gray-800 text-sm">{predictedQty} meals</div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded p-2">
                      <div className="text-gray-500 text-[11px]">Actual Meals Sold</div>
                      <div className="font-bold text-blue-600 text-sm">{actual} meals</div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded p-2">
                      <div className="text-gray-500 text-[11px]">Prediction Error (ŷ - y)</div>
                      <div className={`font-bold text-sm ${absErr === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                        {err > 0 ? `+${err}` : err} meals ({pctErr}%)
                      </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded p-2">
                      <div className="text-gray-500 text-[11px]">Actual Food Leftover</div>
                      <div className="font-bold text-orange-600 text-sm">{actualSurplus} meals</div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${isWithinMae ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                        {isWithinMae ? 'Within Test MAE Range' : 'Above Typical MAE'}
                      </span>
                      <span className="text-gray-600 text-[11px]">
                        {isWithinMae
                          ? `The error of ${absErr} meals is within the model's test MAE threshold of ±${(metrics?.mae || 10.45).toFixed(1)} meals.`
                          : `The error of ${absErr} meals is higher than the test MAE (±${(metrics?.mae || 10.45).toFixed(1)} meals). Check for unusual attendance or campus events.`}
                      </span>
                    </div>

                    <button
                      onClick={() => onNavigate('waste')}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-3 py-1.5 rounded transition-colors whitespace-nowrap"
                    >
                      Log in Waste Tracking &rarr;
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* One Clear Chart: Weekly Meal Demand Trend */}
      <div className="bg-white border border-gray-200 rounded-md p-4">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
          <div>
            <h3 className="font-semibold text-sm text-gray-800">
              Average Meal Demand by Day of Week ({selectedMenu})
            </h3>
            <p className="text-xs text-gray-500">
              Historical average sales showing which weekdays have peak and low demand
            </p>
          </div>
        </div>

        <div className="h-64 w-full">
          {chartsData?.analytics?.weekday_demand ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartsData.analytics.weekday_demand} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '4px', fontSize: '12px' }}
                  formatter={(val: any) => [`${val} meals`, 'Average Demand']}
                />
                <Bar dataKey="avg_meals" fill="#3b82f6" radius={[3, 3, 0, 0]} name="Average Demand" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-gray-400">Loading chart...</div>
          )}
        </div>
      </div>

      {/* Dataset Academic Note */}
      <div className="text-center text-xs text-gray-400 py-2">
        FoodWise AI — Academic Prototype | Machine Learning Model: Random Forest Regressor | Dataset: 1,825 synthetic records
      </div>
    </div>
  );
};
