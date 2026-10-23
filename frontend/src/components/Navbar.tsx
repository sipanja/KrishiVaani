import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  Sprout, 
  LayoutDashboard, 
  Trees, 
  Bot, 
  Stethoscope, 
  CloudSun, 
  ClockAlert, 
  Settings, 
  ShieldCheck, 
  LogOut, 
  Globe, 
  Bell, 
  Menu, 
  X,
  User as UserIcon
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onNavigate }) => {
  const { user, profile, language, setLanguage, logout, isAuthenticated, t } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      api.getNotifications()
        .then(res => setUnreadCount(res.unread_count))
        .catch(() => {});
    }
  }, [isAuthenticated, currentTab]);

  const navItems = [
    { id: 'dashboard', label: t.nav_dashboard, icon: LayoutDashboard },
    { id: 'farms', label: t.nav_farms, icon: Trees },
    { id: 'assistant', label: t.nav_assistant, icon: Bot },
    { id: 'crop-health', label: t.nav_crop_health, icon: Stethoscope },
    { id: 'weather', label: t.nav_weather, icon: CloudSun },
    { id: 'follow-ups', label: t.nav_followups, icon: ClockAlert },
  ];

  if (user?.role === 'admin') {
    navItems.push({ id: 'admin', label: t.nav_admin, icon: ShieldCheck });
  }

  const toggleLanguage = () => {
    setLanguage(language === 'hi' ? 'en' : 'hi');
  };

  return (
    <header className="sticky top-0 z-40 bg-krishi-900 text-white shadow-md border-b border-krishi-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div 
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => onNavigate(isAuthenticated ? 'dashboard' : 'landing')}
          >
            <div className="w-10 h-10 rounded-xl bg-krishi-700/80 border border-krishi-500/30 flex items-center justify-center text-krishi-300 shadow-inner group-hover:bg-krishi-600 transition-colors">
              <Sprout className="w-6 h-6 text-krishi-300" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white flex items-center">
                {t.app_title}
                <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-semibold bg-harvest text-white rounded">AI</span>
              </span>
              <p className="text-[11px] text-krishi-200 hidden sm:block">
                {language === 'hi' ? 'स्मार्ट भारतीय कृषि सहायक' : 'Smart Agriculture Voice Platform'}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          {isAuthenticated && (
            <nav className="hidden lg:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? 'bg-krishi-800 text-white shadow-sm border border-krishi-700'
                        : 'text-krishi-100 hover:bg-krishi-800/60 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          )}

          {/* Right Action Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-krishi-800/80 hover:bg-krishi-700 border border-krishi-700 text-krishi-100 transition-colors"
              title="Toggle Language / भाषा बदलें"
            >
              <Globe className="w-3.5 h-3.5 text-harvest-light" />
              <span>{language === 'hi' ? 'English' : 'हिंदी'}</span>
            </button>

            {isAuthenticated ? (
              <>
                {/* Notifications Bell */}
                <button
                  onClick={() => onNavigate('follow-ups')}
                  className="relative p-2 rounded-lg text-krishi-200 hover:text-white hover:bg-krishi-800 transition-colors"
                  title={t.notifications}
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-harvest text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Settings */}
                <button
                  onClick={() => onNavigate('settings')}
                  className={`p-2 rounded-lg transition-colors ${
                    currentTab === 'settings' ? 'bg-krishi-800 text-white' : 'text-krishi-200 hover:text-white hover:bg-krishi-800'
                  }`}
                  title={t.nav_settings}
                >
                  <Settings className="w-5 h-5" />
                </button>

                {/* Farmer Pill & Logout */}
                <div className="hidden sm:flex items-center pl-2 border-l border-krishi-800 space-x-2">
                  <div className="text-right">
                    <p className="text-xs font-medium text-white truncate max-w-[120px]">
                      {profile?.full_name || user?.username}
                    </p>
                    <p className="text-[10px] text-krishi-300">
                      {profile?.village ? `${profile.village}, ${profile.state || ''}` : user?.role}
                    </p>
                  </div>
                  <button
                    onClick={logout}
                    className="p-1.5 rounded-lg text-krishi-300 hover:text-red-300 hover:bg-red-950/40 transition-colors"
                    title={t.sign_out}
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>

                {/* Mobile hamburger button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden p-2 rounded-lg text-krishi-200 hover:text-white hover:bg-krishi-800"
                >
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onNavigate('login')}
                  className="px-3 py-1.5 text-xs font-semibold text-krishi-100 hover:text-white"
                >
                  {t.sign_in}
                </button>
                <button
                  onClick={() => onNavigate('register')}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-harvest hover:bg-harvest-dark text-white rounded-lg shadow-sm transition-all"
                >
                  {t.register}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && isAuthenticated && (
        <div className="lg:hidden bg-krishi-950/95 border-b border-krishi-800 px-4 pt-3 pb-5 space-y-1">
          <div className="pb-3 mb-2 border-b border-krishi-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-krishi-800 flex items-center justify-center text-krishi-300">
                <UserIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{profile?.full_name || user?.username}</p>
                <p className="text-xs text-krishi-300">{profile?.village || user?.phone || user?.email || 'Farmer'}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="px-2.5 py-1 text-xs text-red-300 bg-red-950/40 rounded border border-red-900/50 flex items-center space-x-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t.sign_out}</span>
            </button>
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-krishi-800 text-white font-semibold'
                    : 'text-krishi-200 hover:bg-krishi-900 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 text-krishi-400" />
                <span>{item.label}</span>
              </button>
            );
          })}

          <button
            onClick={() => {
              onNavigate('settings');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
              currentTab === 'settings' ? 'bg-krishi-800 text-white' : 'text-krishi-200 hover:bg-krishi-900'
            }`}
          >
            <Settings className="w-5 h-5 text-krishi-400" />
            <span>{t.nav_settings}</span>
          </button>
        </div>
      )}
    </header>
  );
};
