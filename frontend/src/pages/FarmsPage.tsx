import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Farm, CropCycle } from '../types';
import { EmptyState } from '../components/EmptyState';
import { 
  Trees, 
  Sprout, 
  Plus, 
  Trash2, 
  Edit2, 
  Navigation, 
  Droplet, 
  MapPin, 
  Calendar,
  Loader2,
  X,
  CheckCircle2
} from 'lucide-react';

export const FarmsPage: React.FC = () => {
  const { language, t } = useAuth();
  
  const [farms, setFarms] = useState<Farm[]>([]);
  const [crops, setCrops] = useState<CropCycle[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [farmModalOpen, setFarmModalOpen] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);

  // Farm Form
  const [farmName, setFarmName] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [geoLocating, setGeoLocating] = useState(false);
  const [sizeValue, setSizeValue] = useState('2.5');
  const [sizeUnit, setSizeUnit] = useState('Acres');
  const [soilType, setSoilType] = useState('Alluvial');
  const [irrigationMethod, setIrrigationMethod] = useState('Canal / Tube Well');
  const [drainageIssues, setDrainageIssues] = useState(false);

  // Crop Form
  const [cropFarmId, setCropFarmId] = useState<number>(0);
  const [cropName, setCropName] = useState('Paddy (Rice)');
  const [customCropName, setCustomCropName] = useState('');
  const [variety, setVariety] = useState('');
  const [sowingDate, setSowingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [growthStage, setGrowthStage] = useState('Vegetative / Tillering');

  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [fRes, cRes] = await Promise.all([
        api.getFarms(),
        api.getCrops()
      ]);
      setFarms(fRes.farms);
      setCrops(cRes.crops);
      if (fRes.farms.length > 0 && !cropFarmId) {
        setCropFarmId(fRes.farms[0].id);
      }
    } catch (err) {
      console.error('Failed to load farms and crops:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCaptureLocation = () => {
    if (!navigator.geolocation) return;
    setGeoLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setGeoLocating(false);
      },
      () => setGeoLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleCreateFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createFarm({
        name: farmName,
        latitude,
        longitude,
        size_value: parseFloat(sizeValue) || undefined,
        size_unit: sizeUnit,
        soil_type: soilType,
        irrigation_method: irrigationMethod,
        drainage_issues: drainageIssues,
      });
      setFarmModalOpen(false);
      setFarmName('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create farm');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCrop = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCropName = cropName === 'Other' ? customCropName.trim() : cropName;
    if (!finalCropName) {
      alert(t.enter_other_crop || 'Please enter the crop name');
      return;
    }
    setSubmitting(true);
    try {
      await api.createCrop({
        farm_id: cropFarmId,
        crop_name: finalCropName,
        variety: variety || undefined,
        sowing_date: sowingDate || undefined,
        growth_stage: growthStage,
      });
      setCropModalOpen(false);
      setVariety('');
      setCustomCropName('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create crop');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFarm = async (id: number) => {
    if (!confirm(language === 'hi' ? 'क्या आप इस खेत और इसकी फसलों को हटाना चाहते हैं?' : 'Delete this farm and associated crops?')) return;
    try {
      await api.deleteFarm(id);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteCrop = async (id: number) => {
    if (!confirm(language === 'hi' ? 'क्या आप इस फसल को हटाना चाहते हैं?' : 'Delete this crop record?')) return;
    try {
      await api.deleteCrop(id);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateStage = async (cropId: number, nextStage: string) => {
    try {
      await api.updateCrop(cropId, { growth_stage: nextStage });
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">{t.nav_farms}</h1>
          <p className="text-xs text-gray-500 mt-1">
            {language === 'hi'
              ? 'अपने खेतों का विवरण, मिट्टी का प्रकार और सक्रिय फसलों की विकास अवस्था प्रबंधित करें।'
              : 'Manage registered farm plots, soil types, and monitor crop growth stages.'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setFarmModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-krishi-700 hover:bg-krishi-800 text-white font-semibold text-xs shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'hi' ? 'नया खेत जोड़ें' : 'Add Farm'}</span>
          </button>
          
          {farms.length > 0 && (
            <button
              onClick={() => {
                setCropFarmId(farms[0].id);
                setCropModalOpen(true);
              }}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-harvest hover:bg-harvest-dark text-white font-semibold text-xs shadow-sm transition-all"
            >
              <Sprout className="w-4 h-4" />
              <span>{language === 'hi' ? 'नई फसल जोड़ें' : 'Add Crop'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Farms Section */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2">
          <Trees className="w-5 h-5 text-krishi-700" />
          <span>{language === 'hi' ? 'पंजीकृत खेत' : 'Registered Farm Plots'} ({farms.length})</span>
        </h2>

        {farms.length === 0 ? (
          <EmptyState
            icon={Trees}
            title={t.empty_farms_title}
            description={t.empty_farms_desc}
            actionLabel={t.add_first_farm}
            onAction={() => setFarmModalOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {farms.map((farm) => (
              <div
                key={farm.id}
                className="p-5 rounded-3xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-gray-900">{farm.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {farm.size_value ? `${farm.size_value} ${farm.size_unit}` : 'Area not specified'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteFarm(farm.id)}
                      className="text-gray-400 hover:text-red-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                      title="Delete Farm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-4 space-y-1.5 text-xs text-gray-600">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-krishi-600 shrink-0" />
                      <span>
                        {farm.latitude && farm.longitude
                          ? `${farm.latitude.toFixed(3)}°N, ${farm.longitude.toFixed(3)}°E`
                          : 'Coordinates pending'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Droplet className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>{farm.irrigation_method || 'Rainfed'} • {farm.soil_type || 'Soil not set'}</span>
                    </div>

                    {farm.drainage_issues && (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-medium">
                        Waterlogging risk reported
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {farm.crop_count} Crop(s) linked
                  </span>
                  <button
                    onClick={() => {
                      setCropFarmId(farm.id);
                      setCropModalOpen(true);
                    }}
                    className="text-xs font-semibold text-krishi-700 hover:text-krishi-900"
                  >
                    + Add Crop to Farm
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Crops Section */}
      <section className="space-y-4 pt-4 border-t border-gray-200">
        <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2">
          <Sprout className="w-5 h-5 text-krishi-700" />
          <span>{language === 'hi' ? 'सक्रिय फसल चक्र' : 'Active Crop Cycles'} ({crops.length})</span>
        </h2>

        {crops.length === 0 ? (
          <EmptyState
            icon={Sprout}
            title={t.empty_crops_title}
            description={t.empty_crops_desc}
            actionLabel={farms.length > 0 ? t.add_first_crop : undefined}
            onAction={farms.length > 0 ? () => setCropModalOpen(true) : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {crops.map((crop) => (
              <div
                key={crop.id}
                className="p-5 rounded-3xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-semibold text-krishi-700 bg-krishi-50 px-2 py-0.5 rounded-full border border-krishi-200">
                        {crop.farm_name || 'Farm Plot'}
                      </span>
                      <h3 className="text-lg font-bold text-gray-900 mt-1">{crop.crop_name}</h3>
                      <p className="text-xs text-gray-500">
                        {crop.variety ? `Variety: ${crop.variety}` : 'Local Variety'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteCrop(crop.id)}
                      className="text-gray-400 hover:text-red-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                      title="Delete Crop"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Growth stage selector */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                      {t.growth_stage}
                    </label>
                    <select
                      value={crop.growth_stage}
                      onChange={(e) => handleUpdateStage(crop.id, e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-white border border-gray-300 text-gray-800 outline-none"
                    >
                      <option value="Germination">Germination</option>
                      <option value="Vegetative / Tillering">Vegetative / Tillering</option>
                      <option value="Flowering / Panicle Initiation">Flowering / Booting</option>
                      <option value="Grain Formation / Fruiting">Grain Formation / Fruiting</option>
                      <option value="Maturity / Harvest">Maturity / Harvest</option>
                    </select>
                  </div>

                  <div className="mt-3 text-xs text-gray-500 space-y-1">
                    {crop.sowing_date && (
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>Sown on: {new Date(crop.sowing_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    crop.active_issues_count > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {crop.active_issues_count > 0 ? `${crop.active_issues_count} Active Issue(s)` : 'Healthy'}
                  </span>
                  <span className="text-xs text-gray-400 capitalize">{crop.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Add Farm Modal */}
      {farmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-krishi-100 relative">
            <button
              onClick={() => setFarmModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{language === 'hi' ? 'नया खेत जोड़ें' : 'Add New Farm Plot'}</h3>
            <p className="text-xs text-gray-500 mb-4">{language === 'hi' ? 'खेत का नाम, क्षेत्रफल और सिंचाई दर्ज करें' : 'Configure coordinates and soil type for weather intelligence'}</p>

            <form onSubmit={handleCreateFarm} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">{t.farm_name} *</label>
                <input
                  type="text"
                  required
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  placeholder="North Canal Plot"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-krishi-600 outline-none"
                />
              </div>

              <div className="p-3 bg-krishi-50 border border-krishi-200 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-krishi-900">{t.location_pin}</p>
                  <p className="text-[11px] text-krishi-700">
                    {latitude && longitude ? `${latitude.toFixed(3)}, ${longitude.toFixed(3)}` : 'Auto-detect GPS coords'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCaptureLocation}
                  disabled={geoLocating}
                  className="px-2.5 py-1 text-xs font-semibold bg-white border border-krishi-300 text-krishi-800 rounded-lg"
                >
                  {geoLocating ? 'Detecting...' : 'Capture GPS'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{t.farm_size}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={sizeValue}
                    onChange={(e) => setSizeValue(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-krishi-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{t.size_unit}</label>
                  <select
                    value={sizeUnit}
                    onChange={(e) => setSizeUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm bg-white"
                  >
                    <option value="Acres">Acres</option>
                    <option value="Bigha">Bigha</option>
                    <option value="Hectares">Hectares</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{t.soil_type}</label>
                  <select
                    value={soilType}
                    onChange={(e) => setSoilType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm bg-white"
                  >
                    <option value="Alluvial">Alluvial</option>
                    <option value="Black">Black Soil</option>
                    <option value="Red">Red Soil</option>
                    <option value="Clay Loam">Clay Loam</option>
                    <option value="Sandy">Sandy</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{t.irrigation_method}</label>
                  <select
                    value={irrigationMethod}
                    onChange={(e) => setIrrigationMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm bg-white"
                  >
                    <option value="Canal / Tube Well">Canal / Well</option>
                    <option value="Drip Irrigation">Drip</option>
                    <option value="Sprinkler">Sprinkler</option>
                    <option value="Rainfed">Rainfed</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="modalDrainage"
                  checked={drainageIssues}
                  onChange={(e) => setDrainageIssues(e.target.checked)}
                  className="w-4 h-4 text-krishi-700 rounded"
                />
                <label htmlFor="modalDrainage" className="text-xs text-gray-700">
                  {t.drainage_issues}
                </label>
              </div>

              <div className="flex items-center space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setFarmModalOpen(false)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-krishi-700 hover:bg-krishi-800 text-white font-bold text-xs rounded-xl shadow"
                >
                  {submitting ? 'Saving...' : t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Crop Modal */}
      {cropModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-krishi-100 relative">
            <button
              onClick={() => setCropModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{language === 'hi' ? 'नई फसल जोड़ें' : 'Register Crop Cycle'}</h3>
            <p className="text-xs text-gray-500 mb-4">{language === 'hi' ? 'खेत चुनें और बोई गई फसल का नाम दर्ज करें' : 'Track growth stage and follow-ups'}</p>

            <form onSubmit={handleCreateCrop} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">{t.farm_name} *</label>
                <select
                  value={cropFarmId}
                  onChange={(e) => setCropFarmId(parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm bg-white font-medium"
                >
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
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
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm bg-white font-medium"
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
                  <option value="Chickpea / Gram">Chickpea (चना)</option>
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
                    placeholder={t.other_crop_placeholder || 'e.g. Jute, Barley, Mango'}
                    className="w-full px-3 py-2 rounded-xl border border-krishi-400 bg-krishi-50/30 text-sm focus:ring-2 focus:ring-krishi-600 outline-none font-medium"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">{t.crop_variety}</label>
                <input
                  type="text"
                  value={variety}
                  onChange={(e) => setVariety(e.target.value)}
                  placeholder="PB-1121, HD-2967, Hybrid"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-krishi-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{t.sowing_date}</label>
                  <input
                    type="date"
                    value={sowingDate}
                    onChange={(e) => setSowingDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{t.growth_stage}</label>
                  <select
                    value={growthStage}
                    onChange={(e) => setGrowthStage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm bg-white text-xs"
                  >
                    <option value="Germination">Germination</option>
                    <option value="Vegetative / Tillering">Vegetative / Tillering</option>
                    <option value="Flowering / Panicle Initiation">Flowering / Booting</option>
                    <option value="Grain Formation / Fruiting">Grain Formation</option>
                    <option value="Maturity / Harvest">Maturity / Harvest</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setCropModalOpen(false)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-krishi-700 hover:bg-krishi-800 text-white font-bold text-xs rounded-xl shadow"
                >
                  {submitting ? 'Saving...' : t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
