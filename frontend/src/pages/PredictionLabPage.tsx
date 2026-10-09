import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Info,
  Sparkles,
  Users,
  ChefHat,
  Thermometer,
  Palmtree,
  RefreshCw,
  Sliders
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { api } from '../services/api';
import { PredictResponse } from '../types';

const MENU_TYPES = ['Meals', 'Variety Rice', 'Biryani', 'Dosa', 'Idli'];

export const PredictionLabPage: React.FC = () => {
  // Scenario A (Baseline)
  const [menuA, setMenuA] = useState<string>('Meals');
  const [attendanceA, setAttendanceA] = useState<number>(350);
  const [tempA, setTempA] = useState<number>(28);
  const [holidayA, setHolidayA] = useState<number>(0);

  // Scenario B (Experimental Variant)
  const [menuB, setMenuB] = useState<string>('Biryani');
  const [attendanceB, setAttendanceB] = useState<number>(450);
  const [tempB, setTempB] = useState<number>(28);
  const [holidayB, setHolidayB] = useState<number>(0);

  const [predA, setPredA] = useState<PredictResponse | null>(null);
  const [predB, setPredB] = useState<PredictResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Attendance Sensitivity curve simulation
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

      // Generate sensitivity data points for attendance range [100, 200, 300, 400, 500, 600]
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-amber-500" />
            Prediction Sensitivity Lab
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Isolate and manipulate individual variables to observe machine learning model sensitivity and responsiveness.
          </p>
        </div>

        <button
          onClick={runComparison}
          disabled={loading}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Recalculate Sensitivity
        </button>
      </div>

      {/* Causality Disclaimer */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-3">
        <Info className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
        <div>
          <strong className="font-semibold block text-amber-200">Scientific Context & Model Limitation:</strong>
          These deltas reflect model-learned correlations from the training distribution, not empirical proof that changing a single variable causes real-world customer shifts. Real operational outcomes also depend on off-campus dining alternatives and schedule changes.
        </div>
      </div>

      {/* Comparison Grid: Baseline vs Experiment */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Scenario A (Baseline) - 5 cols */}
        <div className="lg:col-span-5 bg-[#111827] border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-400" /> Scenario A (Baseline)
            </span>
            <span className="text-xs text-slate-400">Control Group</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Menu Category</label>
              <select
                value={menuA}
                onChange={(e) => setMenuA(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {MENU_TYPES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Expected Attendance</span>
                <span className="font-mono font-bold text-sky-400">{attendanceA}</span>
              </div>
              <input
                type="range"
                min="50"
                max="650"
                value={attendanceA}
                onChange={(e) => setAttendanceA(parseInt(e.target.value))}
                className="w-full accent-sky-500 bg-slate-800 rounded-lg h-2"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Temperature</span>
                <span className="font-mono font-bold text-slate-300">{tempA}°C</span>
              </div>
              <input
                type="range"
                min="18"
                max="42"
                value={tempA}
                onChange={(e) => setTempA(parseFloat(e.target.value))}
                className="w-full accent-slate-500 bg-slate-800 rounded-lg h-2"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-300">Holiday Status</span>
              <button
                type="button"
                onClick={() => setHolidayA(holidayA === 1 ? 0 : 1)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                  holidayA === 1 ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-slate-900 text-slate-400 border-slate-700'
                }`}
              >
                {holidayA === 1 ? 'Holiday / Break' : 'Normal Weekday'}
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 uppercase font-semibold block">Predicted Demand A</span>
            <span className="text-3xl font-extrabold text-sky-400 mt-1 block">
              {predA ? `${predA.rounded_prediction} meals` : '...'}
            </span>
          </div>
        </div>

        {/* Delta Callout (2 cols) */}
        <div className="lg:col-span-2 flex flex-col items-center justify-center bg-[#111827] border border-slate-800 rounded-2xl p-5 text-center space-y-3">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Model Delta</span>
          
          <div className={`p-3 rounded-full ${deltaMeals >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
            {deltaMeals >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
          </div>

          <div className="space-y-0.5">
            <span className={`text-2xl font-black block ${deltaMeals >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {deltaMeals > 0 ? `+${deltaMeals}` : deltaMeals} meals
            </span>
            <span className="text-xs text-slate-400 font-mono">
              ({pctChange > '0' ? `+${pctChange}` : pctChange}%)
            </span>
          </div>

          <span className="text-[10px] text-slate-500 leading-tight">
            Sensitivity difference between Variant B & A
          </span>
        </div>

        {/* Scenario B (Experimental Variant) - 5 cols */}
        <div className="lg:col-span-5 bg-[#111827] border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> Scenario B (Variant)
            </span>
            <span className="text-xs text-slate-400">Experimental</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Menu Category</label>
              <select
                value={menuB}
                onChange={(e) => setMenuB(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {MENU_TYPES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Expected Attendance</span>
                <span className="font-mono font-bold text-amber-400">{attendanceB}</span>
              </div>
              <input
                type="range"
                min="50"
                max="650"
                value={attendanceB}
                onChange={(e) => setAttendanceB(parseInt(e.target.value))}
                className="w-full accent-amber-500 bg-slate-800 rounded-lg h-2"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Temperature</span>
                <span className="font-mono font-bold text-slate-300">{tempB}°C</span>
              </div>
              <input
                type="range"
                min="18"
                max="42"
                value={tempB}
                onChange={(e) => setTempB(parseFloat(e.target.value))}
                className="w-full accent-slate-500 bg-slate-800 rounded-lg h-2"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-300">Holiday Status</span>
              <button
                type="button"
                onClick={() => setHolidayB(holidayB === 1 ? 0 : 1)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                  holidayB === 1 ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-slate-900 text-slate-400 border-slate-700'
                }`}
              >
                {holidayB === 1 ? 'Holiday / Break' : 'Normal Weekday'}
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 uppercase font-semibold block">Predicted Demand B</span>
            <span className="text-3xl font-extrabold text-amber-400 mt-1 block">
              {predB ? `${predB.rounded_prediction} meals` : '...'}
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Attendance Sensitivity Curve Chart */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 lg:p-7 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-500" />
              Attendance Response Curve
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulated demand trajectory as campus attendance increases from 100 to 600 students
            </p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sensitivityCurve} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
              <XAxis dataKey="attendance" stroke="#64748B" fontSize={12} tickLine={false} label={{ value: 'Campus Attendance', position: 'insideBottom', offset: -5, fill: '#64748B', fontSize: 11 }} />
              <YAxis stroke="#64748B" fontSize={12} tickLine={false} label={{ value: 'Predicted Demand', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#334155', borderRadius: '8px', color: '#F8FAFC' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '15px' }} />
              <Line type="monotone" dataKey={menuA} stroke="#38BDF8" strokeWidth={3} dot={{ r: 4 }} name={`Scenario A: ${menuA}`} />
              <Line type="monotone" dataKey={menuB} stroke="#F59E0B" strokeWidth={3} dot={{ r: 4 }} name={`Scenario B: ${menuB}`} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
