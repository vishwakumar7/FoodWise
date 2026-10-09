import React from 'react';

export type NavTab = 'dashboard' | 'predict' | 'scenarios' | 'analytics' | 'waste' | 'model';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  backendOnline: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  backendOnline,
}) => {
  const tabs = [
    { id: 'dashboard' as NavTab, label: 'Dashboard' },
    { id: 'predict' as NavTab, label: 'Predict Demand' },
    { id: 'scenarios' as NavTab, label: 'What-If Scenarios' },
    { id: 'analytics' as NavTab, label: 'Analytics' },
    { id: 'waste' as NavTab, label: 'Waste Tracking' },
    { id: 'model' as NavTab, label: 'Model Performance' },
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Title */}
          <div className="flex items-center gap-3">
            <span className="font-bold text-xl text-blue-600 tracking-tight">FoodWise AI</span>
            <span className="text-xs text-gray-500 hidden sm:inline-block border-l border-gray-300 pl-3">
              Canteen Demand Forecasting Project
            </span>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                backendOnline ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-gray-600">
              {backendOnline ? 'Backend Online' : 'Backend Disconnected'}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-6 overflow-x-auto border-t border-gray-100 text-sm">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`py-3 px-1 border-b-2 font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-blue-600 text-blue-600 font-semibold'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
