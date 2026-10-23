import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Sprout, Lock, User, Phone, MapPin, Loader2, AlertCircle } from 'lucide-react';

interface AuthPageProps {
  initialMode?: 'login' | 'register';
  onSuccess: (isNewUser: boolean) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode = 'login', onSuccess }) => {
  const { login, language, t } = useAuth();
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  
  // Form fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [stateName, setStateName] = useState('Gujarat');
  const [village, setVillage] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (isLogin) {
        const res = await api.login(username, password);
        login(res.token, res.user, res.profile);
        onSuccess(false);
      } else {
        const res = await api.register({
          username,
          password,
          full_name: fullName || username,
          phone: phone || undefined,
          state: stateName,
          village: village || undefined,
          preferred_language: language,
        });
        login(res.token, res.user, res.profile);
        onSuccess(true); // Trigger onboarding for fresh farmer
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-xl border border-krishi-100/80">
        
        {/* Header Icon */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-krishi-50 border border-krishi-200/80 flex items-center justify-center text-krishi-700 mb-3 shadow-inner">
            <Sprout className="w-8 h-8 text-krishi-700" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isLogin ? t.sign_in : t.register}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {isLogin
              ? (language === 'hi' ? 'अपने कृषि खाते में प्रवेश करें' : 'Sign in to access your farm records')
              : (language === 'hi' ? 'स्मार्ट कृषि सहायता के लिए खाता जोड़ें' : 'Create your authenticated farmer account')}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3.5 bg-red-50 text-red-700 text-xs rounded-xl flex items-start space-x-2 border border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Full Name for registration */}
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {t.full_name}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={language === 'hi' ? 'जैसे: रमेश पटेल' : 'e.g. Ramesh Patel'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-krishi-600 focus:border-krishi-600 outline-none"
                />
              </div>
            </div>
          )}

          {/* Username / Mobile Identifier */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {isLogin ? (language === 'hi' ? 'यूजरनेम या मोबाइल नंबर' : 'Username or Mobile') : (language === 'hi' ? 'यूजरनेम' : 'Username')}
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ramesh_farmer"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-krishi-600 focus:border-krishi-600 outline-none"
              />
            </div>
          </div>

          {/* Mobile Phone for registration */}
          {!isLogin && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {t.phone_number}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-krishi-600 focus:border-krishi-600 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {t.state}
                </label>
                <select
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-krishi-600 focus:border-krishi-600 outline-none bg-white"
                >
                  <option value="Gujarat">Gujarat</option>
                  <option value="Punjab">Punjab</option>
                  <option value="Haryana">Haryana</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Madhya Pradesh">Madhya Pradesh</option>
                  <option value="Rajasthan">Rajasthan</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                  <option value="West Bengal">West Bengal</option>
                  <option value="Bihar">Bihar</option>
                </select>
              </div>
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {language === 'hi' ? 'पासवर्ड (कम से कम 6 अक्षर)' : 'Password (min. 6 characters)'}
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-krishi-600 focus:border-krishi-600 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-krishi-700 hover:bg-krishi-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2 transform active:scale-95 disabled:opacity-70 mt-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <span>{isLogin ? t.sign_in : t.register}</span>
            )}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-6 text-center text-xs text-gray-600">
          {isLogin ? (
            <span>
              {language === 'hi' ? 'नया खाता बनाना चाहते हैं?' : "Don't have an account?"}{' '}
              <button
                onClick={() => { setIsLogin(false); setErrorMsg(null); }}
                className="text-krishi-700 hover:text-krishi-900 font-bold underline"
              >
                {t.register}
              </button>
            </span>
          ) : (
            <span>
              {language === 'hi' ? 'पहले से खाता है?' : 'Already have an account?'}{' '}
              <button
                onClick={() => { setIsLogin(true); setErrorMsg(null); }}
                className="text-krishi-700 hover:text-krishi-900 font-bold underline"
              >
                {t.sign_in}
              </button>
            </span>
          )}
        </div>

      </div>
    </div>
  );
};
