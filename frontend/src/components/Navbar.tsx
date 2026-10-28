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
  User as UserIcon,
  MapPin
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onNavigate }) => {
  const { user, profile, language, openLanguageModal, logout, isAuthenticated, t } = useAuth();
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

  // Active language display name
  const currentLangLabel: Record<string, string> = {
    hi: 'हिंदी',
    en: 'English',
    bn: 'বাংলা',
    te: 'తెలుగు',
    mr: 'मराठी',
    ta: 'தமிழ்',
    gu: 'ગુજરાતી',
    pa: 'ਪੰਜਾਬੀ',
    kn: 'ಕನ್ನಡ',
    ml: 'മലയാളം',
    or: 'ଓଡ଼ିଆ',
    as: 'অসমীয়া',
    ur: 'اردو',
    bho: 'भोजपुरी',
    mai: 'मैथिली',
    sa: 'संस्कृतम्',
    kok: 'कोंकणी',
    ne: 'नेपाली',
    sd: 'سنڌي',
    ks: 'كٲشُر',
    doi: 'डोगरी',
    mni: 'মৈতৈলোন্',
    brx: 'बड़ो',
    sat: 'ᱥᱟᱱᱛᱟᱲᱤ',
    mwr: 'मारवाड़ी',
    hne: 'छत्तीसगढ़ी',
    bgc: 'हरियाणवी',
  };
  const activeLangName = currentLangLabel[language] || 'भाषा';

  const userInitial = (profile?.full_name || user?.username || 'F').trim().charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 bg-krishi-900/95 backdrop-blur-md text-white shadow-md border-b border-krishi-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-[4.25rem] py-2 gap-2">
          
          {/* Logo & Brand */}
          <div 
            className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer group shrink-0"
            onClick={() => onNavigate(isAuthenticated ? 'dashboard' : 'landing')}
          >
            <div className="w-10 h-10 rounded-xl bg-krishi-700/80 border border-krishi-500/30 flex items-center justify-center text-krishi-300 shadow-inner group-hover:bg-krishi-600 transition-colors shrink-0">
              <Sprout className="w-6 h-6 text-krishi-300" />
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-center space-x-1.5 leading-tight">
                <span className="text-base sm:text-lg lg:text-xl font-extrabold tracking-tight text-white whitespace-nowrap">
                  {t.app_title}
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-harvest text-white rounded tracking-wide shadow-sm shrink-0">
                  AI
                </span>
              </div>
              <p className="text-[11px] text-krishi-200 hidden sm:block leading-tight mt-0.5 whitespace-nowrap">
                {language === 'hi' ? 'स्मार्ट भारतीय कृषि सहायक' : 'Smart Agriculture Voice Platform'}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          {isAuthenticated && (
            <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`flex items-center space-x-1.5 px-2.5 xl:px-3 py-1.5 rounded-xl text-xs xl:text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-krishi-800 text-white font-semibold shadow-sm ring-1 ring-krishi-600/60'
                        : 'text-krishi-100 hover:bg-krishi-800/60 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-harvest-light' : 'text-krishi-300'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          )}

          {/* Right Action Controls */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            
            {/* Language Switcher Modal Trigger */}
            <button
              onClick={openLanguageModal}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-krishi-800 hover:bg-krishi-700 border border-krishi-700/80 text-krishi-100 shadow-sm transition-all shrink-0"
              title="Change Language / भाषा बदलें"
            >
              <Globe className="w-3.5 h-3.5 text-harvest-light shrink-0" />
              <span className="whitespace-nowrap">{activeLangName}</span>
            </button>

            {isAuthenticated ? (
              <>
                {/* Notifications Bell */}
                <button
                  onClick={() => onNavigate('follow-ups')}
                  className="relative p-2 rounded-xl text-krishi-200 hover:text-white hover:bg-krishi-800 transition-colors shrink-0"
                  title={t.notifications}
                >
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-harvest text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Settings */}
                <button
                  onClick={() => onNavigate('settings')}
                  className={`p-2 rounded-xl transition-colors shrink-0 ${
                    currentTab === 'settings' ? 'bg-krishi-800 text-white' : 'text-krishi-200 hover:text-white hover:bg-krishi-800'
                  }`}
                  title={t.nav_settings}
                >
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                {/* Farmer Pill & Logout */}
                <div className="hidden sm:flex items-center pl-2 border-l border-krishi-800 space-x-2 shrink-0">
                  <div className="w-8 h-8 rounded-full bg-krishi-800 border border-krishi-600/40 flex items-center justify-center text-krishi-200 font-bold text-xs uppercase shadow-inner shrink-0">
                    {userInitial}
                  </div>
                  <div className="text-left leading-tight max-w-[110px] xl:max-w-[140px]">
                    <p className="text-xs font-semibold text-white truncate">
                      {profile?.full_name || user?.username}
                    </p>
                    <p className="text-[10px] text-krishi-300 truncate flex items-center space-x-0.5 mt-0.5">
                      <MapPin className="w-2.5 h-2.5 text-krishi-400 shrink-0 inline mr-0.5" />
                      <span className="truncate">
                        {profile?.village ? `${profile.village}${profile.state ? ', ' + profile.state : ''}` : (user?.role || 'Farmer')}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={logout}
                    className="p-1.5 rounded-lg text-krishi-300 hover:text-red-300 hover:bg-red-950/40 transition-colors shrink-0 ml-1"
                    title={t.sign_out}
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>

                {/* Mobile hamburger button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden p-2 rounded-xl text-krishi-200 hover:text-white hover:bg-krishi-800 shrink-0"
                  aria-label="Toggle navigation menu"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => onNavigate('login')}
                  className="px-3 py-1.5 text-xs font-semibold text-krishi-100 hover:text-white whitespace-nowrap"
                >
                  {t.sign_in}
                </button>
                <button
                  onClick={() => onNavigate('register')}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-harvest hover:bg-harvest-dark text-white rounded-lg shadow-sm transition-all whitespace-nowrap"
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
              <div className="w-8 h-8 rounded-full bg-krishi-800 flex items-center justify-center text-krishi-300 font-bold text-xs">
                {userInitial}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{profile?.full_name || user?.username}</p>
                <p className="text-xs text-krishi-300">
                  {profile?.village ? `${profile.village}${profile.state ? ', ' + profile.state : ''}` : (user?.phone || user?.email || 'Farmer')}
                </p>
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

