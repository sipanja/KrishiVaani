import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { SUPPORTED_LANGUAGES } from '../utils/translations';
import { 
  Settings, 
  User, 
  Bell, 
  Moon, 
  MapPin, 
  Trash2, 
  Save, 
  CheckCircle2, 
  Globe, 
  ShieldCheck,
  Loader2
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, profile, updateProfileState, language, setLanguage, logout, t } = useAuth();
  
  const [fullName, setFullName] = useState(profile?.full_name || user?.username || '');
  const [phone, setPhone] = useState(profile?.phone_number || user?.phone || '');
  const [village, setVillage] = useState(profile?.village || '');
  const [district, setDistrict] = useState(profile?.district || '');
  const [stateName, setStateName] = useState(profile?.state || 'Gujarat');
  const [pincode, setPincode] = useState(profile?.pincode || '');

  const [notifInApp, setNotifInApp] = useState(profile?.notification_in_app ?? true);
  const [notifSms, setNotifSms] = useState(profile?.notification_sms ?? false);
  const [notifWhatsapp, setNotifWhatsapp] = useState(profile?.notification_whatsapp ?? false);
  const [notifVoice, setNotifVoice] = useState(profile?.notification_voice ?? false);

  const [quietStart, setQuietStart] = useState(profile?.quiet_hours_start ?? 21);
  const [quietEnd, setQuietEnd] = useState(profile?.quiet_hours_end ?? 6);
  const [locationConsent, setLocationConsent] = useState(profile?.location_consent ?? false);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(false);

    try {
      const res = await api.updateProfile({
        full_name: fullName,
        phone_number: phone,
        village,
        district,
        state: stateName,
        pincode,
        notification_in_app: notifInApp,
        notification_sms: notifSms,
        notification_whatsapp: notifWhatsapp,
        notification_voice: notifVoice,
        quiet_hours_start: quietStart,
        quiet_hours_end: quietEnd,
        location_consent: locationConsent,
      });
      updateProfileState(res.profile);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = prompt(
      language === 'hi' 
        ? 'खाता और सभी फसल डेटा स्थायी रूप से हटाने के लिए DELETE टाइप करें:' 
        : 'Type DELETE to permanently erase your account and all associated farm data:'
    );
    if (confirmation !== 'DELETE') return;

    try {
      await api.deleteAccount();
      logout();
    } catch (err: any) {
      alert(err.message || 'Failed to delete account');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">{t.nav_settings}</h1>
        <p className="text-xs text-gray-500 mt-1">
          {language === 'hi'
            ? 'अपनी प्रोफ़ाइल, शांत समय (Quiet Hours), सूचनाएं व सहमति विकल्प प्रबंधित करें।'
            : 'Manage farmer profile, quiet hours, notification channels, and privacy consent.'}
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-green-50 text-green-800 text-xs rounded-2xl border border-green-200 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
          <span>{language === 'hi' ? 'सेटिंग्स सफलतापूर्वक सुरक्षित हो गईं।' : 'Settings updated and persisted successfully.'}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Section 1: Profile & Location */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
            <User className="w-4 h-4 text-krishi-700" />
            <span>{t.farmer_profile}</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">{t.full_name}</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-krishi-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">{t.phone_number}</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-krishi-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">{t.village}</label>
              <input
                type="text"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-krishi-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">{t.state}</label>
              <input
                type="text"
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-krishi-600 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Preferred Language */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
            <Globe className="w-4 h-4 text-krishi-700" />
            <span>{t.preferred_lang}</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {SUPPORTED_LANGUAGES.map((langOpt) => {
              const isSelected = language === langOpt.code;
              return (
                <button
                  key={langOpt.code}
                  type="button"
                  onClick={() => setLanguage(langOpt.code)}
                  className={`p-3 rounded-xl text-left border transition-all ${
                    isSelected
                      ? 'bg-krishi-800 text-white border-krishi-800 shadow-sm'
                      : 'bg-gray-50 border-gray-200 hover:border-krishi-300 text-gray-800'
                  }`}
                >
                  <p className="text-sm font-bold">{langOpt.nativeName}</p>
                  <p className={`text-[10px] ${isSelected ? 'text-krishi-200' : 'text-gray-500'}`}>
                    {langOpt.englishName}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: Quiet Hours & Notification Preferences */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
            <Moon className="w-4 h-4 text-krishi-700" />
            <span>{language === 'hi' ? 'शांत समय (Quiet Hours - रात में सूचनाएं बंद)' : 'Quiet Hours (Suppress Night Reminders)'}</span>
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {language === 'hi' ? 'शांत समय प्रारंभ (IST घंटा 0-23)' : 'Quiet Hours Start (24h format)'}
              </label>
              <input
                type="number"
                min="0"
                max="23"
                value={quietStart}
                onChange={(e) => setQuietStart(parseInt(e.target.value) || 21)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm outline-none"
              />
              <span className="text-[10px] text-gray-400 mt-0.5 block">Default: 21 (9:00 PM)</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {language === 'hi' ? 'शांत समय समाप्ति (IST घंटा 0-23)' : 'Quiet Hours End (24h format)'}
              </label>
              <input
                type="number"
                min="0"
                max="23"
                value={quietEnd}
                onChange={(e) => setQuietEnd(parseInt(e.target.value) || 6)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm outline-none"
              />
              <span className="text-[10px] text-gray-400 mt-0.5 block">Default: 6 (6:00 AM)</span>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <h3 className="text-xs font-bold text-gray-800 mb-2">Notification Channels</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <label className="flex items-center space-x-2 text-xs text-gray-700">
                <input
                  type="checkbox"
                  checked={notifInApp}
                  onChange={(e) => setNotifInApp(e.target.checked)}
                  className="rounded text-krishi-700"
                />
                <span>In-App Alerts</span>
              </label>
              <label className="flex items-center space-x-2 text-xs text-gray-700">
                <input
                  type="checkbox"
                  checked={notifSms}
                  onChange={(e) => setNotifSms(e.target.checked)}
                  className="rounded text-krishi-700"
                />
                <span>SMS</span>
              </label>
              <label className="flex items-center space-x-2 text-xs text-gray-700">
                <input
                  type="checkbox"
                  checked={notifWhatsapp}
                  onChange={(e) => setNotifWhatsapp(e.target.checked)}
                  className="rounded text-krishi-700"
                />
                <span>WhatsApp</span>
              </label>
              <label className="flex items-center space-x-2 text-xs text-gray-700">
                <input
                  type="checkbox"
                  checked={notifVoice}
                  onChange={(e) => setNotifVoice(e.target.checked)}
                  className="rounded text-krishi-700"
                />
                <span>Voice Call</span>
              </label>
            </div>
          </div>
        </div>

        {/* Section 4: Privacy & Location Consent */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-krishi-700" />
            <span>Privacy & Geolocation Consent</span>
          </h2>
          <label className="flex items-start space-x-3 text-xs text-gray-700">
            <input
              type="checkbox"
              checked={locationConsent}
              onChange={(e) => setLocationConsent(e.target.checked)}
              className="mt-0.5 rounded text-krishi-700"
            />
            <span className="leading-relaxed">
              I consent to KrishiVaani using my farm coordinates strictly for hyper-local IMD meteorological forecasts and disaster alerts. My data will never be sold or used for commercial profiling.
            </span>
          </label>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-krishi-700 hover:bg-krishi-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Saving...' : t.save}</span>
          </button>
        </div>

        {/* Danger Zone: Account Deletion */}
        <div className="mt-8 pt-6 border-t border-red-200 bg-red-50/50 p-6 rounded-3xl space-y-3">
          <h3 className="text-sm font-bold text-red-950 flex items-center space-x-2">
            <Trash2 className="w-4 h-4 text-red-600" />
            <span>Danger Zone — Permanent Account Deletion</span>
          </h3>
          <p className="text-xs text-red-900 leading-relaxed">
            Permanently delete your farmer account and all associated farms, crop cycles, symptoms history, observations, and notification logs. This action is irreversible.
          </p>
          <button
            type="button"
            onClick={handleDeleteAccount}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            Delete My Account & Farm Records
          </button>
        </div>

      </form>

    </div>
  );
};
