import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  Sprout, 
  MapPin, 
  Trees, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  Loader2,
  Navigation
} from 'lucide-react';

interface OnboardingPageProps {
  onComplete: () => void;
}

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ onComplete }) => {
  const { user, profile, updateProfileState, language, t } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Step 1: Farmer Profile
  const [fullName, setFullName] = useState(profile?.full_name || user?.username || '');
  const [village, setVillage] = useState(profile?.village || '');
  const [district, setDistrict] = useState(profile?.district || '');
  const [stateName, setStateName] = useState(profile?.state || 'Gujarat');
  const [pincode, setPincode] = useState(profile?.pincode || '');

  // Step 2: Farm Profile
  const [farmName, setFarmName] = useState('Home Farm');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [geoLocating, setGeoLocating] = useState(false);
  const [sizeValue, setSizeValue] = useState('3.0');
  const [sizeUnit, setSizeUnit] = useState('Acres');
  const [soilType, setSoilType] = useState('Alluvial');
  const [irrigationMethod, setIrrigationMethod] = useState('Canal / Tube Well');
  const [drainageIssues, setDrainageIssues] = useState(false);
  const [createdFarmId, setCreatedFarmId] = useState<number | null>(null);

  // Step 3: First Crop
  const [cropName, setCropName] = useState('Paddy (Rice)');
  const [customCropName, setCustomCropName] = useState('');
  const [variety, setVariety] = useState('');
  const [sowingDate, setSowingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [growthStage, setGrowthStage] = useState('Vegetative / Tillering');

  // Geolocation handler
  const handleCaptureLocation = () => {
    if (!navigator.geolocation) {
      return;
    }
    setGeoLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setGeoLocating(false);
      },
      (err) => {
        console.warn('Geolocation auto-detect error:', err);
        setGeoLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Automatically trigger location detection on reaching step 2
  useEffect(() => {
    if (step === 2 && latitude === null && !geoLocating) {
      handleCaptureLocation();
    }
  }, [step]);

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.updateProfile({
        full_name: fullName,
        village,
        district,
        state: stateName,
        pincode,
        location_consent: true,
      });
      updateProfileState(res.profile);
      setStep(2);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.createFarm({
        name: farmName,
        latitude,
        longitude,
        size_value: parseFloat(sizeValue) || undefined,
        size_unit: sizeUnit,
        soil_type: soilType,
        irrigation_method: irrigationMethod,
        drainage_issues: drainageIssues,
      });
      setCreatedFarmId(res.farm.id);
      setStep(3);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create farm');
    } finally {
      setLoading(false);
    }
  };

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createdFarmId) {
      onComplete();
      return;
    }
    const finalCropName = cropName === 'Other' ? customCropName.trim() : cropName;
    if (!finalCropName) {
      setErrorMsg(t.enter_other_crop || 'Please enter the crop name');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      await api.createCrop({
        farm_id: createdFarmId,
        crop_name: finalCropName,
        variety: variety || undefined,
        sowing_date: sowingDate || undefined,
        growth_stage: growthStage,
      });
      onComplete();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to register crop');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-8 shadow-xl border border-krishi-100">
        
        {/* Progress tracker */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-2">
            <span>{t.onboarding_title}</span>
            <span>{t.step} {step} / 3</span>
          </div>
          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-krishi-600 h-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
            {errorMsg}
          </div>
        )}

        {/* Step 1: Farmer Profile */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-4">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900">{t.farmer_profile}</h3>
              <p className="text-xs text-gray-500">{language === 'hi' ? 'अपनी व्यक्तिगत व क्षेत्रीय जानकारी दर्ज करें' : 'Enter your personal address and regional details'}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">{t.full_name} *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-krishi-600 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">{t.village}</label>
                <input
                  type="text"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  placeholder="Navsari"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-krishi-600 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">{t.district}</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="Navsari"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-krishi-600 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">{t.state}</label>
                <input
                  type="text"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-krishi-600 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">PIN Code</label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="396445"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-krishi-600 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3 bg-krishi-700 hover:bg-krishi-800 text-white font-bold text-sm rounded-xl shadow transition-all flex items-center justify-center space-x-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  <span>{t.next}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Step 2: Farm Profile */}
        {step === 2 && (
          <form onSubmit={handleStep2Submit} className="space-y-4">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900">{t.farm_details}</h3>
              <p className="text-xs text-gray-500">{language === 'hi' ? 'खेत का स्थान और मिट्टी की प्रकृति दर्ज करें' : 'Configure your farm plot location and soil characteristics'}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">{t.farm_name} *</label>
              <input
                type="text"
                required
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                placeholder="Navsari South Plot"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-krishi-600 outline-none"
              />
            </div>

            {/* Geolocation Button */}
            <div className="p-3.5 bg-krishi-50 border border-krishi-200 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-krishi-900">{t.location_pin}</p>
                  <p className="text-[11px] text-krishi-700">
                    {latitude && longitude
                      ? `${t.location_detected} (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
                      : language === 'hi' ? 'सटीक मौसम पूर्वानुमान के लिए स्थान जोड़ें' : 'Required for hyper-local IMD hazard forecasts'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCaptureLocation}
                  disabled={geoLocating}
                  className="px-3 py-1.5 text-xs font-semibold bg-white text-krishi-800 border border-krishi-300 rounded-lg hover:bg-krishi-100 flex items-center space-x-1"
                >
                  <Navigation className={`w-3.5 h-3.5 ${geoLocating ? 'animate-spin' : ''}`} />
                  <span>{geoLocating ? 'Locating...' : 'Detect'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">{t.farm_size}</label>
                <input
                  type="number"
                  step="0.1"
                  value={sizeValue}
                  onChange={(e) => setSizeValue(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-krishi-600 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">{t.size_unit}</label>
                <select
                  value={sizeUnit}
                  onChange={(e) => setSizeUnit(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-krishi-600 outline-none bg-white"
                >
                  <option value="Acres">Acres (एकड़)</option>
                  <option value="Bigha">Bigha (बीघा)</option>
                  <option value="Hectares">Hectares (हेक्टेयर)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">{t.soil_type}</label>
                <select
                  value={soilType}
                  onChange={(e) => setSoilType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-krishi-600 outline-none bg-white"
                >
                  <option value="Alluvial">Alluvial (जलोढ़)</option>
                  <option value="Black">Black Soil (काली मिट्टी)</option>
                  <option value="Red">Red Soil (लाल मिट्टी)</option>
                  <option value="Clay Loam">Clay Loam (दोमट)</option>
                  <option value="Sandy">Sandy (रेतीली)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">{t.irrigation_method}</label>
                <select
                  value={irrigationMethod}
                  onChange={(e) => setIrrigationMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-krishi-600 outline-none bg-white"
                >
                  <option value="Canal / Tube Well">Canal / Borewell</option>
                  <option value="Drip Irrigation">Drip Irrigation (ड्रिप)</option>
                  <option value="Sprinkler">Sprinkler (फव्वारा)</option>
                  <option value="Rainfed">Rainfed (वर्षा आधारित)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="drainage"
                checked={drainageIssues}
                onChange={(e) => setDrainageIssues(e.target.checked)}
                className="w-4 h-4 text-krishi-700 rounded border-gray-300 focus:ring-krishi-500"
              />
              <label htmlFor="drainage" className="text-xs text-gray-700">
                {t.drainage_issues}
              </label>
            </div>

            <div className="flex items-center space-x-3 pt-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center space-x-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t.back}</span>
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-krishi-700 hover:bg-krishi-800 text-white font-bold text-sm rounded-xl shadow transition-all flex items-center justify-center space-x-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <span>{t.next}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: First Crop Cycle */}
        {step === 3 && (
          <form onSubmit={handleStep3Submit} className="space-y-4">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900">{t.crop_details}</h3>
              <p className="text-xs text-gray-500">{language === 'hi' ? 'अपनी वर्तमान में बोई गई फसल दर्ज करें' : 'Register your active standing crop'}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">{t.crop_name} *</label>
              <select
                value={cropName}
                onChange={(e) => {
                  setCropName(e.target.value);
                  if (e.target.value !== 'Other') {
                    setCustomCropName('');
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-krishi-600 outline-none bg-white font-medium"
              >
                <option value="Paddy (Rice)">Paddy / Rice (धान)</option>
                <option value="Wheat">Wheat (गेहूं)</option>
                <option value="Cotton">Cotton (कपास)</option>
                <option value="Mustard">Mustard (सरसों)</option>
                <option value="Sugarcane">Sugarcane (गन्ना)</option>
                <option value="Tomato">Tomato (टमाटर)</option>
                <option value="Potato">Potato (आलू)</option>
                <option value="Maize">Maize (मक्का)</option>
                <option value="Soybean">Soybean (सोयाबीन)</option>
                <option value="Chickpea / Gram">Chickpea / Gram (चना)</option>
                <option value="Other">➕ {t.crop_other || 'Other Crop (अन्य फसल)'}</option>
              </select>
            </div>

            {cropName === 'Other' && (
              <div className="animate-fade-in">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {t.enter_other_crop || 'Enter Other Crop Name'} *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={customCropName}
                  onChange={(e) => setCustomCropName(e.target.value)}
                  placeholder={t.other_crop_placeholder || 'e.g. Jute, Barley, Mango, Groundnut'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-krishi-400 bg-krishi-50/30 text-sm focus:ring-2 focus:ring-krishi-600 outline-none font-medium"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">{t.crop_variety}</label>
              <input
                type="text"
                value={variety}
                onChange={(e) => setVariety(e.target.value)}
                placeholder="e.g. PB-1121, HD-2967, Hybrid"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-krishi-600 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">{t.sowing_date}</label>
                <input
                  type="date"
                  value={sowingDate}
                  onChange={(e) => setSowingDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-krishi-600 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">{t.growth_stage}</label>
                <select
                  value={growthStage}
                  onChange={(e) => setGrowthStage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-krishi-600 outline-none bg-white text-xs"
                >
                  <option value="Germination">Germination (अंकुरण)</option>
                  <option value="Vegetative / Tillering">Vegetative / Tillering (कल्ले फूटना)</option>
                  <option value="Flowering / Panicle Initiation">Flowering / Booting (फूल व बाली)</option>
                  <option value="Grain Formation / Fruiting">Grain Formation (दाना भराव)</option>
                  <option value="Maturity / Harvest">Maturity / Harvest (परिपक्वता)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2.5 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center space-x-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t.back}</span>
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 bg-krishi-700 hover:bg-krishi-800 text-white font-bold text-sm rounded-xl shadow transition-all flex items-center justify-center space-x-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{t.finish_setup}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
