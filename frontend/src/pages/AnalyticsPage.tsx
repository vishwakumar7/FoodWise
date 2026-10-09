import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  ChefHat,
  Filter,
  Layers,
  Sparkles,
  TrendingUp,
  Users,
  Search,
  Table as TableIcon
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { api } from '../services/api';
import { ChartsData, HistoricalRecord, ModelMetrics } from '../types';

const MENU_TYPES = ['All', 'Meals', 'Variety Rice', 'Biryani', 'Dosa', 'Idli'];
const WEEKDAYS = ['All', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const AnalyticsPage: React.FC = () => {
  const [selectedMenu, setSelectedMenu] = useState<string>('All');
  const [selectedDay, setSelectedDay] = useState<string>('All');
  const [startDate, setStartDate] = useState<string>('2025-01-01');
  const [endDate, setEndDate] = useState<string>('2025-12-31');

  const [chartsData, setChartsData] = useState<ChartsData | null>(null);
  const [modelMetrics, setModelMetrics] = useState<ModelMetrics | null>(null);
  const [historyRecords, setHistoryRecords] = useState<HistoricalRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeView, setActiveView] = useState<'charts' | 'table'>('charts');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [chartsRes, metricsRes, histRes] = await Promise.all([
        api.getCharts(selectedMenu),
        api.getModelMetrics(),
        api.getHistory({
          menu_type: selectedMenu,
          day_of_week: selectedDay,
          start_date: startDate,
          end_date: endDate,
          limit: 100,
        }),
      ]);
      setChartsData(chartsRes);
      setModelMetrics(metricsRes);
      setHistoryRecords(histRes);
    } catch (err) {
      console.error('Failed to load analytics data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMenu, selectedDay, startDate, endDate]);

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-amber-500" />
            Historical Demand Analytics
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Analyze historical canteen consumption trends, weekday cycles, and model fit accuracy.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveView('charts')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'charts'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Visual Analytics
          </button>
          <button
            onClick={() => setActiveView('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'table'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Data Records ({historyRecords.length})
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-slate-300">Menu:</span>
            <select
              value={selectedMenu}
              onChange={(e) => setSelectedMenu(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              {MENU_TYPES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-300">Weekday:</span>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              {WEEKDAYS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-300">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
            />
            <span className="text-xs text-slate-400">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Showing filtered data from 1,825 historical rows
        </span>
      </div>

      {activeView === 'charts' ? (
        <div className="space-y-8">
          {/* Chart 1: Daily Demand Trend */}
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-500" />
                  Recent Daily Demand Trend (Multi-Item Volume)
                </h3>
                <p className="text-xs text-slate-400">Chronological daily consumption across menu offerings</p>
              </div>
            </div>

            <div className="h-72 w-full">
              {chartsData?.analytics?.daily_trend ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartsData.analytics.daily_trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                    <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#334155', borderRadius: '8px', color: '#F8FAFC' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Line type="monotone" dataKey="Meals" stroke="#F59E0B" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Biryani" stroke="#EC4899" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Variety Rice" stroke="#10B981" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Dosa" stroke="#38BDF8" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Idli" stroke="#A855F7" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs">Loading chart...</div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 2: Weekday Demand */}
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white">Average Demand by Weekday</h3>
              <div className="h-64 w-full">
                {chartsData?.analytics?.weekday_demand ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartsData.analytics.weekday_demand}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                      <XAxis dataKey="day" stroke="#64748B" fontSize={12} tickLine={false} />
                      <YAxis stroke="#64748B" fontSize={12} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#334155', borderRadius: '8px', color: '#F8FAFC' }}
                      />
                      <Bar dataKey="avg_meals" fill="#3B82F6" radius={[6, 6, 0, 0]} name="Average Meals" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : null}
              </div>
            </div>

            {/* Chart 3: Attendance vs Meals Sold Scatter */}
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white">Attendance vs Meals Sold Correlation</h3>
              <div className="h-64 w-full">
                {chartsData?.analytics?.attendance_vs_sales ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                      <XAxis type="number" dataKey="attendance" name="Attendance" stroke="#64748B" fontSize={11} tickLine={false} />
                      <YAxis type="number" dataKey="meals_sold" name="Meals Sold" stroke="#64748B" fontSize={11} tickLine={false} />
                      <Tooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#334155', borderRadius: '8px', color: '#F8FAFC' }}
                      />
                      <Scatter name="Canteen Orders" data={chartsData.analytics.attendance_vs_sales} fill="#F59E0B" fillOpacity={0.7} />
                    </ScatterChart>
                  </ResponsiveContainer>
                ) : null}
              </div>
            </div>
          </div>

          {/* Chart 4: Actual vs Predicted Demand Curve */}
          {modelMetrics?.sample_test_predictions && (
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    Model Accuracy: Actual vs Predicted Demand (Hold-out Test Sample)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Temporal validation split (Test R² = {modelMetrics.r2}, MAE = {modelMetrics.mae} meals)
                  </p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={modelMetrics.sample_test_predictions.slice(0, 40)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                    <XAxis dataKey="date" stroke="#64748B" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#334155', borderRadius: '8px', color: '#F8FAFC' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Line type="monotone" dataKey="actual" stroke="#10B981" strokeWidth={2} dot={{ r: 2 }} name="Actual Meals Sold" />
                    <Line type="monotone" dataKey="predicted" stroke="#F59E0B" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 2 }} name="Random Forest Prediction" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Table View */
        <div className="bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Day</th>
                  <th className="px-4 py-3">Menu Type</th>
                  <th className="px-4 py-3">Attendance</th>
                  <th className="px-4 py-3">Temp (°C)</th>
                  <th className="px-4 py-3">Prev Sales</th>
                  <th className="px-4 py-3">Schedule</th>
                  <th className="px-4 py-3 text-right">Actual Sold</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {historyRecords.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-2.5 font-mono">{r.date}</td>
                    <td className="px-4 py-2.5">{r.day_of_week}</td>
                    <td className="px-4 py-2.5 font-semibold text-white">{r.menu_type}</td>
                    <td className="px-4 py-2.5 font-mono">{r.expected_attendance}</td>
                    <td className="px-4 py-2.5 font-mono">{r.temperature}°C</td>
                    <td className="px-4 py-2.5 font-mono">{r.prev_day_sales}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${r.is_holiday ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-800 text-slate-400'}`}>
                        {r.is_holiday ? 'Holiday' : 'Regular'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono font-bold text-amber-400 text-right">{r.actual_meals_sold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
