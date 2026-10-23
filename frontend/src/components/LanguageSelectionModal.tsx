import React from 'react';
import { useAuth } from '../context/AuthContext';
import { SUPPORTED_LANGUAGES, Language } from '../utils/translations';
import { Globe, Check, X, Sparkles } from 'lucide-react';

interface LanguageSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LanguageSelectionModal: React.FC<LanguageSelectionModalProps> = ({ isOpen, onClose }) => {
  const { language, setLanguage, t } = useAuth();

  if (!isOpen) return null;

  const handleSelect = (code: Language) => {
    setLanguage(code);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-krishi-200 relative max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100"
          title="Close / बंद करें"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6 pt-1">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-krishi-50 border border-krishi-200 flex items-center justify-center text-krishi-700 mb-3 shadow-inner">
            <Globe className="w-7 h-7 text-krishi-700" />
          </div>
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
            अपनी भाषा चुनें / Choose Language
          </h2>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto leading-relaxed">
            कृषिवाणी आपकी चुनी हुई भाषा में बोलेगी, सलाह देगी और संपूर्ण जानकारी दिखाएगी।
          </p>
        </div>

        {/* Language Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-6">
          {SUPPORTED_LANGUAGES.map((item) => {
            const isSelected = language === item.code;
            return (
              <button
                key={item.code}
                onClick={() => handleSelect(item.code)}
                className={`p-3.5 rounded-2xl text-left border transition-all flex items-center justify-between group ${
                  isSelected
                    ? 'bg-krishi-50 border-krishi-600 shadow-sm ring-2 ring-krishi-600/30'
                    : 'bg-white border-gray-200 hover:border-krishi-300 hover:bg-gray-50'
                }`}
              >
                <div>
                  <p className="text-base font-bold text-gray-900 group-hover:text-krishi-800 transition-colors">
                    {item.nativeName}
                  </p>
                  <p className="text-xs text-gray-500 font-medium">
                    {item.englishName}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {item.region}
                  </p>
                </div>

                {isSelected ? (
                  <div className="w-6 h-6 rounded-full bg-krishi-600 text-white flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full border border-gray-300 group-hover:border-krishi-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Info */}
        <div className="p-3 bg-earth-50 rounded-2xl border border-earth-200 flex items-center space-x-2 text-[11px] text-earth-900">
          <Sparkles className="w-4 h-4 text-harvest shrink-0" />
          <span>
            भाषा को बाद में कभी भी ऊपर दिए गए मेनू से बदला जा सकता है।
          </span>
        </div>

      </div>
    </div>
  );
};
