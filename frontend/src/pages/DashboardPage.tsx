import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Coins,
  ShieldAlert,
  ArrowRight,
  Calendar,
  Layers,
  ChefHat,
  Scale,
  DollarSign,
  Info,
  CheckCircle2
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area } from 'recharts';
import { KpiCard } from '../components/KpiCard';
import { api } from '../services/api';
import { DashboardSummary, PredictResponse, ChartsData } from '../types';
import { NavTab } from '../components/Sidebar';

interface DashboardPageProps {
  onNavigate: (tab: NavTab) => void;
}

const MENU_TYPES = ['Meals', 'Variety Rice', 'Biryani', 'Dosa', 'Idli'];

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [selectedDate, setSelectedDate] = useState<string>('2025-10-17');
  const [selectedMenu, setSelectedMenu] = useState<string>('Meals');
  const [plannedMealsInput, setPlannedMealsInput] = useState<number>(200);
  const [costPerMealInput, setCostPerMealInput] = useState<number>(45);

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [chartsData, setChartsData] = useState<ChartsData | null>(null);
  const [prediction, setPrediction] = useState<PredictResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [summaryRes, chartsRes, predRes] = await Promise.all([
        api.getSummary(),
        api.getCharts(selectedMenu),
        api.predictDemand({
          date: selectedDate,
          menu_type: selectedMenu,
          expected_attendance: 450,
          temperature: 28.0,
          prev_day_sales: 180,
          is_holiday: 0,
          planned_meals: plannedMealsInput,
          cost_per_meal: costPerMealInput,
        }),
      ]);
      setSummary(summaryRes);
      setChartsData(chartsRes);
      setPrediction(predRes);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedMenu, selectedDate]);

  // Recalculate quick KPI figures if planned meals or cost changes locally
  const predictedDemand = prediction ? prediction.rounded_prediction : 185;
  const plannedMeals = plannedMealsInput;
  const surplus = Math.max(0, plannedMeals - predictedDemand);
  const shortage = Math.max(0, predictedDemand - plannedMeals);
  const prepCost = plannedMeals * costPerMealInput;
  const surplusCost = surplus * costPerMealInput;

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Synthetic Dataset Transparency Notice */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-[#111827] to-slate-900 border border-slate-800 p-4 lg:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0 mt-0.5">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              Prototype Mode: Reproducible Synthetic Operational Dataset
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                1,825 Records
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Trained on a synthetic campus canteen simulation featuring realistic variations across student attendance, weekdays, menu types, and temperatures. Surplus costs are approximations of unrecovered preparation expenses and do not represent verified accounting loss.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('model')}
          className="whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5 shrink-0"
        >
          View Model Specs <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Date & Menu Category Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#111827] border border-slate-800 p-4 rounded-2xl">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-slate-300">Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <ChefHat className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-slate-300">Menu Category:</span>
            <select
              value={selectedMenu}
              onChange={(e) => setSelectedMenu(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              {MENU_TYPES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-400">Planned Meals:</span>
            <input
              type="number"
              min="0"
              max="1000"
              value={plannedMealsInput}
              onChange={(e) => setPlannedMealsInput(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white text-center focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-400">Cost/Meal:</span>
            <div className="relative">
              <span className="absolute left-2.5 top-1 text-xs text-slate-500">₹</span>
              <input
                type="number"
                min="5"
                max="500"
                value={costPerMealInput}
                onChange={(e) => setCostPerMealInput(Math.max(1, parseFloat(e.target.value) || 1))}
                className="w-20 pl-6 bg-slate-900 border border-slate-700 rounded-lg py-1 text-xs text-white text-center focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 6 Required KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* KPI 1 */}
        <KpiCard
          title="Predicted Meals Today"
          value={loading ? '...' : `${predictedDemand} meals`}
          subtitle={`Random Forest inference for ${selectedMenu}`}
          icon={TrendingUp}
          variant="amber"
          badge={prediction ? prediction.day_of_week : 'Active'}
          tooltip="ML forecast based on expected attendance, day of week, weather, and lagged demand."
        />

        {/* KPI 2 */}
        <KpiCard
          title="Planned Meals"
          value={`${plannedMeals} meals`}
          subtitle="Target kitchen batch preparation"
          icon={ChefHat}
          variant="blue"
          badge={plannedMeals > predictedDemand ? 'Above Forecast' : plannedMeals < predictedDemand ? 'Lean Batch' : 'Matched'}
          tooltip="Meals scheduled for cooking in today's kitchen shift."
        />

        {/* KPI 3 */}
        <KpiCard
          title="Estimated Surplus"
          value={surplus > 0 ? `+${surplus} meals` : '0 meals'}
          subtitle="max(0, Planned - Predicted)"
          icon={surplus > 0 ? AlertTriangle : CheckCircle2}
          variant={surplus > 20 ? 'rose' : surplus > 0 ? 'amber' : 'emerald'}
          badge={surplus > 0 ? 'Surplus Risk' : 'Zero Waste'}
          tooltip="Potential excess meals if actual customer turnout matches model prediction."
        />

        {/* KPI 4 */}
        <KpiCard
          title="Estimated Shortage"
          value={shortage > 0 ? `-${shortage} meals` : '0 meals'}
          subtitle="max(0, Predicted - Planned)"
          icon={shortage > 0 ? ShieldAlert : CheckCircle2}
          variant={shortage > 20 ? 'rose' : shortage > 0 ? 'amber' : 'emerald'}
          badge={shortage > 0 ? 'Stockout Risk' : 'Full Coverage'}
          tooltip="Potential unmet student demand if kitchen batches run out early."
        />

        {/* KPI 5 */}
        <KpiCard
          title="Preparation Cost"
          value={`₹${prepCost.toLocaleString('en-IN')}`}
          subtitle={`${plannedMeals} meals × ₹${costPerMealInput}/meal`}
          icon={Coins}
          variant="purple"
          badge="Total Outlay"
          tooltip="Total direct food ingredient and preparation expenditure for this batch."
        />

        {/* KPI 6 */}
        <KpiCard
          title="Estimated Surplus Cost"
          value={`₹${surplusCost.toLocaleString('en-IN')}`}
          subtitle={`${surplus} surplus meals × ₹${costPerMealInput}`}
          icon={DollarSign}
          variant={surplusCost > 1000 ? 'rose' : surplusCost > 0 ? 'amber' : 'emerald'}
          badge={surplusCost > 0 ? 'At Risk' : 'Zero Excess'}
          tooltip="Potential ingredient cost loss if surplus meals cannot be repurposed."
        />
      </div>

      {/* Decision Guidance Banner */}
      {prediction && (
        <div className="rounded-2xl bg-[#111827] border border-slate-800 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Model Decision Recommendation</span>
            <p className="text-sm font-medium text-slate-200">{prediction.recommendation}</p>
            <p className="text-xs text-slate-500">{prediction.confidence_explanation}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('scenarios')}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 transition-all flex items-center gap-2"
            >
              Test Preparation Scenarios <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Dashboard Analytics Previews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Demand Trend Chart */}
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Average Demand by Weekday</h3>
              <p className="text-xs text-slate-400">Historical average orders across days of the week</p>
            </div>
            <span className="text-xs text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
              {selectedMenu}
            </span>
          </div>

          <div className="h-64 w-full">
            {chartsData?.analytics?.weekday_demand ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartsData.analytics.weekday_demand}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="day" stroke="#64748B" fontSize={12} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={12} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#334155', borderRadius: '8px', color: '#F8FAFC' }}
                    formatter={(val: any) => [`${val} meals`, 'Average Demand']}
                  />
                  <Bar dataKey="avg_meals" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">Loading chart data...</div>
            )}
          </div>
        </div>

        {/* Menu Distribution Breakdown */}
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Menu Category Distribution</h3>
              <p className="text-xs text-slate-400">Total historical meal volume and category market share</p>
            </div>
            <button
              onClick={() => onNavigate('analytics')}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
            >
              Full Analytics <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3 pt-2">
            {chartsData?.analytics?.menu_breakdown.map((item) => (
              <div key={item.menu_type} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">{item.menu_type}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400">{item.total_meals.toLocaleString()} meals</span>
                    <span className="font-bold text-amber-400 w-12 text-right">{item.share_percent}%</span>
                  </div>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${item.share_percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
