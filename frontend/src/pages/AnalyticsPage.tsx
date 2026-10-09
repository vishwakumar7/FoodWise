import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { api } from '../services/api';
import { ChartsData, HistoricalRecord } from '../types';

const MENU_TYPES = ['All', 'Meals', 'Variety Rice', 'Biryani', 'Dosa', 'Idli'];
const WEEKDAYS = ['All', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const AnalyticsPage: React.FC = () => {
  const [selectedMenu, setSelectedMenu] = useState<string>('All');
  const [selectedDay, setSelectedDay] = useState<string>('All');

  const [chartsData, setChartsData] = useState<ChartsData | null>(null);
  const [historyRecords, setHistoryRecords] = useState<HistoricalRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [chartsRes, histRes] = await Promise.all([
        api.getCharts(selectedMenu),
        api.getHistory({
          menu_type: selectedMenu,
          day_of_week: selectedDay,
          limit: 50,
        }),
      ]);
      setChartsData(chartsRes);
      setHistoryRecords(histRes);
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMenu, selectedDay]);

  return (
    <div className="space-y-6">
      {/* Title & Filters */}
      <div className="bg-white border border-gray-200 rounded-md p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Historical Demand Analytics</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            View historical sales trends and weekday consumption patterns.
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <label className="text-gray-600 font-medium">Menu Filter:</label>
            <select
              value={selectedMenu}
              onChange={(e) => setSelectedMenu(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-gray-800 bg-white"
            >
              {MENU_TYPES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-gray-600 font-medium">Weekday:</label>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-gray-800 bg-white"
            >
              {WEEKDAYS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Two Basic Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Daily Demand Trend */}
        <div className="bg-white border border-gray-200 rounded-md p-4">
          <h3 className="font-semibold text-sm text-gray-800 mb-1">
            Recent Daily Sales Trend
          </h3>
          <p className="text-xs text-gray-500 mb-3">Daily demand for menu items over recent shifts</p>

          <div className="h-64 w-full">
            {chartsData?.analytics?.daily_trend ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartsData.analytics.daily_trend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '4px', fontSize: '11px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Line type="monotone" dataKey="Meals" stroke="#2563eb" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="Biryani" stroke="#ea580c" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="Variety Rice" stroke="#16a34a" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="Dosa" stroke="#9333ea" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">Loading chart...</div>
            )}
          </div>
        </div>

        {/* Chart 2: Weekday Demand */}
        <div className="bg-white border border-gray-200 rounded-md p-4">
          <h3 className="font-semibold text-sm text-gray-800 mb-1">
            Average Demand by Day of Week
          </h3>
          <p className="text-xs text-gray-500 mb-3">Comparison across Monday through Sunday</p>

          <div className="h-64 w-full">
            {chartsData?.analytics?.weekday_demand ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartsData.analytics.weekday_demand} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '4px', fontSize: '11px' }} />
                  <Bar dataKey="avg_meals" fill="#2563eb" radius={[3, 3, 0, 0]} name="Average Demand" />
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </div>
      </div>

      {/* Simple Records Table */}
      <div className="bg-white border border-gray-200 rounded-md p-4">
        <h3 className="font-semibold text-sm text-gray-800 mb-2">
          Historical Dataset Records (Sample of {historyRecords.length})
        </h3>

        <div className="overflow-x-auto max-h-72">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold sticky top-0">
              <tr>
                <th className="py-2 px-3">Date</th>
                <th className="py-2 px-3">Weekday</th>
                <th className="py-2 px-3">Menu</th>
                <th className="py-2 px-3 text-right">Attendance</th>
                <th className="py-2 px-3 text-right">Temp (°C)</th>
                <th className="py-2 px-3 text-right">Prev Sales</th>
                <th className="py-2 px-3 text-right">Actual Sold</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {historyRecords.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="py-2 px-3 text-gray-900">{r.date}</td>
                  <td className="py-2 px-3">{r.day_of_week}</td>
                  <td className="py-2 px-3 font-medium text-gray-900">{r.menu_type}</td>
                  <td className="py-2 px-3 text-right">{r.expected_attendance}</td>
                  <td className="py-2 px-3 text-right">{r.temperature}°C</td>
                  <td className="py-2 px-3 text-right">{r.prev_day_sales}</td>
                  <td className="py-2 px-3 text-right font-semibold text-blue-600">{r.actual_meals_sold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
