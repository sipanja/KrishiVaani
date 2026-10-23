import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Farm, CropCycle, CropIssue, FollowUpTask, WeatherData } from '../types';
import { EmptyState } from '../components/EmptyState';
import { VoiceRecorderModal } from '../components/VoiceRecorderModal';
import { 
  Sprout, 
  Trees, 
  Mic, 
  AlertTriangle, 
  CloudSun, 
  CloudRain,
  ClockAlert, 
  Stethoscope, 
  ArrowRight, 
  Plus, 
  CheckCircle2, 
  RefreshCw,
  Droplets,
  Wind,
  Thermometer
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (tab: string, extra?: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user, profile, language, t } = useAuth();
  
  const [farms, setFarms] = useState<Farm[]>([]);
  const [crops, setCrops] = useState<CropCycle[]>([]);
  const [issues, setIssues] = useState<CropIssue[]>([]);
  const [followUps, setFollowUps] = useState<FollowUpTask[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);

  const loadDashboardData = async () => {
    try {
      const [farmsRes, cropsRes, issuesRes, followUpsRes, weatherRes] = await Promise.all([
        api.getFarms(),
        api.getCrops(),
        api.getIssues(),
        api.getFollowUps('pending'),
        api.getWeather().catch(() => null)
      ]);

      setFarms(farmsRes.farms);
      setCrops(cropsRes.crops);
      setIssues(issuesRes.issues);
      setFollowUps(followUpsRes.follow_ups);
      if (weatherRes) setWeatherData(weatherRes);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleVoiceTranscript = (transcript: string) => {
    // Navigate to Assistant with the transcribed query!
    onNavigate('assistant', { initialQuery: transcript });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Welcome & Quick Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-krishi-900 to-krishi-800 text-white p-6 rounded-3xl shadow-lg border border-krishi-700">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-krishi-700 text-krishi-200">
              {profile?.village ? `${profile.village}, ${profile.state || ''}` : 'Krishi Dashboard'}
            </span>
            <span className="text-xs text-krishi-300">
              {new Date().toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold mt-1">
            {t.welcome}, {profile?.full_name || user?.username}!
          </h1>
          <p className="text-xs text-krishi-200 mt-0.5">
            {language === 'hi'
              ? 'आपकी फसलों की वास्तविक स्थिति और मौसम चेतावनी नीचे प्रदर्शित हैं।'
              : 'Real database-synced overview of your crops, issues, and weather alerts.'}
          </p>
        </div>

        {/* Quick Voice Bar */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setVoiceModalOpen(true)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl bg-harvest hover:bg-harvest-dark text-white font-bold text-sm shadow-md transition-all transform active:scale-95"
          >
            <Mic className="w-5 h-5 animate-pulse" />
            <span>{t.quick_voice_action}</span>
          </button>
          
          <button
            onClick={handleRefresh}
            className="p-3 rounded-2xl bg-krishi-800/80 hover:bg-krishi-700 text-krishi-200 hover:text-white border border-krishi-700 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Real Statistics Overview Cards (No fake numbers!) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Farms */}
        <div 
          onClick={() => onNavigate('farms')}
          className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">{t.nav_farms}</span>
            <div className="w-8 h-8 rounded-lg bg-krishi-50 text-krishi-700 flex items-center justify-center group-hover:bg-krishi-100 transition-colors">
              <Trees className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{farms.length}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {farms.length === 1 ? '1 Registered Farm' : `${farms.length} Registered Farms`}
          </p>
        </div>

        {/* Active Crops */}
        <div 
          onClick={() => onNavigate('farms')}
          className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">{language === 'hi' ? 'सक्रिय फसलें' : 'Active Crops'}</span>
            <div className="w-8 h-8 rounded-lg bg-green-50 text-green-700 flex items-center justify-center group-hover:bg-green-100 transition-colors">
              <Sprout className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {crops.filter(c => c.status === 'active').length}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {crops.length} Total recorded cycles
          </p>
        </div>

        {/* Open Crop Issues */}
        <div 
          onClick={() => onNavigate('crop-health')}
          className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">{t.nav_crop_health}</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-700 flex items-center justify-center group-hover:bg-red-100 transition-colors">
              <Stethoscope className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {issues.filter(i => ['open', 'monitoring', 'worsening'].includes(i.status)).length}
          </p>
          <p className="text-[11px] text-red-600 font-medium mt-0.5">
            {issues.filter(i => ['open', 'monitoring', 'worsening'].includes(i.status)).length > 0
              ? 'Issues under observation'
              : 'All crops healthy'}
          </p>
        </div>

        {/* Pending Follow-ups */}
        <div 
          onClick={() => onNavigate('follow-ups')}
          className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">{t.nav_followups}</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
              <ClockAlert className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{followUps.length}</p>
          <p className="text-[11px] text-amber-700 font-medium mt-0.5">
            {followUps.length > 0 ? `${followUps.length} Due for feedback` : 'No pending tasks'}
          </p>
        </div>

      </div>

      {/* Severe Weather Alert Notice (if any exists in DB) */}
      {weatherData && weatherData.alerts && weatherData.alerts.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start space-x-3 text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                {weatherData.alerts[0].source}
              </span>
              <span className="px-1.5 py-0.2 bg-amber-200 text-amber-900 text-[10px] font-bold rounded">
                {weatherData.alerts[0].severity}
              </span>
            </div>
            <h4 className="text-sm font-bold mt-0.5">{weatherData.alerts[0].title}</h4>
            <p className="text-xs text-amber-800 mt-1">{weatherData.alerts[0].description}</p>
          </div>
          <button
            onClick={() => onNavigate('weather')}
            className="text-xs font-bold text-amber-800 underline shrink-0 hover:text-amber-950"
          >
            {language === 'hi' ? 'विस्तार देखें' : 'View Forecast'}
          </button>
        </div>
      )}

      {/* Main Grid: Weather Snapshot + Active Crops & Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 Cols): Crops & Issues */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Crops Card */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Sprout className="w-5 h-5 text-krishi-700" />
                <h3 className="text-base font-bold text-gray-900">
                  {language === 'hi' ? 'खेत में बोई गई फसलें' : 'Standing Crop Cycles'}
                </h3>
              </div>
              <button
                onClick={() => onNavigate('farms')}
                className="text-xs font-semibold text-krishi-700 hover:text-krishi-900 flex items-center space-x-1"
              >
                <span>{language === 'hi' ? 'सभी फसलें देखें' : 'Manage Crops'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {crops.length === 0 ? (
              <EmptyState
                icon={Sprout}
                title={t.empty_crops_title}
                description={t.empty_crops_desc}
                actionLabel={t.add_first_crop}
                onAction={() => onNavigate('farms')}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {crops.slice(0, 4).map((crop) => (
                  <div
                    key={crop.id}
                    className="p-4 rounded-2xl bg-krishi-50/50 border border-krishi-100 hover:border-krishi-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-krishi-900">{crop.crop_name}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white border border-krishi-200 text-krishi-800">
                          {crop.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {crop.variety ? `Variety: ${crop.variety}` : 'Variety not specified'}
                      </p>
                      <p className="text-[11px] font-medium text-krishi-800 mt-2 bg-white px-2 py-1 rounded-lg border border-krishi-100 inline-block">
                        {crop.growth_stage}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-krishi-100 flex items-center justify-between text-xs text-gray-500">
                      <span>{crop.farm_name || 'Farm Plot'}</span>
                      <button
                        onClick={() => onNavigate('crop-health')}
                        className="text-krishi-700 font-semibold hover:underline"
                      >
                        {crop.active_issues_count > 0 ? `${crop.active_issues_count} Active Issue(s)` : 'Report Issue'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Open Crop Health Issues */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Stethoscope className="w-5 h-5 text-red-600" />
                <h3 className="text-base font-bold text-gray-900">
                  {language === 'hi' ? 'फसल स्वास्थ्य समस्याएं' : 'Active Crop Issues'}
                </h3>
              </div>
              <button
                onClick={() => onNavigate('crop-health')}
                className="text-xs font-semibold text-krishi-700 hover:text-krishi-900 flex items-center space-x-1"
              >
                <span>{language === 'hi' ? 'समस्या रिपोर्ट करें' : 'View All'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {issues.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title={t.empty_issues_title}
                description={t.empty_issues_desc}
                actionLabel={t.report_issue_btn}
                onAction={() => onNavigate('crop-health')}
              />
            ) : (
              <div className="space-y-3">
                {issues.slice(0, 3).map((issue) => (
                  <div
                    key={issue.id}
                    className="p-4 rounded-2xl border border-gray-200 hover:border-gray-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-gray-900">{issue.title}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          issue.status === 'resolved' ? 'bg-green-100 text-green-800' :
                          issue.status === 'worsening' ? 'bg-red-100 text-red-800' :
                          issue.status === 'improving' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {issue.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                        {issue.diagnosis_estimate || issue.reported_symptoms}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {issue.crop_name} • Reported {new Date(issue.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <button
                      onClick={() => onNavigate('crop-health')}
                      className="px-3.5 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl transition-colors shrink-0"
                    >
                      {language === 'hi' ? 'निरीक्षण देखें' : 'View Timeline'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Live Weather Snapshot & Follow-Up Reminders */}
        <div className="space-y-6">
          
          {/* Weather Snapshot */}
          <div className="bg-gradient-to-br from-blue-900 to-sky-950 text-white rounded-3xl p-6 shadow-md border border-blue-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <CloudSun className="w-5 h-5 text-amber-300" />
                <h3 className="text-sm font-bold">{t.weather_summary}</h3>
              </div>
              <button
                onClick={() => onNavigate('weather')}
                className="text-xs text-blue-200 hover:text-white underline"
              >
                7-Day Forecast
              </button>
            </div>

            {weatherData?.weather?.current ? (
              <div>
                <p className="text-xs text-blue-200 truncate">{weatherData.location_label}</p>
                <div className="flex items-baseline space-x-2 mt-2">
                  <span className="text-4xl font-extrabold">
                    {weatherData.weather.current.temperature}°C
                  </span>
                  <span className="text-xs text-blue-300">
                    Feels {weatherData.weather.current.feels_like}°C
                  </span>
                </div>
                <p className="text-xs font-medium text-amber-300 mt-1">
                  {weatherData.weather.current.condition}
                </p>

                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-blue-800/80 text-center">
                  <div className="p-2 rounded-xl bg-blue-950/60">
                    <Droplets className="w-3.5 h-3.5 text-blue-300 mx-auto mb-1" />
                    <p className="text-[10px] text-blue-300">{t.humidity}</p>
                    <p className="text-xs font-bold mt-0.5">{weatherData.weather.current.humidity}%</p>
                  </div>
                  <div className="p-2 rounded-xl bg-blue-950/60">
                    <CloudRain className="w-3.5 h-3.5 text-blue-300 mx-auto mb-1" />
                    <p className="text-[10px] text-blue-300">Rainfall</p>
                    <p className="text-xs font-bold mt-0.5">{weatherData.weather.current.precipitation_mm} mm</p>
                  </div>
                  <div className="p-2 rounded-xl bg-blue-950/60">
                    <Wind className="w-3.5 h-3.5 text-blue-300 mx-auto mb-1" />
                    <p className="text-[10px] text-blue-300">Wind</p>
                    <p className="text-xs font-bold mt-0.5">{weatherData.weather.current.wind_speed_kmh} km/h</p>
                  </div>
                </div>

                <p className="text-[10px] text-blue-400 mt-3 text-right">
                  Source: Open-Meteo & IMD Criteria
                </p>
              </div>
            ) : (
              <p className="text-xs text-blue-200">Loading verified meteorological observations...</p>
            )}
          </div>

          {/* Pending Follow-ups Card */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <ClockAlert className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold text-gray-900">{t.nav_followups}</h3>
              </div>
              <button
                onClick={() => onNavigate('follow-ups')}
                className="text-xs font-semibold text-krishi-700 hover:text-krishi-900"
              >
                View
              </button>
            </div>

            {followUps.length === 0 ? (
              <div className="p-4 text-center rounded-2xl bg-gray-50 text-gray-500 text-xs">
                {t.empty_followups_desc}
              </div>
            ) : (
              <div className="space-y-3">
                {followUps.slice(0, 2).map((task) => (
                  <div key={task.id} className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs">
                    <p className="font-bold text-amber-950">{task.reason}</p>
                    <p className="text-amber-900 mt-1 text-[11px] leading-relaxed">
                      "{task.prompt_question}"
                    </p>
                    <button
                      onClick={() => onNavigate('follow-ups')}
                      className="mt-2.5 w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-[11px] transition-colors"
                    >
                      {language === 'hi' ? 'उत्तर दें (सुधार / स्थिति)' : 'Respond Now'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Voice Modal */}
      <VoiceRecorderModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        onTranscriptComplete={handleVoiceTranscript}
      />
    </div>
  );
};
