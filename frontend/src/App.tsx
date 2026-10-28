import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LanguageSelectionModal } from './components/LanguageSelectionModal';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { FarmsPage } from './pages/FarmsPage';
import { AssistantPage } from './pages/AssistantPage';
import { CropHealthPage } from './pages/CropHealthPage';
import { WeatherPage } from './pages/WeatherPage';
import { FollowUpsPage } from './pages/FollowUpsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminPage } from './pages/AdminPage';
import { Loader2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, isAuthenticated, isLoading, isLanguageModalOpen, closeLanguageModal } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>(() => {
    return localStorage.getItem('krishivaani_token') ? 'dashboard' : 'landing';
  });
  const [extraData, setExtraData] = useState<any>(null);

  const handleNavigate = (tab: string, extra?: any) => {
    setCurrentTab(tab);
    if (extra !== undefined) {
      setExtraData(extra);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fcfaf7] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-krishi-700 animate-spin" />
        <p className="text-xs font-semibold text-gray-600">Loading KrishiVaani AI...</p>
      </div>
    );
  }

  // Routing resolution
  let view = currentTab;
  if (!isAuthenticated && !['landing', 'login', 'register'].includes(currentTab)) {
    view = 'landing';
  } else if (isAuthenticated && ['landing', 'login', 'register'].includes(currentTab)) {
    view = 'dashboard';
  }

  return (
    <div className="min-h-screen bg-[#fcfaf7] flex flex-col w-full overflow-x-hidden">
      {/* Top Navigation */}
      <Navbar currentTab={view} onNavigate={handleNavigate} />

      {/* Main Content View */}
      <main className="flex-1 pb-12">
        {view === 'landing' && <LandingPage onNavigate={handleNavigate} />}
        
        {view === 'login' && (
          <AuthPage 
            initialMode="login" 
            onSuccess={() => handleNavigate('dashboard')} 
          />
        )}

        {view === 'register' && (
          <AuthPage 
            initialMode="register" 
            onSuccess={(isNewUser) => handleNavigate(isNewUser ? 'onboarding' : 'dashboard')} 
          />
        )}

        {view === 'onboarding' && (
          <OnboardingPage onComplete={() => handleNavigate('dashboard')} />
        )}

        {view === 'dashboard' && <DashboardPage onNavigate={handleNavigate} />}
        {view === 'farms' && <FarmsPage />}
        {view === 'assistant' && (
          <AssistantPage 
            initialQuery={extraData?.initialQuery} 
            onNavigateTab={handleNavigate} 
          />
        )}
        {view === 'crop-health' && <CropHealthPage />}
        {view === 'weather' && <WeatherPage />}
        {view === 'follow-ups' && <FollowUpsPage />}
        {view === 'settings' && <SettingsPage />}
        {view === 'admin' && <AdminPage />}
      </main>

      {/* Language Selection Modal */}
      <LanguageSelectionModal 
        isOpen={isLanguageModalOpen} 
        onClose={closeLanguageModal} 
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
