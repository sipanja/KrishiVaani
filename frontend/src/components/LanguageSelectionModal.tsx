import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { SUPPORTED_LANGUAGES, Language } from '../utils/translations';
import { Globe, Check, X, Sparkles, Search } from 'lucide-react';

interface LanguageSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LanguageSelectionModal: React.FC<LanguageSelectionModalProps> = ({ isOpen, onClose }) => {
  const { language, setLanguage } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState<string>('All');

  const filteredLanguages = useMemo(() => {
    return SUPPORTED_LANGUAGES.filter((item) => {
      const matchesZone = selectedZone === 'All' || item.zone === selectedZone;
      const q = searchQuery.trim().toLowerCase();
      if (!q) return matchesZone;

      const matchesSearch =
        item.nativeName.toLowerCase().includes(q) ||
        item.englishName.toLowerCase().includes(q) ||
        item.region.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q);

      return matchesZone && matchesSearch;
    });
  }, [searchQuery, selectedZone]);

  if (!isOpen) return null;

  const handleSelect = (code: Language) => {
    setLanguage(code);
    onClose();
  };

  const zones = ['All', 'North', 'South', 'East', 'West', 'Central'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl border border-krishi-200 relative max-h-[92vh] flex flex-col">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
          title="Close / बंद करें"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-4 pt-1 shrink-0">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-krishi-50 border border-krishi-200 flex items-center justify-center text-krishi-700 mb-2.5 shadow-inner">
            <Globe className="w-6 h-6 text-krishi-700" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            अपनी मातृभाषा चुनें / Choose Your Language
          </h2>
          <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto leading-relaxed">
            कृषिवाणी आपकी चुनी हुई भारतीय भाषा में बोलेगी, सलाह देगी और संपूर्ण जानकारी प्रदर्शित करेगी।
          </p>
        </div>

        {/* Search & Region Filters */}
        <div className="mb-4 space-y-2.5 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search language, state, or region (e.g. বাংলা, Odia, Malayalam, भोजपुरी)..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-krishi-600 focus:border-transparent bg-gray-50/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-gray-600"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {zones.map((zone) => (
              <button
                key={zone}
                onClick={() => setSelectedZone(zone)}
                className={`px-3 py-1 rounded-xl font-semibold whitespace-nowrap transition-all ${
                  selectedZone === zone
                    ? 'bg-krishi-800 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {zone === 'All' ? `All Languages (${SUPPORTED_LANGUAGES.length})` : `${zone} India`}
              </button>
            ))}
          </div>
        </div>

        {/* Language Grid */}
        <div className="overflow-y-auto flex-1 pr-1 mb-4">
          {filteredLanguages.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-sm font-semibold">No language matching "{searchQuery}"</p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedZone('All'); }}
                className="text-xs text-krishi-700 font-bold mt-2 underline"
              >
                View all {SUPPORTED_LANGUAGES.length} Indian languages
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {filteredLanguages.map((item) => {
                const isSelected = language === item.code;
                return (
                  <button
                    key={item.code}
                    onClick={() => handleSelect(item.code)}
                    className={`p-3 rounded-2xl text-left border transition-all flex items-center justify-between group ${
                      isSelected
                        ? 'bg-krishi-50 border-krishi-600 shadow-sm ring-2 ring-krishi-600/30'
                        : 'bg-white border-gray-200 hover:border-krishi-400 hover:bg-krishi-50/30 hover:shadow-xs'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-base font-bold text-gray-900 group-hover:text-krishi-800 transition-colors truncate">
                        {item.nativeName}
                      </p>
                      <p className="text-xs text-gray-600 font-medium truncate">
                        {item.englishName}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                        {item.region}
                      </p>
                    </div>

                    {isSelected ? (
                      <div className="w-6 h-6 rounded-full bg-krishi-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-gray-300 group-hover:border-krishi-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Info Banner */}
        <div className="p-2.5 sm:p-3 bg-earth-50 rounded-2xl border border-earth-200 flex items-center space-x-2 text-[11px] text-earth-900 shrink-0">
          <Sparkles className="w-4 h-4 text-harvest shrink-0" />
          <span>
            २७ भारतीय भाषाओं का समावेश: आप किसी भी समय ऊपर दिए गए 🌐 भाषा बटन से अपनी भाषा बदल सकते हैं।
          </span>
        </div>

      </div>
    </div>
  );
};
