import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, FarmerProfile } from '../types';
import { api } from '../services/api';
import { supabase } from '../lib/supabase';
import { Language, translations, SUPPORTED_LANGUAGES } from '../utils/translations';

interface AuthContextType {
  user: User | null;
  profile: FarmerProfile | null;
  language: Language;
  t: typeof translations.en;
  isLoading: boolean;
  isAuthenticated: boolean;
  isLanguageModalOpen: boolean;
  openLanguageModal: () => void;
  closeLanguageModal: () => void;
  login: (token: string, user: User, profile: FarmerProfile | null) => void;
  logout: () => Promise<void>;
  updateProfileState: (profile: FarmerProfile) => void;
  setLanguage: (lang: Language) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<FarmerProfile | null>(null);
  
  // Initialize language from localStorage or default to 'hi'
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('krishivaani_lang') as Language;
    if (saved && SUPPORTED_LANGUAGES.some(l => l.code === saved)) {
      return saved;
    }
    return 'hi';
  });

  // Modal open on first visit if user has not explicitly picked a language
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState<boolean>(() => {
    return !localStorage.getItem('krishivaani_lang_selected');
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fallback to English if translation key missing
  const currentTranslations = translations[language] || translations.hi || translations.en;

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('krishivaani_lang', lang);
    localStorage.setItem('krishivaani_lang_selected', 'true');
    setIsLanguageModalOpen(false);

    if (profile && profile.preferred_language !== lang) {
      api.updateProfile({ preferred_language: lang }).catch(() => {});
    }
  };

  const openLanguageModal = () => setIsLanguageModalOpen(true);
  const closeLanguageModal = () => setIsLanguageModalOpen(false);

  const login = (token: string, newUser: User, newProfile: FarmerProfile | null) => {
    localStorage.setItem('krishivaani_token', token);
    setUser(newUser);
    setProfile(newProfile);
    if (newProfile?.preferred_language) {
      const pLang = newProfile.preferred_language as Language;
      if (SUPPORTED_LANGUAGES.some(l => l.code === pLang)) {
        setLanguageState(pLang);
        localStorage.setItem('krishivaani_lang', pLang);
        localStorage.setItem('krishivaani_lang_selected', 'true');
      }
    }
  };

  const logout = async () => {
    try {
      await api.logout();
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('krishivaani_token');
      setUser(null);
      setProfile(null);
    }
  };

  const updateProfileState = (updatedProfile: FarmerProfile) => {
    setProfile(updatedProfile);
  };

  const refreshUser = async () => {
    const token = localStorage.getItem('krishivaani_token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const data = await api.getMe();
      setUser(data.user);
      setProfile(data.profile);
      if (data.profile?.preferred_language) {
        const pLang = data.profile.preferred_language as Language;
        if (SUPPORTED_LANGUAGES.some(l => l.code === pLang)) {
          setLanguageState(pLang);
          localStorage.setItem('krishivaani_lang', pLang);
          localStorage.setItem('krishivaani_lang_selected', 'true');
        }
      }
    } catch {
      localStorage.removeItem('krishivaani_token');
      setUser(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        language,
        t: currentTranslations,
        isLoading,
        isAuthenticated: !!user,
        isLanguageModalOpen,
        openLanguageModal,
        closeLanguageModal,
        login,
        logout,
        updateProfileState,
        setLanguage,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
