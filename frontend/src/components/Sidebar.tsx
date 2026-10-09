import React from 'react';
import {
  LayoutDashboard,
  BrainCircuit,
  SlidersHorizontal,
  FlaskConical,
  BarChart3,
  Trash2,
  Cpu,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Utensils
} from 'lucide-react';

export type NavTab = 'dashboard' | 'predict' | 'scenarios' | 'lab' | 'analytics' | 'waste' | 'model';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
}) => {
  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'predict' as NavTab, label: 'Demand Predictor', icon: BrainCircuit, badge: 'ML' },
    { id: 'scenarios' as NavTab, label: 'What-If Scenarios', icon: SlidersHorizontal, badge: 'Simulator' },
    { id: 'lab' as NavTab, label: 'Prediction Lab', icon: FlaskConical, badge: 'Lab' },
    { id: 'analytics' as NavTab, label: 'Historical Analytics', icon: BarChart3, badge: null },
    { id: 'waste' as NavTab, label: 'Food Waste Tracker', icon: Trash2, badge: 'Log' },
    { id: 'model' as NavTab, label: 'Model Performance', icon: Cpu, badge: null },
  ];

  return (
    <aside
      className={`relative flex flex-col bg-[#0D131F] border-r border-slate-800 transition-all duration-300 z-30 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
            <Utensils className="w-5 h-5 text-slate-950 font-bold" />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-base font-bold text-white tracking-wide flex items-center gap-1.5">
                FoodWise <span className="text-amber-500 font-extrabold text-xs px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">AI</span>
              </span>
              <span className="text-[11px] text-slate-400 truncate">Demand & Waste Engine</span>
            </div>
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div className={`px-2 py-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider ${collapsed ? 'text-center' : ''}`}>
          {collapsed ? '•••' : 'Main Menu'}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
                isActive
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={`w-5 h-5 shrink-0 transition-colors ${
                  isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />

              {!collapsed && (
                <span className="truncate flex-1 text-left">{item.label}</span>
              )}

              {!collapsed && item.badge && (
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}

              {/* Active indicator bar */}
              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-1 bg-amber-500 rounded-r" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Dataset & Engine Status footer */}
      <div className="p-3 border-t border-slate-800">
        <div className={`rounded-xl bg-slate-900/80 border border-slate-800 p-2.5 ${collapsed ? 'text-center' : ''}`}>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            {!collapsed && (
              <span className="text-xs font-medium text-slate-300">Model: Random Forest</span>
            )}
          </div>
          {!collapsed && (
            <p className="mt-1 text-[11px] text-slate-500 line-clamp-2">
              Trained on 1,825 synthetic canteen operational records.
            </p>
          )}
        </div>
      </div>
    </aside>
  );
};
