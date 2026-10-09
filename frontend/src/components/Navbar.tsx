import React from 'react';
import { NavTab } from './Sidebar';
import { RefreshCw, Database } from 'lucide-react';

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
  const getTabMetadata = (tab: NavTab) => {
    switch (tab) {
      case 'dashboard':
        return {
          category: 'Kitchen Production',
          title: 'Daily Operations Overview',
          description: 'Consolidated demand predictions, kitchen batch schedules, and variance monitoring.',
        };
      case 'predict':
        return {
          category: 'Forecasting Engine',
          title: 'Meal Demand Forecasting',
          description: 'Single-shift demand projection with Random Forest decision tree variance bounds.',
        };
      case 'scenarios':
        return {
          category: 'Production Planning',
          title: 'Batch Size Strategy Simulator',
          description: 'Evaluate conservative, forecast-matched, and safety-buffer preparation targets.',
        };
      case 'lab':
        return {
          category: 'Model Analysis',
          title: 'Parameter Sensitivity Analysis',
          description: 'Measure demand shifts under alternate attendance, temperature, and schedule inputs.',
        };
      case 'analytics':
        return {
          category: 'Historical Data',
          title: 'Consumption & Sales Records',
          description: 'Multi-item volume patterns, day-of-week demand cycles, and test accuracy curves.',
        };
      case 'waste':
        return {
          category: 'Shift Logs',
          title: 'Food Waste & Salvage Log',
          description: 'Operational records separating safely reused leftovers from discarded portions.',
        };
      case 'model':
        return {
          category: 'Pipeline Diagnostics',
          title: 'Model Evaluation & Retraining',
          description: 'Validation metrics (MAE, RMSE, R²), baseline benchmarks, and feature weights.',
        };
    }
  };

  const { category, title, description } = getTabMetadata(currentTab);

  return (
    <header className="bg-card border-b border-line px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-20">
      <div>
        <div className="flex items-center gap-2 text-[11px] font-medium text-ink-500 uppercase tracking-wider">
          <span>{category}</span>
          <span className="text-ink-300">•</span>
          <span className="text-olive-700 font-semibold">Central Facility</span>
        </div>
        <h1 className="text-xl font-serif font-bold text-ink-900 tracking-tight mt-0.5">
          {title}
        </h1>
        <p className="text-xs text-ink-500 mt-0.5">
          {description}
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {/* Dataset reference */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded border border-line bg-canvas-subtle text-[11px] text-ink-600 font-mono">
          <Database className="w-3.5 h-3.5 text-ink-400" />
          <span>Demo Data: 1,825 Shifts</span>
        </div>

        {/* Backend health status */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border ${
            backendOnline
              ? 'bg-olive-50 text-olive-800 border-olive-200'
              : 'bg-terracotta-50 text-terracotta-800 border-terracotta-200'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              backendOnline ? 'bg-olive-600' : 'bg-terracotta-600'
            }`}
          />
          <span className="text-[11px]">
            {backendOnline ? 'API Connected' : 'Backend Offline'}
          </span>
        </div>

        {/* Refresh button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="p-1.5 rounded border border-line bg-card text-ink-600 hover:text-ink-900 hover:bg-canvas-subtle transition-colors disabled:opacity-50"
            title="Refresh active view"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-olive-700' : ''}`} />
          </button>
        )}
      </div>
    </header>
  );
};
