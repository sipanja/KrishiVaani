import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, FarmerProfile } from '../types';
import { api } from '../services/api';
import { Language, translations } from '../utils/translations';

interface AuthContextType {
  user: User | null;
  profile: FarmerProfile | null;
  language: Language;
  t: typeof translations.en;
  isLoading: boolean;
  isAuthenticated: boolean;
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
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('krishivaani_lang') as Language) || 'hi';
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const t = translations[language] || translations.hi;

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('krishivaani_lang', lang);
    if (profile && profile.preferred_language !== lang) {
      api.updateProfile({ preferred_language: lang }).catch(() => {});
    }
  };

  const login = (token: string, newUser: User, newProfile: FarmerProfile | null) => {
    localStorage.setItem('krishivaani_token', token);
    setUser(newUser);
    setProfile(newProfile);
    if (newProfile?.preferred_language) {
      const pLang = newProfile.preferred_language === 'en' ? 'en' : 'hi';
      setLanguageState(pLang);
      localStorage.setItem('krishivaani_lang', pLang);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
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
        const pLang = data.profile.preferred_language === 'en' ? 'en' : 'hi';
        setLanguageState(pLang);
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
        t,
        isLoading,
        isAuthenticated: !!user,
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
