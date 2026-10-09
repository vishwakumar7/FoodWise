import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { PredictionPage } from './pages/PredictionPage';
import { ScenariosPage } from './pages/ScenariosPage';
import { PredictionLabPage } from './pages/PredictionLabPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { WastePage } from './pages/WastePage';
import { ModelPage } from './pages/ModelPage';
import { PredictRequest } from './types';
import { api } from './services/api';

export function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [backendOnline, setBackendOnline] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
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

  const handleRefresh = async () => {
    setRefreshing(true);
    await checkHealth();
    setTimeout(() => setRefreshing(false), 600);
  };

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
      case 'lab':
        return <PredictionLabPage />;
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
    <div className="flex h-screen w-screen overflow-hidden bg-[#0B0F19] text-slate-100 antialiased font-sans">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          currentTab={currentTab}
          backendOnline={backendOnline}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />

        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;
