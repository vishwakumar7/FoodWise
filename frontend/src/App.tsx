import React, { useState, useEffect } from 'react';
import { Navbar, NavTab } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { PredictionPage } from './pages/PredictionPage';
import { ScenariosPage } from './pages/ScenariosPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { WastePage } from './pages/WastePage';
import { ModelPage } from './pages/ModelPage';
import { PredictRequest } from './types';
import { api } from './services/api';

export function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [backendOnline, setBackendOnline] = useState<boolean>(true);
  const [activeScenarioParams, setActiveScenarioParams] = useState<PredictRequest | null>(null);

  const checkHealth = async () => {
    try {
      await api.getHealth();
      setBackendOnline(true);
    } catch {
      setBackendOnline(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleNavigateToScenarios = (req: PredictRequest) => {
    setActiveScenarioParams(req);
    setCurrentTab('scenarios');
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardPage onNavigate={(tab) => setCurrentTab(tab)} />;
      case 'predict':
        return <PredictionPage onNavigateToScenarios={handleNavigateToScenarios} />;
      case 'scenarios':
        return <ScenariosPage initialRequest={activeScenarioParams} />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'waste':
        return <WastePage />;
      case 'model':
        return <ModelPage />;
      default:
        return <DashboardPage onNavigate={(tab) => setCurrentTab(tab)} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col font-sans">
      {/* Simple Top Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        backendOnline={backendOnline}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        {renderContent()}
      </main>

      {/* Simple Academic Project Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 text-center text-xs text-gray-500">
        FoodWise AI — College Canteen Demand Forecasting Project | B.Tech Final Year Mini Project
      </footer>
    </div>
  );
}

export default App;
