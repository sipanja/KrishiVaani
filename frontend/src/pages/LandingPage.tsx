import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Sprout, 
  Mic, 
  CloudRain, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles,
  BookOpen,
  Volume2
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (tab: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { language, t } = useAuth();

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24">
        {/* Subtle background ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-krishi-100/50 via-earth-100/30 to-transparent blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-krishi-100/80 border border-krishi-300/60 text-krishi-900 text-xs font-semibold mb-6 shadow-sm">
            <Sparkles className="w-4 h-4 text-harvest" />
            <span>
              {language === 'hi' 
                ? 'भारतीय किसानों के लिए समर्पित AI वॉयस प्लेटफ़ॉर्म' 
                : 'India’s Dedicated Agricultural Voice AI Platform'}
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight max-w-4xl mx-auto">
            {language === 'hi' ? (
              <>
                अपनी बोली में पाएं{' '}
                <span className="text-krishi-800 underline decoration-harvest decoration-4 underline-offset-8">
                  सटीक कृषि सलाह
                </span>{' '}
                और मौसम सुरक्षा
              </>
            ) : (
              <>
                Empowering Indian Farmers with{' '}
                <span className="text-krishi-800 underline decoration-harvest decoration-4 underline-offset-8">
                  Multilingual Voice AI
                </span>
              </>
            )}
          </h1>

          {/* Subheading */}
          <p className="mt-6 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            {t.subtagline}
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('register')}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-7 py-3.5 rounded-2xl bg-krishi-700 hover:bg-krishi-800 text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all transform active:scale-95"
            >
              <span>{t.get_started}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('login')}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-2xl bg-white hover:bg-gray-50 text-gray-800 font-semibold text-sm border border-gray-200 shadow-sm transition-all"
            >
              <span>{t.sign_in}</span>
            </button>
          </div>

          {/* Key Value Pillars */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            
            {/* Pillar 1: Voice in Indian Languages */}
            <div className="p-6 rounded-2xl bg-white border border-krishi-100/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-krishi-50 border border-krishi-200 flex items-center justify-center text-krishi-700 mb-4">
                <Mic className="w-6 h-6 text-krishi-700" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center space-x-1.5">
                <span>{language === 'hi' ? 'सहज वॉयस संवाद' : 'Natural Voice Interaction'}</span>
                <span className="px-1.5 py-0.5 text-[10px] bg-krishi-100 text-krishi-800 font-bold rounded">Gnani AI</span>
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                {language === 'hi'
                  ? 'टाइप करने की कोई मजबूरी नहीं। अपनी मातृभाषा (हिंदी, आदि) में बोलकर पूछें और स्पष्ट आवाज में समाधान सुनें।'
                  : 'Speak naturally in regional Indian languages. High-accuracy ASR and speech synthesis for zero-friction access.'}
              </p>
            </div>

            {/* Pillar 2: Source-Grounded ICAR Knowledge */}
            <div className="p-6 rounded-2xl bg-white border border-krishi-100/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-harvest-light/20 border border-harvest/30 flex items-center justify-center text-harvest mb-4">
                <BookOpen className="w-6 h-6 text-harvest" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center space-x-1.5">
                <span>{language === 'hi' ? 'प्रमाणित वैज्ञानिक ज्ञान' : 'Source-Grounded Advice'}</span>
                <span className="px-1.5 py-0.5 text-[10px] bg-amber-100 text-amber-800 font-bold rounded">ICAR / KVK</span>
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                {language === 'hi'
                  ? 'मनगढ़ंत सलाह से बचें। हर समाधान ICAR और राज्य कृषि विश्वविद्यालयों के सत्यापित वैज्ञानिक पैकेजों से प्रमाणित होता है।'
                  : 'Zero hallucinations. Recommendations cite verified research institutes with safety disclaimers and expert referrals.'}
              </p>
            </div>

            {/* Pillar 3: Real IMD Weather Intelligence */}
            <div className="p-6 rounded-2xl bg-white border border-krishi-100/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 mb-4">
                <CloudRain className="w-6 h-6 text-blue-700" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center space-x-1.5">
                <span>{language === 'hi' ? 'सटीक मौसम व आपदा चेतावनी' : 'Real Weather Hazards'}</span>
                <span className="px-1.5 py-0.5 text-[10px] bg-blue-100 text-blue-800 font-bold rounded">IMD Criteria</span>
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                {language === 'hi'
                  ? 'आपके खेत के निर्देशांकों पर भारी वर्षा (>64.5 मिमी) व लू के जोखिम का स्वतः मूल्यांकन और समय पूर्व चेतावनी।'
                  : 'Automated quantitative evaluation of heavy rainfall and heat stress calibrated to official Indian meteorological criteria.'}
              </p>
            </div>

          </div>

          {/* Commitment against fake data */}
          <div className="mt-12 p-4 rounded-xl bg-earth-100/80 border border-earth-300/60 max-w-xl mx-auto flex items-center space-x-3 text-left">
            <ShieldCheck className="w-6 h-6 text-krishi-800 shrink-0" />
            <p className="text-xs text-gray-700">
              <strong className="text-gray-900">
                {language === 'hi' ? 'असली किसानों के लिए सत्यनिष्ठा:' : 'Production Integrity:'}
              </strong>{' '}
              {language === 'hi'
                ? 'कोई डमी डेटा या बनावटी मौसम नहीं। आपकी खेती का वास्तविक रिकॉर्ड सुरक्षित डेटाबेस में बना रहता है।'
                : 'No demo data or fabricated advice. Operates strictly on verified agricultural records and authenticated farm profiles.'}
            </p>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            <Sprout className="w-4 h-4 text-krishi-700" />
            <span className="font-semibold text-gray-700">KrishiVaani AI</span>
            <span>— {language === 'hi' ? 'भारतीय कृषि प्रौद्योगिकी मंच' : 'Agricultural AI Platform'}</span>
          </div>
          <p className="mt-2 sm:mt-0">
            {language === 'hi'
              ? 'प्रमाणित स्रोत: ICAR, राज्य कृषि विश्वविद्यालय, भारतीय मौसम विज्ञान विभाग (IMD)'
              : 'Verified Resources: ICAR, State Agricultural Universities, IMD'}
          </p>
        </div>
      </footer>
    </div>
  );
};
