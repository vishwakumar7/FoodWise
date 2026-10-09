import React from 'react';
import { NavTab } from './Sidebar';
import { Sparkles, AlertCircle, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  currentTab: NavTab;
  backendOnline: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  backendOnline,
  onRefresh,
  refreshing = false,
}) => {
  const getTabTitle = (tab: NavTab) => {
    switch (tab) {
      case 'dashboard':
        return { title: 'Executive Overview', subtitle: 'Real-time canteen demand forecasting & surplus monitoring' };
      case 'predict':
        return { title: 'Interactive Demand Predictor', subtitle: 'Random Forest ML inference with tree-ensemble prediction bounds' };
      case 'scenarios':
        return { title: 'What-If Scenario Simulator', subtitle: 'Trade-off analysis between Conservative, Predicted, and Buffered preparation' };
      case 'lab':
        return { title: 'Prediction Sensitivity Lab', subtitle: 'Interactive sensitivity exploration across attendance, menu & weather inputs' };
      case 'analytics':
        return { title: 'Historical Demand Analytics', subtitle: 'Explore multi-dimensional historical demand curves and consumption patterns' };
      case 'waste':
        return { title: 'Food Waste Operational Tracker', subtitle: 'Actual kitchen logs, unsold vs discarded meals, and financial loss metrics' };
      case 'model':
        return { title: 'ML Model Performance & Pipeline', subtitle: 'Evaluation metrics (MAE, RMSE, R²), baseline benchmark & feature importances' };
    }
  };

  const { title, subtitle } = getTabTitle(currentTab);

  return (
    <header className="h-20 bg-[#0B0F19]/90 backdrop-blur-md border-b border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex flex-col">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-white tracking-tight">{title}</h1>
          <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Sparkles className="w-3 h-3 text-amber-400" />
            FoodWise ML Engine
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Synthetic Data notice badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
          <ShieldCheck className="w-4 h-4 text-sky-400" />
          <span>Validated Synthetic Prototype</span>
        </div>

        {/* Backend connectivity badge */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border ${
            backendOnline
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
          <span className="hidden sm:inline">{backendOnline ? 'Backend Online (Port 8000)' : 'Backend Disconnected'}</span>
        </div>

        {/* Refresh button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
            title="Refresh dashboard data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        )}
      </div>
    </header>
  );
};
