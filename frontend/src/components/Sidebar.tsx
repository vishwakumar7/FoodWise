import React from 'react';
import {
  CalendarRange,
  TrendingUp,
  SlidersHorizontal,
  ArrowLeftRight,
  BarChart3,
  ClipboardList,
  Activity,
  ChevronLeft,
  ChevronRight,
  CircleDot
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
    { id: 'dashboard' as NavTab, label: 'Operations Overview', icon: CalendarRange },
    { id: 'predict' as NavTab, label: 'Demand Forecasting', icon: TrendingUp },
    { id: 'scenarios' as NavTab, label: 'Production Planning', icon: SlidersHorizontal },
    { id: 'lab' as NavTab, label: 'Sensitivity Analysis', icon: ArrowLeftRight },
    { id: 'analytics' as NavTab, label: 'Historical Consumption', icon: BarChart3 },
    { id: 'waste' as NavTab, label: 'Shift Waste Log', icon: ClipboardList },
    { id: 'model' as NavTab, label: 'Model Diagnostics', icon: Activity },
  ];

  return (
    <aside
      className={`relative flex flex-col bg-card border-r border-line transition-all duration-200 z-30 select-none ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-line">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-olive-700 flex items-center justify-center shrink-0 text-white font-serif font-bold text-base shadow-sm">
            F
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-serif font-bold text-ink-900 tracking-tight text-base leading-tight">
                FoodWise
              </span>
              <span className="text-[11px] font-sans text-ink-500 font-medium tracking-normal">
                Operations Platform
              </span>
            </div>
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          className="p-1 rounded-md text-ink-400 hover:text-ink-800 hover:bg-canvas-subtle transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto">
        {!collapsed && (
          <div className="px-2.5 pb-2 text-[10px] font-semibold tracking-wider uppercase text-ink-400">
            Workspaces
          </div>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-md text-xs font-medium transition-colors group relative ${
                isActive
                  ? 'bg-olive-50 text-olive-900 font-semibold'
                  : 'text-ink-600 hover:text-ink-900 hover:bg-canvas-subtle'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-olive-700' : 'text-ink-500 group-hover:text-ink-700'
                }`}
              />

              {!collapsed && (
                <span className="truncate flex-1 text-left tracking-tight">{item.label}</span>
              )}

              {/* Clean active indicator */}
              {isActive && (
                <div className="absolute right-0 top-1.5 bottom-1.5 w-1 bg-olive-700 rounded-l" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Operational footer */}
      <div className="p-3 border-t border-line bg-canvas-subtle/50">
        <div className={`flex items-center gap-2 text-ink-600 text-[11px] ${collapsed ? 'justify-center' : ''}`}>
          <CircleDot className="w-3.5 h-3.5 text-olive-600 shrink-0" />
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-ink-800 truncate">RF Pipeline Ready</span>
              <span className="text-[10px] text-ink-400 font-mono">1,825 shift records</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
