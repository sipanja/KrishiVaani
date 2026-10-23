import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Conversation, ChatMessage, CropCycle } from '../types';
import { VoiceRecorderModal } from '../components/VoiceRecorderModal';
import { AudioPlayerButton } from '../components/AudioPlayerButton';
import { 
  Bot, 
  Send, 
  Mic, 
  Plus, 
  BookOpen, 
  ExternalLink, 
  Loader2, 
  Sparkles,
  MessageSquare,
  ShieldCheck,
  Sprout
} from 'lucide-react';

const ASSISTANT_STRINGS: Record<string, {
  welcome_title: string;
  welcome_desc: string;
  starter_1: string;
  starter_2: string;
  starter_3: string;
  placeholder: string;
  analyzing: string;
}> = {
  bn: {
    welcome_title: "কৃষিবাণী AI সহকারীতে স্বাগতম",
    welcome_desc: "আপনার ফসলের যেকোনো সমস্যা বাংলায় লিখে বা মুখে বলে জিজ্ঞাসা করুন। আইসিএআর (ICAR) অনুমোদিত তথ্যে উত্তর পাবেন।",
    starter_1: "ধানের ব্লাস্ট রোগের লক্ষণ ও জৈব প্রতিকার কী?",
    starter_2: "গমের হলুদ মরিচা রোগ কীভাবে দূর করব?",
    starter_3: "আমি জানি না আমার ফসলের কী হয়েছে, সাহায্য করুন",
    placeholder: "আপনার ফসলের সমস্যা বা প্রশ্ন লিখুন...",
    analyzing: "কৃষিবাণী আইসিএআর রেকর্ডের ভিত্তিতে উত্তর প্রস্তুত করছে..."
  },
  hi: {
    welcome_title: "कृषिवाणी AI में आपका स्वागत है",
    welcome_desc: "अपनी फसल की कोई भी समस्या बोलकर या लिखकर पूछें। हम प्रमाणित वैज्ञानिक ICAR स्रोतों से उत्तर देंगे।",
    starter_1: "धान में ब्लास्ट रोग का जैविक इलाज क्या है?",
    starter_2: "गेहूं में पीला रतुआ के लक्षण और उपाय?",
    starter_3: "मेरी फसल खराब हो रही है, क्या बीमारी है?",
    placeholder: "अपनी फसल की समस्या पूछें...",
    analyzing: "कृषिवाणी उत्तर तैयार कर रही है..."
  },
  te: {
    welcome_title: "కృషివాణి AI కి స్వాగతం",
    welcome_desc: "మీ పంట సమస్యలను మీ మాతృభాషలో మాట్లాడి లేదా టైప్ చేసి అడగండి.",
    starter_1: "వరిలో అగ్గి తెగులు నివారణ చర్యలు ఏమిటి?",
    starter_2: "పత్తిలో పురుగుల నివారణ ఎలా చేయాలి?",
    starter_3: "నా పంటకు ఏమైందో అర్థం కావడం లేదు, సహాయం చేయండి",
    placeholder: "మీ పంట సమస్యను అడగండి...",
    analyzing: "కృషివాణి సమాధానం సిద్ధం చేస్తోంది..."
  },
  ta: {
    welcome_title: "கிருஷிவாணி AI-க்கு நல்வரவு",
    welcome_desc: "உங்கள் பயிர் பிரச்சனைகளை தமிழில் பேசி அல்லது எழுதி கேளுங்கள்.",
    starter_1: "நெல்லில் குலை நோய் கட்டுப்பாடு முறைகள் என்ன?",
    starter_2: "பருத்தியில் பூச்சி தாக்குதலை தடுப்பது எப்படி?",
    starter_3: "என் பயிருக்கு என்ன ஆச்சுன்னு தெரியல, உதவவும்",
    placeholder: "உங்கள் பயிர் கேள்வியை கேட்கவும்...",
    analyzing: "கிருஷிவாணி பதில் தயாரிக்கிறது..."
  },
  mr: {
    welcome_title: "कृषीवाणी AI मध्ये आपले स्वागत आहे",
    welcome_desc: "आपल्या पिकाची कोणतीही समस्या बोलून किंवा लिहून विचारा.",
    starter_1: "भातावरील करपा रोगाचे नियंत्रण कसे करावे?",
    starter_2: "गव्हावरील तांबेरा रोगाची लक्षणे कोणती?",
    starter_3: "माझ्या पिकाला काय झाले आहे, कृपया मदत करा",
    placeholder: "आपल्या पिकाची समस्या विचारा...",
    analyzing: "कृषीवाणी उत्तर तयार करत आहे..."
  },
  gu: {
    welcome_title: "કૃષિવાણી AI માં આપનું સ્વાગત છે",
    welcome_desc: "તમારા પાકની કોઈપણ સમસ્યા બોલીને કે લખીને પૂછો.",
    starter_1: "ડાંગરમાં કરપો રોગનું નિયંત્રણ કેવી રીતે કરવું?",
    starter_2: "ઘઉંમાં ગેરુ રોગના લક્ષણો શું છે?",
    starter_3: "મને ખબર નથી કે મારા પાકને શું થયું છે, મદદ કરો",
    placeholder: "તમારા પાકની સમસ્યા પૂછો...",
    analyzing: "કૃષિવાણી ઉત્તર તૈયાર કરી રહી છે..."
  },
  pa: {
    welcome_title: "ਕ੍ਰਿਸ਼ੀਵਾਣੀ AI ਵਿੱਚ ਜੀ ਆਇਆਂ ਨੂੰ",
    welcome_desc: "ਆਪਣੀ ਫ਼ਸਲ ਬਾਰੇ ਕੋਈ ਵੀ ਸਵਾਲ ਬੋਲ ਕੇ ਜਾਂ ਲਿਖ ਕੇ ਪੁੱਛੋ।",
    starter_1: "ਝੋਨੇ ਦੇ ਝੁਲਸਾ ਰੋਗ ਦਾ ਇਲਾਜ ਕੀ ਹੈ?",
    starter_2: "ਕਣਕ ਦੀ ਪੀਲੀ ਕੁੰਗੀ ਦੇ ਲੱਛਣ ਅਤੇ ਰੋਕਥਾਮ?",
    starter_3: "ਮੈਨੂੰ ਨਹੀਂ ਪਤਾ ਮੇਰੀ ਫ਼ਸਲ ਨੂੰ ਕੀ ਹੋਇਆ, ਮਦਦ ਕਰੋ",
    placeholder: "ਆਪਣੀ ਫ਼ਸਲ ਬਾਰੇ ਸਵਾਲ ਪੁੱਛੋ...",
    analyzing: "ਕ੍ਰਿਸ਼ੀਵਾਣੀ ਜਵਾਬ ਤਿਆਰ ਕਰ ਰਹੀ ਹੈ..."
  },
  kn: {
    welcome_title: "ಕೃಷಿವಾಣಿ AI ಗೆ ಸುಸ್ವಾಗತ",
    welcome_desc: "ನಿಮ್ಮ ಬೆಳೆಯ ಯಾವುದೇ ಸಮಸ್ಯೆಯನ್ನು ಮಾತನಾಡಿ ಅಥವಾ ಬರೆದು ಕೇಳಿ.",
    starter_1: "ಭತ್ತದ ಬೆಂಕಿ ರೋಗದ ನಿಯಂತ್ರಣ ಕ್ರಮಗಳು ಯಾವುವು?",
    starter_2: "ಗೋಧಿ ಬೆಳೆಯಲ್ಲಿ ರೋಗ ಲಕ್ಷಣಗಳನ್ನು ಗುರುತಿಸುವುದು ಹೇಗೆ?",
    starter_3: "ನನ್ನ ಬೆಳೆಗೆ ಏನಾಗಿದೆ ಎಂದು ತಿಳಿದಿಲ್ಲ, ಸಹಾಯ ಮಾಡಿ",
    placeholder: "ನಿಮ್ಮ ಬೆಳೆಯ ಸಮಸ್ಯೆಯನ್ನು ಕೇಳಿ...",
    analyzing: "ಕೃಷಿವಾಣಿ ಉತ್ತರ ಸಿದ್ಧಪಡಿಸುತ್ತಿದೆ..."
  },
  en: {
    welcome_title: "Welcome to KrishiVaani Assistant",
    welcome_desc: "Ask about crop cultivation, leaf diseases, pest control, or weather precautions grounded in ICAR records.",
    starter_1: "What is the control measure for blast in paddy?",
    starter_2: "How to identify yellow rust in wheat?",
    starter_3: "I don't know what happened to my crop, please help",
    placeholder: "Ask your agricultural question...",
    analyzing: "KrishiVaani is analyzing with ICAR records..."
  }
};

interface AssistantPageProps {
  initialQuery?: string;
  onNavigateTab: (tab: string, extra?: any) => void;
}

export const AssistantPage: React.FC<AssistantPageProps> = ({ initialQuery, onNavigateTab }) => {
  const { language, t } = useAuth();
  const loc = ASSISTANT_STRINGS[language] || ASSISTANT_STRINGS.en;
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [crops, setCrops] = useState<CropCycle[]>([]);
  const [selectedCropId, setSelectedCropId] = useState<number | undefined>(undefined);

  const [inputContent, setInputContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const [convRes, cropRes] = await Promise.all([
        api.getConversations(),
        api.getCrops()
      ]);
      setConversations(convRes.conversations);
      setCrops(cropRes.crops);

      if (convRes.conversations.length > 0) {
        const firstId = convRes.conversations[0].id;
        setActiveConvId(firstId);
        loadMessages(firstId);
      } else {
        // Create initial default conversation
        const newConv = await api.createConversation('General Advisory');
        setConversations([newConv.conversation]);
        setActiveConvId(newConv.conversation.id);
        setMessages([]);
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (convId: number) => {
    try {
      const res = await api.getConversation(convId);
      setMessages(res.conversation.messages || []);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // Handle passed initialQuery (e.g. from voice on dashboard)
  useEffect(() => {
    if (initialQuery && activeConvId && !sending) {
      handleSendMessage(initialQuery);
    }
  }, [initialQuery, activeConvId]);

  const handleStartNewChat = async () => {
    try {
      const title = selectedCropId 
        ? `${crops.find(c => c.id === selectedCropId)?.crop_name} Advisory` 
        : 'Crop Advisory';
      const res = await api.createConversation(title, selectedCropId);
      setConversations([res.conversation, ...conversations]);
      setActiveConvId(res.conversation.id);
      setMessages([]);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputContent).trim();
    if (!text || !activeConvId || sending) return;

    setInputContent('');
    setSending(true);

    try {
      const res = await api.sendMessage(activeConvId, text, language);
      setMessages((prev) => [...prev, res.user_message, res.assistant_message]);
    } catch (err: any) {
      alert(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-[calc(100vh-6rem)] flex flex-col md:flex-row gap-6">
      
      {/* Sidebar: Conversation History & Crop Context */}
      <div className="w-full md:w-80 shrink-0 bg-white rounded-3xl p-5 border border-gray-200 shadow-sm flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2">
              <Bot className="w-5 h-5 text-krishi-700" />
              <span>{t.nav_assistant}</span>
            </h2>
            <button
              onClick={handleStartNewChat}
              className="p-1.5 rounded-xl bg-krishi-50 hover:bg-krishi-100 text-krishi-700 border border-krishi-200"
              title="New Chat"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Active crop selector for grounded context */}
          {crops.length > 0 && (
            <div className="p-3 bg-krishi-50/70 border border-krishi-100 rounded-2xl">
              <label className="block text-[11px] font-semibold text-krishi-900 mb-1 flex items-center space-x-1">
                <Sprout className="w-3.5 h-3.5 text-krishi-700" />
                <span>{language === 'hi' ? 'संबंधित फसल चुनें' : 'Link to Standing Crop'}</span>
              </label>
              <select
                value={selectedCropId || ''}
                onChange={(e) => setSelectedCropId(e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-krishi-200 text-xs bg-white text-gray-800 font-medium"
              >
                <option value="">{language === 'hi' ? 'सामान्य कृषि सलाह' : 'General Advisory'}</option>
                {crops.map((c) => (
                  <option key={c.id} value={c.id}>{c.crop_name} ({c.farm_name || 'Farm'})</option>
                ))}
              </select>
            </div>
          )}

          {/* Conversation List */}
          <div className="space-y-1.5 overflow-y-auto max-h-[48vh] pr-1">
            {conversations.map((conv) => {
              const active = activeConvId === conv.id;
              return (
                <button
                  key={conv.id}
                  onClick={() => {
                    setActiveConvId(conv.id);
                    loadMessages(conv.id);
                  }}
                  className={`w-full text-left p-3 rounded-2xl transition-all flex items-center space-x-2.5 ${
                    active
                      ? 'bg-krishi-800 text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <MessageSquare className={`w-4 h-4 shrink-0 ${active ? 'text-krishi-300' : 'text-gray-400'}`} />
                  <div className="flex-1 truncate">
                    <p className="text-xs font-semibold truncate">{conv.title}</p>
                    <p className={`text-[10px] ${active ? 'text-krishi-200' : 'text-gray-400'}`}>
                      {new Date(conv.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Source citation commitment banner */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center space-x-2 text-[11px] text-gray-500">
          <ShieldCheck className="w-4 h-4 text-krishi-700 shrink-0" />
          <span>
            {language === 'hi' ? 'ICAR व KVK द्वारा प्रमाणित वैज्ञानिक ज्ञान' : 'Source-grounded via ICAR & KVK guidance'}
          </span>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 bg-white rounded-3xl border border-gray-200 shadow-sm flex flex-col justify-between overflow-hidden">
        
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-500">
              <div className="w-16 h-16 rounded-3xl bg-krishi-50 border border-krishi-200 flex items-center justify-center text-krishi-700 mb-4 shadow-inner">
                <Bot className="w-8 h-8 text-krishi-600" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">
                {loc.welcome_title}
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mb-6 leading-relaxed">
                {loc.welcome_desc}
              </p>

              {/* Sample Starters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full text-left">
                <button
                  onClick={() => handleSendMessage(loc.starter_1)}
                  className="p-3 text-xs font-semibold rounded-xl border border-gray-200 hover:border-krishi-400 bg-gray-50 hover:bg-krishi-50 transition-colors text-gray-800"
                >
                  🌾 {loc.starter_1}
                </button>
                <button
                  onClick={() => handleSendMessage(loc.starter_2)}
                  className="p-3 text-xs font-semibold rounded-xl border border-gray-200 hover:border-krishi-400 bg-gray-50 hover:bg-krishi-50 transition-colors text-gray-800"
                >
                  🌾 {loc.starter_2}
                </button>
                <button
                  onClick={() => handleSendMessage(loc.starter_3)}
                  className="p-3 text-xs font-semibold rounded-xl border border-gray-200 hover:border-krishi-400 bg-gray-50 hover:bg-krishi-50 transition-colors text-gray-800 sm:col-span-2"
                >
                  💬 {loc.starter_3}
                </button>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-3xl p-4 shadow-sm text-sm ${
                      isUser
                        ? 'bg-krishi-800 text-white rounded-br-none'
                        : 'bg-earth-50/70 border border-earth-200/80 text-gray-900 rounded-bl-none'
                    }`}
                  >
                    {/* Message Content */}
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </div>

                    {/* Verified Sources Accordion */}
                    {msg.sources_used && msg.sources_used.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-earth-200/80 text-xs">
                        <div className="flex items-center space-x-1.5 text-krishi-800 font-bold mb-1.5">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>{t.view_sources}</span>
                        </div>
                        <div className="space-y-1">
                          {msg.sources_used.map((source, sIdx) => (
                            <div
                              key={sIdx}
                              className="p-2 rounded-xl bg-white/80 border border-gray-200 text-[11px] text-gray-700 flex items-center justify-between"
                            >
                              <span>
                                🏛️ <strong>{source.institution}</strong> {source.year ? `(${source.year})` : ''}
                              </span>
                              {source.source_url && (
                                <a
                                  href={source.source_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-krishi-700 hover:text-krishi-900 inline-flex items-center ml-2"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action buttons on assistant message */}
                    {!isUser && (
                      <div className="mt-3 flex items-center space-x-2">
                        {/* Audio playback with Gnani Timbre */}
                        <AudioPlayerButton text={msg.content} language={msg.language} />
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] text-gray-400 px-1">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })
          )}

          {sending && (
            <div className="flex items-center space-x-2 text-xs text-krishi-800 p-3 bg-krishi-50 rounded-2xl w-fit animate-pulse">
              <Bot className="w-4 h-4 animate-spin" />
              <span>{loc.analyzing}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-gray-50 border-t border-gray-200 flex items-center space-x-2">
          
          {/* Voice Mic Trigger */}
          <button
            onClick={() => setVoiceModalOpen(true)}
            className="p-3 rounded-2xl bg-harvest hover:bg-harvest-dark text-white shadow-md transition-all transform active:scale-95 shrink-0"
            title={t.quick_voice_action}
          >
            <Mic className="w-5 h-5 animate-pulse" />
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputContent}
            onChange={(e) => setInputContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            placeholder={loc.placeholder}
            className="flex-1 px-4 py-3 rounded-2xl border border-gray-300 text-sm focus:ring-2 focus:ring-krishi-600 outline-none bg-white"
          />

          {/* Send Button */}
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputContent.trim() || sending}
            className="p-3 rounded-2xl bg-krishi-700 hover:bg-krishi-800 text-white disabled:opacity-50 transition-colors shrink-0 shadow-sm"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

      </div>

      {/* Voice Recorder Modal */}
      <VoiceRecorderModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        onTranscriptComplete={(transcript) => handleSendMessage(transcript)}
      />
    </div>
  );
};
