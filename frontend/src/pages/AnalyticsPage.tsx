import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  Filter,
  TrendingUp,
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
      <div className="border-b border-line pb-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-500">
              <span>Historical Reporting</span>
              <span>•</span>
              <span className="text-olive-700">Multi-Term Consumption Trends</span>
            </div>
            <h2 className="font-serif text-2xl lg:text-3xl font-bold text-ink-950 tracking-tight mt-1">
              Consumption & Demand Analytics
            </h2>
            <p className="text-xs text-ink-500 mt-1 max-w-2xl">
              Inspect historical sales trends, day-of-week consumption distributions, and test set accuracy curves.
            </p>
          </div>

          {/* View Toggle */}
          <div className="flex items-center border border-line bg-card rounded p-0.5 text-xs font-medium">
            <button
              onClick={() => setActiveView('charts')}
              className={`px-3 py-1.5 rounded transition-colors ${
                activeView === 'charts'
                  ? 'bg-olive-700 text-white font-semibold'
                  : 'text-ink-600 hover:text-ink-900'
              }`}
            >
              Visual Charts
            </button>
            <button
              onClick={() => setActiveView('table')}
              className={`px-3 py-1.5 rounded transition-colors ${
                activeView === 'table'
                  ? 'bg-olive-700 text-white font-semibold'
                  : 'text-ink-600 hover:text-ink-900'
              }`}
            >
              Log Records ({historyRecords.length})
            </button>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-lg bg-card border border-line flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-ink-400" />
            <span className="text-ink-600 font-medium">Menu Filter:</span>
            <select
              value={selectedMenu}
              onChange={(e) => setSelectedMenu(e.target.value)}
              className="bg-canvas-subtle border border-line rounded px-2.5 py-1 text-ink-900 font-semibold focus:outline-none focus:border-olive-700"
            >
              {MENU_TYPES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-ink-600 font-medium">Weekday:</span>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="bg-canvas-subtle border border-line rounded px-2.5 py-1 text-ink-900 font-semibold focus:outline-none focus:border-olive-700"
            >
              {WEEKDAYS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-ink-400" />
            <span className="text-ink-600 font-medium">Range:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-canvas-subtle border border-line rounded px-2 py-1 text-ink-900 focus:outline-none focus:border-olive-700 text-xs"
            />
            <span className="text-ink-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-canvas-subtle border border-line rounded px-2 py-1 text-ink-900 focus:outline-none focus:border-olive-700 text-xs"
            />
          </div>
        </div>

        <span className="text-ink-500 font-mono text-[11px]">
          1,825 shift records in database
        </span>
      </div>

      {activeView === 'charts' ? (
        <div className="space-y-6">
          {/* Chart 1: Daily Demand Trend */}
          <div className="border border-line rounded-lg p-5 bg-card space-y-3">
            <div className="pb-3 border-b border-line">
              <h3 className="font-serif text-sm font-bold text-ink-950">
                Daily Demand Trajectory (Multi-Item Volume)
              </h3>
              <p className="text-xs text-ink-500">
                Chronological portion sales across active menu categories
              </p>
            </div>

            <div className="h-64 w-full">
              {chartsData?.analytics?.daily_trend ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartsData.analytics.daily_trend} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 2" stroke="#E5E5DF" vertical={false} />
                    <XAxis dataKey="date" stroke="#77807A" fontSize={10} tickLine={false} />
                    <YAxis stroke="#77807A" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#D3D3CB', borderRadius: '4px', fontSize: '11px', color: '#1F2421' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Line type="monotone" dataKey="Meals" stroke="#314F3B" strokeWidth={1.8} dot={false} />
                    <Line type="monotone" dataKey="Biryani" stroke="#AF4326" strokeWidth={1.8} dot={false} />
                    <Line type="monotone" dataKey="Variety Rice" stroke="#8A6217" strokeWidth={1.8} dot={false} />
                    <Line type="monotone" dataKey="Dosa" stroke="#434A45" strokeWidth={1.8} dot={false} />
                    <Line type="monotone" dataKey="Idli" stroke="#77807A" strokeWidth={1.8} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-ink-400">Loading daily trends...</div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 2: Weekday Volume Distribution */}
            <div className="border border-line rounded-lg p-5 bg-card space-y-3">
              <div className="pb-3 border-b border-line">
                <h3 className="font-serif text-sm font-bold text-ink-950">
                  Weekday Consumption Distribution
                </h3>
                <p className="text-xs text-ink-500">
                  Average portion sales volume by day of the week
                </p>
              </div>

              <div className="h-64 w-full">
                {chartsData?.analytics?.weekday_demand ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartsData.analytics.weekday_demand} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="2 2" stroke="#E5E5DF" vertical={false} />
                      <XAxis dataKey="day" stroke="#77807A" fontSize={11} tickLine={false} />
                      <YAxis stroke="#77807A" fontSize={10} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#D3D3CB', borderRadius: '4px', fontSize: '11px', color: '#1F2421' }}
                      />
                      <Bar dataKey="avg_meals" fill="#314F3B" radius={[2, 2, 0, 0]} name="Average Demand" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : null}
              </div>
            </div>

            {/* Chart 3: Headcount vs Demand Scatter */}
            <div className="border border-line rounded-lg p-5 bg-card space-y-3">
              <div className="pb-3 border-b border-line">
                <h3 className="font-serif text-sm font-bold text-ink-950">
                  Headcount vs Portion Demand Correlation
                </h3>
                <p className="text-xs text-ink-500">
                  Turnout sensitivity across campus operating shifts
                </p>
              </div>

              <div className="h-64 w-full">
                {chartsData?.analytics?.attendance_vs_sales ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 10, right: 20, bottom: 0, left: -10 }}>
                      <CartesianGrid strokeDasharray="2 2" stroke="#E5E5DF" />
                      <XAxis type="number" dataKey="attendance" name="Attendance" stroke="#77807A" fontSize={10} tickLine={false} />
                      <YAxis type="number" dataKey="meals_sold" name="Portions Sold" stroke="#77807A" fontSize={10} tickLine={false} />
                      <Tooltip
                        cursor={{ strokeDasharray: '2 2' }}
                        contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#D3D3CB', borderRadius: '4px', fontSize: '11px', color: '#1F2421' }}
                      />
                      <Scatter name="Service Shifts" data={chartsData.analytics.attendance_vs_sales} fill="#AF4326" fillOpacity={0.65} />
                    </ScatterChart>
                  </ResponsiveContainer>
                ) : null}
              </div>
            </div>
          </div>

          {/* Chart 4: Model Accuracy Curve */}
          {modelMetrics?.sample_test_predictions && (
            <div className="border border-line rounded-lg p-5 bg-card space-y-3">
              <div className="pb-3 border-b border-line flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-sm font-bold text-ink-950">
                    Model Accuracy Fit on Holdout Observations
                  </h3>
                  <p className="text-xs text-ink-500">
                    Comparing actual sales with Random Forest forecasts on chronological test records
                  </p>
                </div>
                <span className="text-xs font-mono text-ink-600 bg-canvas-subtle px-2 py-0.5 rounded border border-line">
                  R² = {modelMetrics.r2} • MAE = {modelMetrics.mae} portions
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={modelMetrics.sample_test_predictions.slice(0, 40)} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 2" stroke="#E5E5DF" vertical={false} />
                    <XAxis dataKey="date" stroke="#77807A" fontSize={10} tickLine={false} />
                    <YAxis stroke="#77807A" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#D3D3CB', borderRadius: '4px', fontSize: '11px', color: '#1F2421' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Line type="monotone" dataKey="actual" stroke="#253E2E" strokeWidth={1.8} dot={{ r: 2 }} name="Actual Meals Sold" />
                    <Line type="monotone" dataKey="predicted" stroke="#AF4326" strokeWidth={1.8} strokeDasharray="3 3" dot={{ r: 2 }} name="Model Forecast" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Records Table View */
        <div className="border border-line rounded-lg overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-canvas-subtle border-b border-line text-ink-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3">Shift Date</th>
                  <th className="px-4 py-3">Weekday</th>
                  <th className="px-4 py-3">Menu Offering</th>
                  <th className="px-4 py-3 text-right">Headcount</th>
                  <th className="px-4 py-3 text-right">Temp (°C)</th>
                  <th className="px-4 py-3 text-right">Prev Sales</th>
                  <th className="px-4 py-3 text-center">Schedule</th>
                  <th className="px-4 py-3 text-right">Portions Sold</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-ink-700">
                {historyRecords.map((r, i) => (
                  <tr key={i} className="hover:bg-canvas-subtle/70 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-ink-900">{r.date}</td>
                    <td className="px-4 py-2.5">{r.day_of_week}</td>
                    <td className="px-4 py-2.5 font-semibold text-ink-950">{r.menu_type}</td>
                    <td className="px-4 py-2.5 font-mono text-right font-tabular">{r.expected_attendance}</td>
                    <td className="px-4 py-2.5 font-mono text-right font-tabular">{r.temperature}°C</td>
                    <td className="px-4 py-2.5 font-mono text-right font-tabular">{r.prev_day_sales}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                        r.is_holiday
                          ? 'bg-olive-50 text-olive-800 border-olive-200'
                          : 'bg-canvas-subtle text-ink-600 border-line'
                      }`}>
                        {r.is_holiday ? 'Holiday' : 'Regular'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono font-bold text-ink-950 text-right font-tabular">
                      {r.actual_meals_sold}
                    </td>
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
