import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { WeatherData, Farm } from '../types';
import { getAutomaticCoordinates, Coordinates } from '../utils/location';
import { 
  CloudSun, 
  CloudRain, 
  Thermometer, 
  Wind, 
  Droplets, 
  AlertTriangle, 
  ShieldAlert, 
  MapPin, 
  RefreshCw,
  Calendar,
  Clock,
  Compass,
  Navigation
} from 'lucide-react';

export const WeatherPage: React.FC = () => {
  const { language, t } = useAuth();
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<number | undefined>(undefined);
  const [detectedCoords, setDetectedCoords] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const loadData = async (farmId?: number, forceGpsRefresh = false) => {
    try {
      if (forceGpsRefresh) setDetectingLocation(true);
      
      // Auto-detect browser/device coordinates
      let coords = detectedCoords;
      if (!coords || forceGpsRefresh) {
        coords = await getAutomaticCoordinates(forceGpsRefresh).catch(() => null);
        if (coords) setDetectedCoords(coords);
      }

      const [fRes, wRes] = await Promise.all([
        api.getFarms(),
        api.getWeather(farmId, coords?.lat, coords?.lon)
      ]);
      setFarms(fRes.farms);
      setWeatherData(wRes);
    } catch (err) {
      console.error('Weather load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setDetectingLocation(false);
    }
  };

  useEffect(() => {
    loadData(selectedFarmId);
  }, [selectedFarmId]);

  const handleRefresh = (forceGps = false) => {
    setRefreshing(true);
    loadData(selectedFarmId, forceGps);
  };

  const current = weatherData?.weather?.current;
  const daily = weatherData?.weather?.daily;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header & Farm / Location Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-gray-900">{t.nav_weather}</h1>
            {weatherData?.is_auto_detected && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200 flex items-center space-x-1">
                <Navigation className="w-3 h-3 text-green-600 animate-pulse" />
                <span>Auto-Detected Location</span>
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {language === 'hi'
              ? 'भारतीय मौसम विभाग (IMD) मानकों पर आधारित स्वचालित स्थान-विशिष्ट वर्षा व तापमान पूर्वानुमान।'
              : 'Real numerical weather forecasts automatically tuned to your location and evaluated against IMD criteria.'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedFarmId || ''}
            onChange={(e) => setSelectedFarmId(e.target.value ? parseInt(e.target.value) : undefined)}
            className="px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-semibold bg-white text-gray-800 outline-none shadow-xs"
          >
            <option value="">📍 Current Location (Auto GPS)</option>
            {farms.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>

          <button
            onClick={() => handleRefresh(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors shadow-xs"
            title="Refresh GPS & Weather"
            disabled={refreshing || detectingLocation}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing || detectingLocation ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh GPS</span>
          </button>
        </div>
      </div>

      {/* Stale Data Warning if provider timed out */}
      {weatherData?.weather?.is_stale && (
        <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-2xl border border-amber-200 flex items-center space-x-2">
          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{t.stale_data_warning}</span>
        </div>
      )}

      {/* IMD Agricultural Hazard Alerts */}
      {weatherData && weatherData.alerts && weatherData.alerts.length > 0 && (
        <div className="space-y-3">
          {weatherData.alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-3xl border flex items-start space-x-3.5 ${
                alert.severity === 'warning' || alert.severity === 'severe'
                  ? 'bg-red-50/80 border-red-300 text-red-950'
                  : 'bg-amber-50/80 border-amber-300 text-amber-950'
              }`}
            >
              <ShieldAlert className={`w-6 h-6 shrink-0 mt-0.5 ${
                alert.severity === 'warning' ? 'text-red-600' : 'text-amber-600'
              }`} />
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white shadow-xs">
                    {alert.source}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    alert.severity === 'warning' ? 'bg-red-200 text-red-900' : 'bg-amber-200 text-amber-900'
                  }`}>
                    {alert.severity}
                  </span>
                </div>
                <h3 className="text-sm font-bold mt-1">{alert.title}</h3>
                <p className="text-xs mt-1 leading-relaxed">{alert.description}</p>
                <div className="mt-2 text-[10px] opacity-75 flex items-center space-x-3">
                  <span>Valid From: {new Date(alert.valid_from).toLocaleDateString()}</span>
                  <span>Until: {new Date(alert.valid_to).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Current Conditions Card */}
      {current && (
        <div className="bg-gradient-to-br from-krishi-900 via-krishi-800 to-sky-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-krishi-700">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            <div>
              <div className="flex flex-wrap items-center gap-2 text-krishi-200 text-xs font-semibold">
                <div className="flex items-center space-x-1.5">
                  <MapPin className="w-4 h-4 text-harvest-light shrink-0" />
                  <span className="text-white text-sm sm:text-base font-bold">{weatherData?.location_label}</span>
                </div>
                {weatherData?.is_auto_detected && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-harvest/80 text-white shadow-xs">
                    Live GPS Location
                  </span>
                )}
                <span className="text-[11px] text-krishi-300">
                  ({weatherData?.weather.latitude.toFixed(4)}°N, {weatherData?.weather.longitude.toFixed(4)}°E)
                </span>
              </div>

              <div className="flex items-baseline space-x-4 mt-3">
                <span className="text-5xl sm:text-6xl font-black tracking-tight">
                  {current.temperature}°C
                </span>
                <div className="text-sm text-krishi-200">
                  <p className="font-semibold text-white">Feels like {current.feels_like}°C</p>
                  <p className="text-harvest-light text-xs font-medium">{current.condition}</p>
                </div>
              </div>

              <p className="text-[11px] text-krishi-300 mt-2">
                Last Observation: {new Date(weatherData?.weather.fetched_at || '').toLocaleTimeString()}
              </p>
            </div>

            {/* Environmental Sensors Grid */}
            <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
              <div className="p-3 sm:p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
                <Droplets className="w-5 h-5 text-sky-300 mx-auto mb-1" />
                <p className="text-[10px] text-krishi-200">{t.humidity}</p>
                <p className="text-base font-bold mt-0.5">{current.humidity}%</p>
              </div>

              <div className="p-3 sm:p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
                <CloudRain className="w-5 h-5 text-sky-300 mx-auto mb-1" />
                <p className="text-[10px] text-krishi-200">Precipitation</p>
                <p className="text-base font-bold mt-0.5">{current.precipitation_mm} mm</p>
              </div>

              <div className="p-3 sm:p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
                <Wind className="w-5 h-5 text-sky-300 mx-auto mb-1" />
                <p className="text-[10px] text-krishi-200">{t.wind_speed}</p>
                <p className="text-base font-bold mt-0.5">{current.wind_speed_kmh} km/h</p>
              </div>
            </div>

          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-krishi-300">
            <span>Provider: {weatherData?.weather.source}</span>
            <span>Elevation: {weatherData?.weather.timezone}</span>
          </div>
        </div>
      )}

      {/* 7-Day Outlook */}
      {daily && daily.time && (
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-krishi-700" />
            <h3 className="text-base font-bold text-gray-900">
              {language === 'hi' ? '7-दिवसीय कृषि मौसम पूर्वानुमान' : '7-Day Agricultural Forecast'}
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {daily.time.map((dayTime, idx) => {
              const maxT = daily.temperature_2m_max[idx];
              const minT = daily.temperature_2m_min[idx];
              const precip = daily.precipitation_sum[idx];
              const rainProb = daily.precipitation_probability_max ? daily.precipitation_probability_max[idx] : 0;
              const isHeavy = precip >= 64.5;

              return (
                <div
                  key={dayTime}
                  className={`p-3.5 rounded-2xl border text-center transition-all ${
                    isHeavy ? 'bg-amber-50 border-amber-300' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <p className="text-xs font-bold text-gray-800">
                    {new Date(dayTime).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { weekday: 'short' })}
                  </p>
                  <p className="text-[10px] text-gray-400 mb-2">
                    {new Date(dayTime).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { month: 'numeric', day: 'numeric' })}
                  </p>

                  <div className="my-2">
                    {precip > 5 ? (
                      <CloudRain className={`w-6 h-6 mx-auto ${isHeavy ? 'text-red-500' : 'text-blue-500'}`} />
                    ) : (
                      <CloudSun className="w-6 h-6 mx-auto text-amber-500" />
                    )}
                  </div>

                  <div className="text-xs font-extrabold text-gray-900">
                    {Math.round(maxT)}° <span className="text-gray-400 font-normal">{Math.round(minT)}°</span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-gray-200 text-[10px] text-gray-600">
                    <span>{precip} mm rain</span>
                    {rainProb > 0 && <span className="block text-blue-600 font-semibold">{rainProb}% prob</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Official IMD Agricultural Risk Criteria Card */}
      <div className="p-4 rounded-2xl bg-earth-100/70 border border-earth-300/60 text-xs text-earth-900 space-y-1">
        <h4 className="font-bold text-earth-950">
          {language === 'hi' ? 'IMD मौसम जोखिम मानक वर्गीकरण:' : 'Official IMD Hazard Threshold Calibration:'}
        </h4>
        <p className="leading-relaxed">
          • <strong>Heavy Rainfall:</strong> 64.5 – 115.5 mm/day (Watch / Yellow alert) | &gt;115.6 mm/day (Orange/Red warning). Postpone chemical spraying; ensure plot drainage.
        </p>
        <p className="leading-relaxed">
          • <strong>Heat Stress:</strong> Maximum temperature &ge; 40°C in plains. Requires light evening irrigation to safeguard vegetative and grain filling stages.
        </p>
      </div>

    </div>
  );
};
