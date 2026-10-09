import React, { useState, useEffect } from 'react';
import {
  ArrowLeftRight,
  RefreshCw,
  Info,
  TrendingUp,
  TrendingDown,
  Equal
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { api } from '../services/api';
import { PredictResponse } from '../types';

const MENU_TYPES = ['Meals', 'Variety Rice', 'Biryani', 'Dosa', 'Idli'];

export const PredictionLabPage: React.FC = () => {
  // Scenario A (Control)
  const [menuA, setMenuA] = useState<string>('Meals');
  const [attendanceA, setAttendanceA] = useState<number>(350);
  const [tempA, setTempA] = useState<number>(28);
  const [holidayA, setHolidayA] = useState<number>(0);

  // Scenario B (Experimental)
  const [menuB, setMenuB] = useState<string>('Biryani');
  const [attendanceB, setAttendanceB] = useState<number>(450);
  const [tempB, setTempB] = useState<number>(28);
  const [holidayB, setHolidayB] = useState<number>(0);

  const [predA, setPredA] = useState<PredictResponse | null>(null);
  const [predB, setPredB] = useState<PredictResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [sensitivityCurve, setSensitivityCurve] = useState<any[]>([]);

  const runComparison = async () => {
    setLoading(true);
    try {
      const [resA, resB] = await Promise.all([
        api.predictDemand({
          date: '2025-10-17',
          menu_type: menuA,
          expected_attendance: attendanceA,
          temperature: tempA,
          prev_day_sales: 150,
          is_holiday: holidayA,
          planned_meals: 200,
          cost_per_meal: 50,
        }),
        api.predictDemand({
          date: '2025-10-17',
          menu_type: menuB,
          expected_attendance: attendanceB,
          temperature: tempB,
          prev_day_sales: 150,
          is_holiday: holidayB,
          planned_meals: 200,
          cost_per_meal: 50,
        }),
      ]);
      setPredA(resA);
      setPredB(resB);

      const attendanceSteps = [100, 200, 300, 400, 500, 600];
      const curveData = await Promise.all(
        attendanceSteps.map(async (att) => {
          const [pA, pB] = await Promise.all([
            api.predictDemand({
              date: '2025-10-17',
              menu_type: menuA,
              expected_attendance: att,
              temperature: tempA,
              prev_day_sales: 150,
              is_holiday: holidayA,
            }),
            api.predictDemand({
              date: '2025-10-17',
              menu_type: menuB,
              expected_attendance: att,
              temperature: tempB,
              prev_day_sales: 150,
              is_holiday: holidayB,
            }),
          ]);
          return {
            attendance: att,
            [menuA]: pA.rounded_prediction,
            [menuB]: pB.rounded_prediction,
          };
        })
      );
      setSensitivityCurve(curveData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runComparison();
  }, [menuA, attendanceA, tempA, holidayA, menuB, attendanceB, tempB, holidayB]);

  const deltaMeals = (predB?.rounded_prediction || 0) - (predA?.rounded_prediction || 0);
  const pctChange = predA && predA.rounded_prediction > 0
    ? ((deltaMeals / predA.rounded_prediction) * 100).toFixed(1)
    : '0';

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-line pb-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-500">
              <span>Model Sensitivity</span>
              <span>•</span>
              <span className="text-olive-700">Comparative Variable Inspection</span>
            </div>
            <h2 className="font-serif text-2xl lg:text-3xl font-bold text-ink-950 tracking-tight mt-1">
              Parameter Sensitivity Analysis
            </h2>
            <p className="text-xs text-ink-500 mt-1 max-w-2xl">
              Isolate and modify operational variables to evaluate how expected portion demand reacts across menus and attendance tiers.
            </p>
          </div>

          <button
            onClick={runComparison}
            disabled={loading}
            className="px-4 py-2 rounded text-xs font-semibold bg-olive-700 hover:bg-olive-800 text-white flex items-center gap-2 transition-colors disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Recalculate Sensitivity
          </button>
        </div>
      </div>

      {/* Scientific Context Disclaimer */}
      <div className="p-4 rounded-lg bg-card border border-line flex items-start gap-3">
        <Info className="w-4 h-4 text-olive-700 shrink-0 mt-0.5" />
        <div className="text-xs text-ink-600 leading-relaxed">
          <strong className="text-ink-900 font-semibold">Methodological Note:</strong> These deltas reflect statistical relationships captured by the Random Forest model across historical observations. They represent modeled sensitivity rather than definitive proof of causal real-world behavioral changes.
        </div>
      </div>

      {/* Comparative Matrix: Scenario A vs Delta vs Scenario B */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Scenario A (Baseline Control) */}
        <div className="lg:col-span-5 bg-card border border-line rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-line">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-800">
              Shift Configuration A (Control)
            </span>
            <span className="text-[10px] font-mono text-ink-400">Baseline</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-ink-700 font-medium block mb-1">Menu Category</label>
              <select
                value={menuA}
                onChange={(e) => setMenuA(e.target.value)}
                className="w-full bg-canvas-subtle border border-line rounded p-2 text-ink-900 font-semibold focus:outline-none focus:border-olive-700"
              >
                {MENU_TYPES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between text-ink-700 mb-1">
                <span>Expected Attendance</span>
                <span className="font-mono font-bold text-ink-950 font-tabular">{attendanceA} students</span>
              </div>
              <input
                type="range"
                min="50"
                max="650"
                value={attendanceA}
                onChange={(e) => setAttendanceA(parseInt(e.target.value))}
                className="w-full accent-olive-700 bg-canvas-subtle rounded h-1.5"
              />
            </div>

            <div>
              <div className="flex justify-between text-ink-700 mb-1">
                <span>Forecasted Temperature</span>
                <span className="font-mono font-bold text-ink-950 font-tabular">{tempA}°C</span>
              </div>
              <input
                type="range"
                min="18"
                max="42"
                value={tempA}
                onChange={(e) => setTempA(parseFloat(e.target.value))}
                className="w-full accent-ink-700 bg-canvas-subtle rounded h-1.5"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-ink-700 font-medium">Schedule Setting</span>
              <button
                type="button"
                onClick={() => setHolidayA(holidayA === 1 ? 0 : 1)}
                className={`px-2.5 py-1 rounded text-xs border font-medium ${
                  holidayA === 1 ? 'bg-olive-50 text-olive-800 border-olive-200' : 'bg-canvas-subtle text-ink-600 border-line'
                }`}
              >
                {holidayA === 1 ? 'Holiday / Break' : 'Regular Schedule'}
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded bg-canvas-subtle border border-line text-center">
            <span className="text-[11px] text-ink-500 uppercase font-semibold block">Forecast A</span>
            <span className="font-serif text-3xl font-bold text-ink-950 mt-0.5 block font-tabular">
              {predA ? `${predA.rounded_prediction} portions` : '...'}
            </span>
          </div>
        </div>

        {/* Delta Summary (2 cols) */}
        <div className="lg:col-span-2 flex flex-col items-center justify-center bg-card border border-line rounded-lg p-4 text-center space-y-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">
            Model Variance
          </span>

          <div className={`p-2 rounded-full border ${
            deltaMeals > 0
              ? 'bg-olive-50 text-olive-800 border-olive-200'
              : deltaMeals < 0
              ? 'bg-terracotta-50 text-terracotta-800 border-terracotta-200'
              : 'bg-canvas-subtle text-ink-600 border-line'
          }`}>
            {deltaMeals > 0 ? (
              <TrendingUp className="w-5 h-5" />
            ) : deltaMeals < 0 ? (
              <TrendingDown className="w-5 h-5" />
            ) : (
              <Equal className="w-5 h-5" />
            )}
          </div>

          <div>
            <span className={`font-serif text-2xl font-bold block font-tabular ${
              deltaMeals > 0 ? 'text-olive-800' : deltaMeals < 0 ? 'text-terracotta-800' : 'text-ink-800'
            }`}>
              {deltaMeals > 0 ? `+${deltaMeals}` : deltaMeals}
            </span>
            <span className="text-[11px] text-ink-500 font-mono">
              ({pctChange > '0' ? `+${pctChange}` : pctChange}%)
            </span>
          </div>

          <p className="text-[10px] text-ink-400 leading-tight">
            Net demand delta between Shift B and Shift A
          </p>
        </div>

        {/* Scenario B (Variant Group) */}
        <div className="lg:col-span-5 bg-card border border-line rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-line">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-800">
              Shift Configuration B (Variant)
            </span>
            <span className="text-[10px] font-mono text-ink-400">Experimental</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-ink-700 font-medium block mb-1">Menu Category</label>
              <select
                value={menuB}
                onChange={(e) => setMenuB(e.target.value)}
                className="w-full bg-canvas-subtle border border-line rounded p-2 text-ink-900 font-semibold focus:outline-none focus:border-olive-700"
              >
                {MENU_TYPES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between text-ink-700 mb-1">
                <span>Expected Attendance</span>
                <span className="font-mono font-bold text-ink-950 font-tabular">{attendanceB} students</span>
              </div>
              <input
                type="range"
                min="50"
                max="650"
                value={attendanceB}
                onChange={(e) => setAttendanceB(parseInt(e.target.value))}
                className="w-full accent-terracotta-700 bg-canvas-subtle rounded h-1.5"
              />
            </div>

            <div>
              <div className="flex justify-between text-ink-700 mb-1">
                <span>Forecasted Temperature</span>
                <span className="font-mono font-bold text-ink-950 font-tabular">{tempB}°C</span>
              </div>
              <input
                type="range"
                min="18"
                max="42"
                value={tempB}
                onChange={(e) => setTempB(parseFloat(e.target.value))}
                className="w-full accent-ink-700 bg-canvas-subtle rounded h-1.5"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-ink-700 font-medium">Schedule Setting</span>
              <button
                type="button"
                onClick={() => setHolidayB(holidayB === 1 ? 0 : 1)}
                className={`px-2.5 py-1 rounded text-xs border font-medium ${
                  holidayB === 1 ? 'bg-olive-50 text-olive-800 border-olive-200' : 'bg-canvas-subtle text-ink-600 border-line'
                }`}
              >
                {holidayB === 1 ? 'Holiday / Break' : 'Regular Schedule'}
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded bg-canvas-subtle border border-line text-center">
            <span className="text-[11px] text-ink-500 uppercase font-semibold block">Forecast B</span>
            <span className="font-serif text-3xl font-bold text-ink-950 mt-0.5 block font-tabular">
              {predB ? `${predB.rounded_prediction} portions` : '...'}
            </span>
          </div>
        </div>
      </div>

      {/* Attendance Response Trajectory Curve */}
      <div className="border border-line rounded-lg p-5 bg-card space-y-4">
        <div className="pb-3 border-b border-line">
          <h3 className="font-serif text-sm font-bold text-ink-950">
            Attendance Demand Scaling Trajectory
          </h3>
          <p className="text-xs text-ink-500">
            Model-projected portion demand as campus headcount scales from 100 to 600 attendees
          </p>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sensitivityCurve} margin={{ top: 15, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#E5E5DF" vertical={false} />
              <XAxis dataKey="attendance" stroke="#77807A" fontSize={11} tickLine={false} />
              <YAxis stroke="#77807A" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#D3D3CB', borderRadius: '4px', fontSize: '11px', color: '#1F2421' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Line type="monotone" dataKey={menuA} stroke="#314F3B" strokeWidth={2} dot={{ r: 3 }} name={`Config A: ${menuA}`} />
              <Line type="monotone" dataKey={menuB} stroke="#C85435" strokeWidth={2} strokeDasharray="3 3" dot={{ r: 3 }} name={`Config B: ${menuB}`} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
