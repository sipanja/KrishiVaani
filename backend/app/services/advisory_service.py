import os
import re
import json
import logging
from ..models import db, AgriculturalKnowledge, CropIssue, CropCycle, FarmerProfile

logger = logging.getLogger(__name__)

# Multilingual synonyms mapping Indian vernacular terms to canonical knowledge keywords
VERNACULAR_KEYWORD_MAP = {
    # Bengali (বাংলা)
    'ধান': 'paddy rice',
    'গম': 'wheat',
    'আলু': 'potato',
    'তুলা': 'cotton',
    'কার্পাস': 'cotton',
    'সরিষা': 'mustard',
    'ভুট্টা': 'maize',
    'ব্লাস্ট': 'blast pyricularia',
    'বাদামি': 'brown',
    'দাগ': 'spot lesion',
    'ঝলসা': 'blight xanthomonas',
    'মরিচা': 'rust puccinia',
    'রতুয়া': 'rust',
    'লেট ব্লাইট': 'late blight',
    'পোকা': 'pest insect bollworm',
    'শুঁয়োপোকা': 'caterpillar worm',
    'পাতা': 'leaf leaves',
    'হলুদ': 'yellow',
    'শুকিয়ে': 'drying wilting',

    # Hindi (हिंदी)
    'धान': 'paddy rice',
    'चावल': 'paddy rice',
    'गेहूं': 'wheat',
    'कपास': 'cotton',
    'आलू': 'potato',
    'सरसों': 'mustard',
    'मक्का': 'maize',
    'चना': 'gram chickpea',
    'ब्लास्ट': 'blast',
    'भूरा': 'brown',
    'धब्बा': 'spot lesion',
    'झुलसा': 'blight',
    'रतुआ': 'rust',
    'सुंडी': 'worm caterpillar bollworm',
    'कीड़ा': 'pest insect',
    'इल्ली': 'caterpillar',
    'पीला': 'yellow',
    'फफूंद': 'fungus fungal',

    # Telugu (తెలుగు)
    'వరి': 'paddy rice',
    'గోధుమ': 'wheat',
    'పత్తి': 'cotton',
    'బంగాళాదుంప': 'potato',
    'ఆవాలు': 'mustard',
    'మొక్కజొన్న': 'maize',
    'అగ్గి': 'blast',
    'మచ్చలు': 'spots',
    'తెగులు': 'disease blight',
    'పురుగులు': 'insects pests worms',
    'పసుపు': 'yellow',

    # Tamil (தமிழ்)
    'நெல்': 'paddy rice',
    'கோதுமை': 'wheat',
    'பருத்தி': 'cotton',
    'உருளைக்கிழங்கு': 'potato',
    'கடுகு': 'mustard',
    'மக்காச்சோளம்': 'maize',
    'குலை': 'blast',
    'கருகல்': 'blight',
    'புள்ளிகள்': 'spots',
    'பூச்சி': 'pests insects',
    'மஞ்சள்': 'yellow',

    # Marathi (मराठी)
    'भात': 'paddy rice',
    'गहू': 'wheat',
    'कापूस': 'cotton',
    'बटाटा': 'potato',
    'मोहरी': 'mustard',
    'मका': 'maize',
    'सोयाबीन': 'soybean',
    'करपा': 'blight',
    'तांबेरा': 'rust',
    'बोंडअळी': 'bollworm',
    'अळी': 'caterpillar',
    'पिवळे': 'yellow',

    # Gujarati (ગુજરાતી)
    'ડાંગર': 'paddy rice',
    'ઘઉં': 'wheat',
    'કપાસ': 'cotton',
    'બટાકા': 'potato',
    'રાઈ': 'mustard',
    'મકાઈ': 'maize',
    'ગેરુ': 'rust',
    'કરપો': 'blight',
    'જીવાત': 'pests',
    'ઈયળ': 'caterpillar',

    # Punjabi (ਪੰਜਾਬੀ)
    'ਝੋਨਾ': 'paddy rice',
    'ਕਣਕ': 'wheat',
    'ਨਰਮਾ': 'cotton',
    'ਕਪਾਹ': 'cotton',
    'ਆਲੂ': 'potato',
    'ਸਰ੍ਹੋਂ': 'mustard',
    'ਮੱਕੀ': 'maize',
    'ਪੀਲੀ ਕੁੰਗੀ': 'yellow rust',
    'ਝੁਲਸਾ': 'blight',
    'ਸੁੰਡੀ': 'caterpillar',
    'ਤੇਲਾ': 'aphid',

    # Kannada (ಕನ್ನಡ)
    'ಭತ್ತ': 'paddy rice',
    'ಗೋಧಿ': 'wheat',
    'ಹತ್ತಿ': 'cotton',
    'ಆಲೂಗಡ್ಡೆ': 'potato',
    'ಸಾಸಿವೆ': 'mustard',
    'ಜೋಳ': 'maize',
    'ಬೆಂಕಿ': 'blast',
    'ಚುಕ್ಕೆ': 'spot',
    'ಕೀಟ': 'pests'
}

GREETING_PATTERNS = [
    # Bengali
    r'হাই\b|হ্যালো\b|কেমন আছেন|কেমন আছো|নমস্কার|শুভ সকাল|শুভ সন্ধ্যা|হাই হাউ আর ইউ|আদাব|প্রণাম',
    # Hindi
    r'नमस्ते|नमस्कार|हेलो|हाय\b|कैसे हो|कैसा है|प्रणाम|सुप्रभात|शुभ संध्या',
    # English
    r'\b(hi|hello|hey|how are you|how r u|good morning|good afternoon|good evening|who are you)\b',
    # Telugu
    r'నమస్కారం|నమస్తే|హలో|ఎలా ఉన్నారు',
    # Tamil
    r'வணக்கம்|ஹலோ|எப்படி இருக்கிறீர்கள்',
    # Marathi
    r'नमस्कार|हॅलो|कसे आहात|शुभ सकाळ',
    # Gujarati
    r'નમસ્તે|નમસ્કાર|કેમ છો|હેલો',
    # Punjabi
    r'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ|ਕਿਵੇਂ ਹੋ|ਹੈਲੋ',
    # Kannada
    r'ನಮಸ್ಕಾರ|ಹೇಗಿದ್ದೀರಾ|ಹಲೋ'
]

DIAGNOSTIC_GUIDE_PATTERNS = [
    # Bengali
    r'জানি না.*কী হয়েছে|ফসলের সাথে কী হয়েছে|কী হয়েছে বলে দিতে পারবে|সাহায্য.*পারবে|কী সমস্যা বুঝতে পারছি না|ফসলে কী রোগ|রোগ নির্ণয়|ফসল নষ্ট হচ্ছে',
    # Hindi
    r'समझ नहीं आ रहा.*क्या हुआ|फसल को क्या हुआ|क्या आप बता सकते|फसल खराब हो रही|मदद कर सकते|रोग पहचान|बीमारी क्या है',
    # English
    r'don(\'t|t)? know what happened|what happened to my crop|can you tell me|what is wrong with my crop|help me diagnose|crop is dying|crop is sick|identify disease',
    # Telugu
    r'నా పంటకు ఏమైందో|ఏమైందో చెప్పగలరా|సహాయం చేయండి|పంట పాడవుతోంది',
    # Tamil
    r'என் பயிருக்கு என்ன ஆச்சு|என்ன ஆச்சுன்னு தெரியல|உதவ முடியுமா|பயிர் பாழாகிறது',
    # Marathi
    r'पिकाला काय झाले|समजत नाही काय झाले|मदत करू शकता का|पीक खराब होत आहे',
    # Gujarati
    r'પાકને શું થયું|ખબર નથી શું થયું|મદદ કરી શકો|પાક બગડી રહ્યો છે',
    # Punjabi
    r'ਫ਼ਸਲ ਨੂੰ ਕੀ ਹੋਇਆ|ਨਹੀਂ ਪਤਾ ਕੀ ਹੋਇਆ|ਮਦਦ ਕਰ ਸਕਦੇ ਹੋ|ਫ਼ਸਲ ਖ਼ਰਾਬ ਹੋ ਰਹੀ',
    # Kannada
    r'ಬೆಳೆಗೆ ಏನಾಗಿದೆ|ತಿಳಿದಿಲ್ಲ ಏನಾಗಿದೆ|ಸಹಾಯ ಮಾಡಬಹುದೇ|ಬೆಳೆ ಹಾಳಾಗುತ್ತಿದೆ'
]

GREETING_RESPONSES = {
    'bn': "নমস্কার! আমি কৃষিবাণী এআই সহকারী। আমি ভালো আছি, ধন্যবাদ। আপনার চাষাবাদ, ফসল বা আবহাওয়া সম্পর্কিত যেকোনো তথ্যে আমি সাহায্য করতে প্রস্তুত। আপনার ফসলে কী সমস্যা হচ্ছে বা কী জানতে চান বলুন।",
    'hi': "नमस्ते! मैं कृषिवाणी एआई सहायक हूँ। मैं अच्छा हूँ, धन्यवाद। मैं आपकी खेती, फसल या मौसम संबंधी किसी भी प्रश्न में सहायता के लिए तैयार हूँ। आप अपनी फसल की समस्या या जानकारी साझा करें।",
    'te': "నమస్కారం! నేను కృషివాణి ఏఐ సహాయకుడిని. నేను బాగున్నాను, ధన్యవాదాలు. మీ వ్యవసాయం, పంట లేదా వాతావరణం గురించి ఏ సమాచారమైనా అందించడానికి సిద్ధంగా ఉన్నాను. మీ సమస్యను చెప్పండి.",
    'ta': "வணக்கம்! நான் கிருஷிவாணி ஏஐ உதவியாளர். நான் நலம், நன்றி. உங்கள் விவசாயம், பயிர் அல்லது வானிலை குறித்த கேள்விகளுக்கு உதவ தயாராக உள்ளேன். உங்கள் தேவையை கூறுங்கள்.",
    'mr': "नमस्कार! मी कृषीवाणी एआय सहाय्यक आहे. मी ठीक आहे, धन्यवाद. आपल्या शेती, पीक किंवा हवामानाविषयी मदत करण्यासाठी मी तयार आहे. आपली समस्या किंवा प्रश्न सांगा.",
    'gu': "નમસ્તે! હું કૃષિવાણી એઆઈ સહાયક છું. હું મજામાં છું, આભાર. તમારી ખેતી, પાક કે હવામાન સંબંધિત કોઈપણ પ્રશ્નમાં મદદ કરવા તૈયાર છું. આપની સમસ્યા જણાવો.",
    'pa': "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਕ੍ਰਿਸ਼ੀਵਾਣੀ ਏਆਈ ਸਹਾਇਕ ਹਾਂ। ਮੈਂ ਠੀਕ ਹਾਂ, ਧੰਨਵਾਦ। ਤੁਹਾਡੀ ਖੇਤੀ, ਫ਼ਸਲ ਜਾਂ ਮੌਸਮ ਸੰਬੰਧੀ ਕਿਸੇ ਵੀ ਸਵਾਲ ਵਿੱਚ ਮਦਦ ਕਰਨ ਲਈ ਤਿਆਰ ਹਾਂ। ਆਪਣੀ ਸਮੱਸਿਆ ਦੱਸੋ।",
    'kn': "ನಮಸ್ಕಾರ! ನಾನು ಕೃಷಿವಾಣಿ ಎಐ ಸಹಾಯಕ. ನಾನು ಚೆನ್ನಾಗಿದ್ದೇನೆ, ಧನ್ಯವಾದಗಳು. ನಿಮ್ಮ ಕೃಷಿ, ಬೆಳೆ ಅಥವಾ ಹವಾಮಾನಕ್ಕೆ ಸಂಬಂಧಿಸಿದ ಪ್ರಶ್ನೆಗಳಿಗೆ ಉತ್ತರಿಸಲು ಸಿದ್ಧನಿದ್ದೇನೆ. ನಿಮ್ಮ ಸಮಸ್ಯೆಯನ್ನು ತಿಳಿಸಿ.",
    'en': "Hello! I am your KrishiVaani AI assistant. I am doing well, thank you. I am here to help you with your crops, weather advisories, and sustainable farming guidance. How can I assist you today?"
}

DIAGNOSTIC_GUIDE_RESPONSES = {
    'bn': (
        "অবশ্যই! আপনার ফসলের সমস্যাটি সঠিকভাবে শনাক্ত করতে আমি সম্পূর্ণ সাহায্য করব। নির্ভুল কৃষি পরামর্শ পেতে দয়া করে নিচের তথ্যগুলি জানান:\n\n"
        "১. **ফসলের নাম:** আপনার ফসলটি কী (যেমন: ধান, গম, আলু, ভুট্টা, পাট বা সরিষা)?\n"
        "২. **লক্ষণ:** পাতায় বা গাছে কী দেখতে পাচ্ছেন (যেমন: হলুদ ছোপ, বাদামি দাগ, পাতা শুকিয়ে যাওয়া, বা কুঁচকে যাওয়া)?\n"
        "৩. **পোকা-মাকড়:** কোনো শুঁয়োপোকা, সাদা মাছি বা অন্য পোকা দেখা যাচ্ছে কি?\n\n"
        "💡 *পরামর্শ: আপনি 'সমস্যা রিপোর্ট করুন' মেনুতে গিয়ে আক্রান্ত পাতার একটি স্পষ্ট ছবিও আপলোড করতে পারেন।*"
    ),
    'hi': (
        "निश्चय ही! मैं आपकी फसल की समस्या पहचानने में पूरी सहायता करूँगा। सटीक एवं सुरक्षित सलाह के लिए कृपया निम्नलिखित जानकारी दें:\n\n"
        "१. **फसल का नाम:** आपकी कौन सी फसल है (जैसे: धान, गेहूं, मक्का, कपास, सरसों या आलू)?\n"
        "२. **दिखाई देने वाले लक्षण:** पत्तियों या तने पर क्या दिख रहा है (जैसे: पीलापन, भूरे/काले धब्बे, झुलसा या सूखना)?\n"
        "३. **कीट या बीमारी:** क्या कोई इल्ली, सूंडी या कीड़ा नजर आ रहा है?\n\n"
        "💡 *सुझाव: आप 'फसल समस्या रिपोर्ट' में जाकर प्रभावित पौधे की एक स्पष्ट फोटो भी अपलोड कर सकते हैं।*"
    ),
    'te': (
        "ఖచ్చితంగా! మీ పంట సమస్యను గుర్తించడంలో నేను సహాయం చేస్తాను. సరైన పరిష్కారం కోసం దయచేసి ఈ వివరాలను తెలపండి:\n\n"
        "1. **పంట పేరు:** మీ పంట ఏది (వరి, పత్తి, మొక్కజొన్న, మిరప, లేదా వేరుశనగ)?\n"
        "2. **లక్షణాలు:** ఆకులు లేదా కాండంపై ఏమి కనిపిస్తోంది (పసుపు రంగు, మచ్చలు, ఎండిపోవడం)?\n"
        "3. **పురుగులు:** ఏవైనా తెగుళ్లు లేదా పురుగులు కనిపిస్తున్నాయా?\n\n"
        "💡 *మీరు 'సమస్యను నివేదించండి' విభాగంలో ఫోటో కూడా అప్‌లోడ్ చేయవచ్చు.*"
    ),
    'ta': (
        "நிச்சயமாக! உங்கள் பயிர் பிரச்சனையை கண்டறிய நான் உதவுகிறேன். துல்லியமான ஆலோசனைக்கு இந்த தகவல்களை கூறவும்:\n\n"
        "1. **பயிர் பெயர்:** உங்கள் பயிர் என்ன (நெல், பருத்தி, சோளம், தக்காளி, அல்லது கரும்பு)?\n"
        "2. **அறிகுறிகள்:** இலைகளில் என்ன தெரிகிறது (மஞ்சள் நிறம், கருகல், புள்ளிகள் அல்லது சுருங்குதல்)?\n"
        "3. **பூச்சிகள்:** ஏதேனும் பூச்சிகள் அல்லது புழுக்கள் தென்படுகின்றனவா?\n\n"
        "💡 *பாதிக்கப்பட்ட இலையின் புகைப்படத்தை நீங்கள் பதிவேற்றலாம்.*"
    ),
    'mr': (
        "नक्कीच! आपल्या पिकाची समस्या ओळखण्यासाठी मी नक्कीच मदत करेन. अचूक सल्ल्यासाठी कृपया खालील माहिती द्या:\n\n"
        "१. **पिकाचे नाव:** आपले पीक कोणते आहे (उदा. भात/धान, कापूस, सोयाबीन, गहू, किंवा बटाटा)?\n"
        "२. **लक्षणे:** पानांवर किंवा खोडावर काय दिसत आहे (पिवळे पडणे, करपा, काळे/तपकिरी डाग)?\n"
        "३. **कीड किंवा अळी:** शेतात कोणती कीड किंवा अळी दिसत आहे का?\n\n"
        "💡 *आपण 'समस्या नोंदवा' मध्ये जाऊन बाधित पानाचा फोटोही अपलोड करू शकता.*"
    ),
    'gu': (
        "ચોક્કસ! તમારા પાકની સમસ્યા ઓળખવામાં હું પૂરી મદદ કરીશ. સચોટ માર્ગદર્શન માટે કૃપા કરીને નીચેની માહિતી આપો:\n\n"
        "૧. **પાકનું નામ:** તમારો પાક કયો છે (ડાંગર, કપાસ, ઘઉં, મગફળી કે જીરું)?\n"
        "૨. **લક્ષણો:** પાંદડા કે છોડ પર શું દેખાય છે (પીળાશ, સુકાઈ જવું, કરપો કે ડાઘા)?\n"
        "૩. **જીવાત:** કોઈ ઈયળ કે જીવાત જોવા મળે છે?\n\n"
        "💡 *તમે 'સમસ્યા નોંધાવો' વિકલ્પમાંથી ફોટો પણ અપલોડ કરી શકો છો.*"
    ),
    'pa': (
        "ਜ਼ਰੂਰ! ਤੁਹਾਡੀ ਫ਼ਸਲ ਦੀ ਸਮੱਸਿਆ ਪਛਾਣਨ ਵਿੱਚ ਮੈਂ ਪੂਰੀ ਮਦਦ ਕਰਾਂਗਾ। ਸਹੀ ਸਲਾਹ ਲਈ ਕਿਰਪਾ ਕਰਕੇ ਹੇਠ ਲਿਖੀ ਜਾਣਕਾਰੀ ਦਿਓ:\n\n"
        "੧. **ਫ਼ਸਲ ਦਾ ਨਾਂ:** ਤੁਹਾਡੀ ਕਿਹੜੀ ਫ਼ਸਲ ਹੈ (ਝੋਨਾ, ਕਣਕ, ਨਰਮਾ, ਸਰ੍ਹੋਂ ਜਾਂ ਮੱਕੀ)?\n"
        "੨. **ਲੱਛਣ:** ਪੱਤਿਆਂ ਜਾਂ ਤਣੇ 'ਤੇ ਕੀ ਦਿਸ ਰਿਹਾ ਹੈ (ਪੀਲਾਪਣ, ਭੂਰੇ ਧੱਬੇ, ਝੁਲਸਾ ਜਾਂ ਸੁੱਕਣਾ)?\n"
        "੩. **ਕੀੜੇ ਜਾਂ ਸੁੰਡੀ:** ਕੀ ਕੋਈ ਸੁੰਡੀ ਜਾਂ ਕੀੜਾ ਨਜ਼ਰ ਆ ਰਿਹਾ ਹੈ?\n\n"
        "💡 *ਤੁਸੀਂ ਪ੍ਰਭਾਵਿਤ ਪੱਤੇ ਦੀ ਫ਼ੋਟੋ ਵੀ ਅੱਪਲੋਡ ਕਰ ਸਕਦੇ ਹੋ।*"
    ),
    'kn': (
        "ಖಂಡಿತವಾಗಿಯೂ! ನಿಮ್ಮ ಬೆಳೆಯ ಸಮಸ್ಯೆಯನ್ನು ಗುರುತಿಸಲು ನಾನು ಸಂಪೂರ್ಣ ಸಹಾಯ ಮಾಡುತ್ತೇನೆ. ನಿಖರವಾದ ಸಲಹೆಗಾಗಿ ಈ ವಿವರಗಳನ್ನು ನೀಡಿ:\n\n"
        "1. **ಬೆಳೆಯ ಹೆಸರು:** ನಿಮ್ಮ ಬೆಳೆ ಯಾವುದು (ಭತ್ತ, ಹತ್ತಿ, ಜೋಳ, ತೊಗರಿ, ಅಥವಾ ಆಲೂಗಡ್ಡೆ)?\n"
        "2. **ರೋಗ ಲಕ್ಷಣಗಳು:** ಎಲೆ ಅಥವಾ ಕಾಂಡದ ಮೇಲೆ ಏನು ಕಾಣಿಸುತ್ತಿದೆ (ಹಳದಿ ಬಣ್ಣ, ಕಂದು ಕಲೆಗಳು, ಒಣಗುವಿಕೆ)?\n"
        "3. **ಕೀಟಗಳು:** ಯಾವುದೇ ಹುಳು ಅಥವಾ ಕೀಟಗಳು ಕಾಣಿಸುತ್ತಿವೆಯೇ?\n\n"
        "💡 *ನೀವು ಬಾಧಿತ ಗಿಡದ ಫೋಟೋವನ್ನು ಸಹ ಅಪ್‌ಲೋಡ್ ಮಾಡಬಹುದು.*"
    ),
    'en': (
        "Certainly! I am here to help you identify and manage your crop problem safely. To provide accurate guidance, please let me know:\n\n"
        "1. **Crop Name:** Which crop are you growing (e.g., Paddy/Rice, Wheat, Cotton, Maize, Potato, or Mustard)?\n"
        "2. **Symptoms:** What signs do you observe on the leaves or stems (e.g., yellowing, brown spots, wilting, or lesions)?\n"
        "3. **Pests / Insects:** Do you see any visible caterpillars, aphids, or webbing?\n\n"
        "💡 *Tip: You can also upload a close-up photo of the affected leaf under 'Report Issue' for visual review.*"
    )
}

UNMATCHED_FALLBACK_TEMPLATES = {
    'bn': "কৃষিবাণী পরামর্শ: আপনার উল্লেখিত প্রশ্ন ('{query}') সম্পর্কিত কোনো সরাসরি আইসিএআর (ICAR) অনুমোদিত রেকর্ড আমাদের ডাটাবেসে পাওয়া যায়নি। ফসলের সুরক্ষা নিশ্চিত করতে এবং ভুল ওষুধের প্রয়োগ রুখতে আমরা মনগড়া তথ্য প্রদান করি না। অনুগ্রহ করে আপনার নির্দিষ্ট ফসলের নাম ও লক্ষণ স্পষ্টভাবে জানান, অথবা নিকটস্থ কৃষি বিজ্ঞান কেন্দ্রের (KVK) সাথে যোগাযোগ করুন।",
    'hi': "कृषिवाणी सलाह: आपके प्रश्न ('{query}') के संबंध में हमारे पास प्रमाणित ICAR संदर्भ उपलब्ध नहीं है। फसल की सुरक्षा एवं गलत दवा से बचाव के लिए हम मनगढ़ंत सलाह नहीं देते। कृपया अपनी फसल का नाम और विशिष्ट लक्षण बताएं या नजदीकी कृषि विज्ञान केंद्र (KVK) से संपर्क करें।",
    'te': "కృషివాణి సలహా: మీ ప్రశ్న ('{query}') కు సంబంధించి ధృవీకరించబడిన ICAR రికార్డులు అందుబాటులో లేవు. పంట నష్టాన్ని నివారించడానికి మేము నిర్ధారించని సమాచారాన్ని అందించము. దయచేసి మీ పంట పేరు మరియు లక్షణాలను తెలపండి లేదా సమీపంలోని కృషి విజ్ఞాన కేంద్రాన్ని (KVK) సంప్రదించండి.",
    'ta': "கிருஷிவாணி ஆலோசனை: உங்கள் கேள்வி ('{query}') குறித்த சான்றளிக்கப்பட்ட ICAR பதிவுகள் எங்களிடம் இல்லை. பயிர் சேதத்தைத் தடுக்க உறுதிப்படுத்தப்படாத தகவலை நாங்கள் வழங்குவதில்லை. தயவுசெய்து உங்கள் பயிர் பெயர் மற்றும் அறிகுறிகளைக் குறிப்பிடவும் அல்லது அருகிலுள்ள கேவிகே (KVK) மையத்தை அணுகவும்.",
    'mr': "कृषीवाणी सल्ला: आपल्या प्रश्नाबाबत ('{query}') आमच्याकडे प्रमाणित ICAR संदर्भ उपलब्ध नाही. पिकाचे नुकसान टाळण्यासाठी आम्ही अप्रमाणित माहिती देत नाही. कृपया आपल्या पिकाचे नाव आणि लक्षणे स्पष्ट सांगा किंवा जवळच्या कृषी विज्ञान केंद्राशी (KVK) संपर्क साधा.",
    'gu': "કૃષિવાણી સલાહ: તમારા પ્રશ્ન ('{query}') અંગે પ્રમાણિત ICAR રેકોર્ડ ઉપલબ્ધ નથી. પાકના રક્ષણ માટે અમે અપ્રમાણિત માહિતી આપતા નથી. કૃપા કરીને તમારા પાકનું નામ અને ચોક્કસ લક્ષણો જણાવો અથવા નજીકના કૃષિ વિજ્ઞાન કેન્દ્ર (KVK) નો સંપર્ક કરો.",
    'pa': "ਕ੍ਰਿਸ਼ੀਵਾਣੀ ਸਲਾਹ: ਤੁਹਾਡੇ ਸਵਾਲ ('{query}') ਸੰਬੰਧੀ ਪ੍ਰਮਾਣਿਤ ICAR ਰਿਕਾਰਡ ਉਪਲਬਧ ਨਹੀਂ ਹਨ। ਫ਼ਸਲ ਦੇ ਨੁਕਸਾਨ ਤੋਂ ਬਚਣ ਲਈ ਅਸੀਂ ਗੈਰ-ਪ੍ਰਮਾਣਿਤ ਸਲਾਹ ਨਹੀਂ ਦਿੰਦੇ। ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੀ ਫ਼ਸਲ ਦਾ ਨਾਂ ਅਤੇ ਲੱਛਣ ਦੱਸੋ ਜਾਂ ਨਜ਼ਦੀਕੀ ਕ੍ਰਿਸ਼ੀ ਵਿਗਿਆਨ ਕੇਂਦਰ (KVK) ਨਾਲ ਸੰਪਰਕ ਕਰੋ।",
    'kn': "ಕೃಷಿವಾಣಿ ಸಲಹೆ: ನಿಮ್ಮ ಪ್ರಶ್ನೆಗೆ ('{query}') ಸಂಬಂಧಿಸಿದಂತೆ ದೃಢೀಕರಿಸಿದ ICAR ದಾಖಲೆಗಳು ಲಭ್ಯವಿಲ್ಲ. ಬೆಳೆ ಹಾನಿಯನ್ನು ತಡೆಗಟ್ಟಲು ನಾವು ಪರಿಶೀಲಿಸದ ಮಾಹಿತಿಯನ್ನು ನೀಡುವುದಿಲ್ಲ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಬೆಳೆಯ ಹೆಸರು ಮತ್ತು ರೋಗ ಲಕ್ಷಣಗಳನ್ನು ತಿಳಿಸಿ ಅಥವಾ ಸಮೀಪದ ಕೃಷಿ ವಿಜ್ಞಾನ ಕೇಂದ್ರವನ್ನು (KVK) ಸಂಪರ್ಕಿಸಿ.",
    'en': "KrishiVaani Advisory: We do not have verified agricultural records directly answering '{query}'. To prevent crop damage, we do not fabricate unverified guidance. Please specify your crop name and symptoms, or consult your nearest Krishi Vigyan Kendra (KVK)."
}

CLARIFYING_QUESTIONS = {
    'bn': [
        "এই লক্ষণগুলি কি অন্যান্য গাছেও দ্রুত ছড়িয়ে পড়ছে?",
        "আপনি কি সম্প্রতি ইউরিয়া বা নাইট্রোজেন সার বেশি প্রয়োগ করেছেন?",
        "আপনি কি আক্রান্ত পাতার একটি পরিষ্কার ছবি শেয়ার করতে পারেন?"
    ],
    'hi': [
        "क्या यह धब्बे या लक्षण खेत के अन्य पौधों में भी फैल रहे हैं?",
        "क्या आपने हाल ही में कोई यूरिया या उर्वरक अधिक डाला था?",
        "क्या आप पत्ती की एक स्पष्ट तस्वीर साझा कर सकते हैं?"
    ],
    'te': [
        "ఈ లక్షణాలు పొలంలోని ఇతర మొక్కలకు వ్యాపిస్తున్నాయా?",
        "మీరు ఇటీవల యూరియా ఎరువులు ఎక్కువగా వేశారా?",
        "బాధిత ఆకు యొక్క స్పష్టమైన ఫోటోను పంచుకోగలరా?"
    ],
    'ta': [
        "இந்த அறிகுறிகள் மற்ற செடிகளுக்கும் பரவுகிறதா?",
        "சமீபத்தில் அதிக யூரியா உரம் பயன்படுத்தினீர்களா?",
        "பாதிக்கப்பட்ட இலையின் தெளிவான புகைப்படத்தைப் பகிர முடியுமா?"
    ],
    'mr': [
        "ही लक्षणे इतर वनस्पतींवरही पसरत आहेत का?",
        "नुकतेच युरियाचे प्रमाण जास्त दिले होते का?",
        "बाधित पानाचा स्पष्ट फोटो पाठवू शकता का?"
    ],
    'gu': [
        "આ લક્ષણો અન્ય છોડમાં પણ ફેલાઈ રહ્યા છે?",
        "હાલમાં વધારે યુરિયા કે ખાતર આપ્યું હતું?",
        "પાંદડાનો સ્પષ્ટ ફોટો શેર કરી શકો છો?"
    ],
    'pa': [
        "ਕੀ ਇਹ ਲੱਛਣ ਦੂਜੇ ਪੌਦਿਆਂ 'ਤੇ ਵੀ ਫ਼ੈਲ ਰਹੇ ਹਨ?",
        "ਕੀ ਹਾਲ ਹੀ ਵਿੱਚ ਯੂਰੀਆ ਜ਼ਿਆਦਾ ਪਾਈ ਸੀ?",
        "ਕੀ ਪ੍ਰਭਾਵਿਤ ਪੱਤੇ ਦੀ ਸਾਫ਼ ਫ਼ੋਟੋ ਦੇ ਸਕਦੇ ਹੋ?"
    ],
    'kn': [
        "ಈ ಲಕ್ಷಣಗಳು ಇತರ ಸಸ್ಯಗಳಿಗೂ ಹರಡುತ್ತಿವೆಯೇ?",
        "ಇತ್ತೀಚೆಗೆ ಯೂರಿಯಾ ಗೊಬ್ಬರವನ್ನು ಹೆಚ್ಚಾಗಿ ಬಳಸಿದ್ದೀರಾ?",
        "ಬಾಧಿತ ಎಲೆಯ ಸ್ಪಷ್ಟ ಫೋಟೋವನ್ನು ಹಂಚಿಕೊಳ್ಳಬಹುದೇ?"
    ],
    'en': [
        "Are the symptoms spreading to neighbouring plants or patches?",
        "Have you applied high doses of nitrogen/urea recently?",
        "Could you upload a clear close-up photograph of the affected leaf?"
    ]
}

def detect_language(text: str, default_lang: str = 'en') -> str:
    """
    Detects language from text script or falls back to user default.
    """
    if not text:
        return default_lang or 'hi'
    
    if re.search(r'[\u0980-\u09FF]', text):
        return 'bn'
    if re.search(r'[\u0C00-\u0C7F]', text):
        return 'te'
    if re.search(r'[\u0B80-\u0BFF]', text):
        return 'ta'
    if re.search(r'[\u0A80-\u0AFF]', text):
        return 'gu'
    if re.search(r'[\u0A00-\u0A7F]', text):
        return 'pa'
    if re.search(r'[\u0C80-\u0CFF]', text):
        return 'kn'
    if re.search(r'[\u0900-\u097F]', text):
        return 'mr' if default_lang == 'mr' else 'hi'
        
    return default_lang or 'en'


class AdvisoryService:
    def ensure_knowledge_base_seeded(self):
        """
        Ensures verified ICAR / State Agricultural University reference packages are loaded into the database.
        Does NOT insert fake farmers or demo user records.
        """
        count = AgriculturalKnowledge.query.count()
        if count == 0:
            json_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'knowledge_base.json')
            if os.path.exists(json_path):
                try:
                    with open(json_path, 'r', encoding='utf-8') as f:
                        records = json.load(f)
                        for item in records:
                            doc = AgriculturalKnowledge(
                                crop_name=item['crop_name'],
                                topic=item['topic'],
                                category=item.get('category', 'disease'),
                                symptoms=item['symptoms'],
                                favorable_conditions=item.get('favorable_conditions'),
                                cultural_control=item['cultural_control'],
                                biological_control=item.get('biological_control'),
                                chemical_guidelines_caution=item.get('chemical_guidelines_caution'),
                                source_institution=item['source_institution'],
                                source_url=item.get('source_url'),
                                publication_year=item.get('publication_year'),
                                verified=True
                            )
                            db.session.add(doc)
                    db.session.commit()
                    logger.info(f"Loaded {len(records)} verified agricultural knowledge entries.")
                except Exception as e:
                    db.session.rollback()
                    logger.error(f"Error seeding knowledge base: {str(e)}")

    def _expand_query_terms(self, query: str) -> list:
        """
        Tokenizes query and maps local vernacular terms to knowledge keywords.
        """
        tokens = query.lower().split()
        expanded = list(tokens)
        for term, canonical in VERNACULAR_KEYWORD_MAP.items():
            if term.lower() in query.lower():
                expanded.extend(canonical.split())
        return list(set(expanded))

    def search_knowledge(self, crop_name: str = None, query: str = '') -> list:
        """
        Searches verified agricultural knowledge by crop name and symptoms with multilingual expansion.
        """
        self.ensure_knowledge_base_seeded()
        query_terms = self._expand_query_terms(query)
        
        q = AgriculturalKnowledge.query
        if crop_name:
            # Map vernacular crop name to English
            mapped_crop = crop_name.split()[0]
            for term, canonical in VERNACULAR_KEYWORD_MAP.items():
                if term in crop_name:
                    mapped_crop = canonical.split()[0]
                    break
            q = q.filter(AgriculturalKnowledge.crop_name.ilike(f"%{mapped_crop}%"))
            
        all_docs = q.all()
        scored_results = []
        for doc in all_docs:
            score = 0
            text_corpus = f"{doc.crop_name} {doc.topic} {doc.symptoms} {doc.favorable_conditions or ''}".lower()
            for term in query_terms:
                if len(term) > 2 and term in text_corpus:
                    score += 1
            if score > 0 or not query_terms:
                scored_results.append((score, doc))
                
        scored_results.sort(key=lambda x: x[0], reverse=True)
        return [doc for score, doc in scored_results[:4]]

    def analyze_crop_problem(self, crop: CropCycle, symptoms: str, farmer_profile: FarmerProfile = None, language: str = None) -> dict:
        """
        Analyzes farmer-reported symptoms against verified knowledge,
        determines confidence level, generates clarifying questions if needed,
        and constructs evidence-grounded recommendations in the farmer's language.
        """
        self.ensure_knowledge_base_seeded()
        crop_name = crop.crop_name if crop else 'Paddy (Rice)'
        
        # Determine language
        profile_lang = farmer_profile.preferred_language if farmer_profile else 'hi'
        active_lang = language or detect_language(symptoms, profile_lang)
        if active_lang not in GREETING_RESPONSES:
            active_lang = 'hi' if active_lang == 'hi' else 'en'

        matches = self.search_knowledge(crop_name=crop_name, query=symptoms)

        clarifying = CLARIFYING_QUESTIONS.get(active_lang, CLARIFYING_QUESTIONS['en'])

        if not matches:
            fallback_text = UNMATCHED_FALLBACK_TEMPLATES.get(active_lang, UNMATCHED_FALLBACK_TEMPLATES['en']).format(query=symptoms)
            return {
                'diagnosis_estimate': f"Undetermined symptom on {crop_name}",
                'confidence': 'insufficient_data',
                'severity': 'moderate',
                'guidance_notes': fallback_text,
                'clarifying_questions': clarifying,
                'sources': [],
                'expert_referred': True,
                'expert_referral_reason': 'Symptoms do not match verified local diseases with sufficient certainty.'
            }

        primary = matches[0]
        query_words = self._expand_query_terms(symptoms)
        matched_words = sum(1 for word in query_words if len(word) > 2 and word in primary.symptoms.lower())
        confidence = 'probable' if matched_words >= 2 else 'preliminary'
        
        sources = [{
            'institution': primary.source_institution,
            'source_url': primary.source_url,
            'topic': primary.topic,
            'year': primary.publication_year
        }]

        # Multilingual advisory formatting
        if active_lang == 'bn':
            guidance = (
                f"**সম্ভাব্য রোগ নির্ণয়:** {primary.topic} ({crop_name})\n\n"
                f"**চিহ্ন ও লক্ষণ:**\n{primary.symptoms}\n\n"
                f"**প্রস্তাবিত সাংস্কৃতিক ও জৈব প্রতিকার (IPM):**\n"
                f"• {primary.cultural_control}\n"
                f"• {primary.biological_control or 'প্রমাণিত বায়ো-এজেন্ট ব্যবহার করুন।'}\n\n"
                f"**নিরাপত্তা ও রাসায়নিক সতর্কতা:**\n"
                f"• {primary.chemical_guidelines_caution}\n\n"
                f"*তথ্যসূত্র: {primary.source_institution} ({primary.publication_year or 'যাচাইকৃত'})*"
            )
        elif active_lang == 'hi':
            guidance = (
                f"**लक्षण विश्लेषण (संभावित):** {primary.topic}\n\n"
                f"**पहचान व लक्षण:**\n{primary.symptoms}\n\n"
                f"**सांस्कृतिक/जैविक उपाय (तुरंत करने योग्य):**\n"
                f"• {primary.cultural_control}\n"
                f"• {primary.biological_control or 'जैविक उपचार उपलब्ध होने पर ही अपनाएं।'}\n\n"
                f"**सावधानी एवं रासायनिक सलाह:**\n"
                f"• {primary.chemical_guidelines_caution}\n\n"
                f"*स्त्रोत: {primary.source_institution} ({primary.publication_year or 'प्रमाणित'})*"
            )
        elif active_lang == 'te':
            guidance = (
                f"**ప్రాథమిక నిర్ధారణ:** {primary.topic} ({crop_name})\n\n"
                f"**లక్షణాలు & గుర్తింపు:**\n{primary.symptoms}\n\n"
                f"**యాజమాన్య పద్ధతులు & సేంద్రీయ నియంత్రణ:**\n"
                f"• {primary.cultural_control}\n"
                f"• {primary.biological_control or 'సేంద్రీయ నియంత్రణ పద్ధతులు పాటించండి.'}\n\n"
                f"**రసాయన జాగ్రత్తలు:**\n"
                f"• {primary.chemical_guidelines_caution}\n\n"
                f"*మూలం: {primary.source_institution} ({primary.publication_year or 'ధృవీకరించబడింది'})*"
            )
        elif active_lang == 'ta':
            guidance = (
                f"**சாத்தியமான நோய் கண்டறிதல்:** {primary.topic} ({crop_name})\n\n"
                f"**அறிகுறிகள்:**\n{primary.symptoms}\n\n"
                f"**ஒருங்கிணைந்த பயிர் பாதுகாப்பு (IPM) & இயற்கை கட்டுப்பாடு:**\n"
                f"• {primary.cultural_control}\n"
                f"• {primary.biological_control or 'இயற்கை உயிர் பூச்சிக்கொல்லிகளைப் பயன்படுத்தவும்.'}\n\n"
                f"**பாதுகாப்பு வழிகாட்டுதல்கள்:**\n"
                f"• {primary.chemical_guidelines_caution}\n\n"
                f"*ஆதாரம்: {primary.source_institution} ({primary.publication_year or 'சான்றளிக்கப்பட்டது'})*"
            )
        elif active_lang == 'mr':
            guidance = (
                f"**संभाव्य रोगनिदान:** {primary.topic} ({crop_name})\n\n"
                f"**लक्षणे व ओळख:**\n{primary.symptoms}\n\n"
                f"**एकात्मिक कीड व्यवस्थापन (IPM) व जैविक उपाय:**\n"
                f"• {primary.cultural_control}\n"
                f"• {primary.biological_control or 'जैविक घटकांचा वापर करा.'}\n\n"
                f"**सुरक्षेची काळजी व रासायनिक सल्ला:**\n"
                f"• {primary.chemical_guidelines_caution}\n\n"
                f"*संदर्भ: {primary.source_institution} ({primary.publication_year or 'प्रमाणित'})*"
            )
        elif active_lang == 'gu':
            guidance = (
                f"**સંભવિત રોગનિદાન:** {primary.topic} ({crop_name})\n\n"
                f"**ઓળખ અને લક્ષણો:**\n{primary.symptoms}\n\n"
                f"**સંકલિત જીવાત નિયંત્રણ (IPM) અને જૈવિક ઉપાય:**\n"
                f"• {primary.cultural_control}\n"
                f"• {primary.biological_control or 'જૈવિક દવાઓનો ઉપયોગ કરો.'}\n\n"
                f"**સુરક્ષા સાવચેતી:**\n"
                f"• {primary.chemical_guidelines_caution}\n\n"
                f"*સ્ત્રોત: {primary.source_institution} ({primary.publication_year or 'પ્રમાણિત'})*"
            )
        elif active_lang == 'pa':
            guidance = (
                f"**ਸੰਭਾਵੀ ਬਿਮਾਰੀ ਦੀ ਪਛਾਣ:** {primary.topic} ({crop_name})\n\n"
                f"**ਲੱਛਣ ਅਤੇ ਪਛਾਣ:**\n{primary.symptoms}\n\n"
                f"**ਏਕੀਕ੍ਰਿਤ ਕੀਟ ਪ੍ਰਬੰਧਨ (IPM) ਅਤੇ ਜੈਵਿਕ ਕੰਟਰੋਲ:**\n"
                f"• {primary.cultural_control}\n"
                f"• {primary.biological_control or 'ਜੈਵਿਕ ਤਰੀਕੇ ਵਰਤੋ।'}\n\n"
                f"**ਸੁਰੱਖਿਆ ਸਾਵਧਾਨੀ:**\n"
                f"• {primary.chemical_guidelines_caution}\n\n"
                f"*ਸਰੋਤ: {primary.source_institution} ({primary.publication_year or 'ਪ੍ਰਮਾਣਿਤ'})*"
            )
        elif active_lang == 'kn':
            guidance = (
                f"**ಸಂಭಾವ್ಯ ರೋಗ ನಿರ್ಣಯ:** {primary.topic} ({crop_name})\n\n"
                f"**ರೋಗ ಲಕ್ಷಣಗಳು:**\n{primary.symptoms}\n\n"
                f"**ಸಮಗ್ರ ಕೀಟ ನಿರ್ವಹಣೆ (IPM) & ಜೈವಿಕ ನಿಯಂತ್ರಣ:**\n"
                f"• {primary.cultural_control}\n"
                f"• {primary.biological_control or 'ಜೈವಿಕ ನಿಯಂತ್ರಣ ಕ್ರಮಗಳನ್ನು ಅನುಸರಿಸಿ.'}\n\n"
                f"**ಸುರಕ್ಷತಾ ಮುನ್ನೆಚ್ಚರಿಕೆ:**\n"
                f"• {primary.chemical_guidelines_caution}\n\n"
                f"*ಮೂಲ: {primary.source_institution} ({primary.publication_year or 'ದೃಢೀಕರಿಸಲಾಗಿದೆ'})*"
            )
        else:
            guidance = (
                f"**Preliminary Diagnosis:** Suspected {primary.topic} on {crop_name}.\n\n"
                f"**Symptoms & Identification:**\n{primary.symptoms}\n\n"
                f"**Recommended Cultural & Bio-Controls:**\n"
                f"• {primary.cultural_control}\n"
                f"• {primary.biological_control or 'Use certified bio-agents where available.'}\n\n"
                f"**Management Precautions:**\n"
                f"• {primary.chemical_guidelines_caution}\n\n"
                f"*Source: {primary.source_institution} ({primary.publication_year or 'Verified'})*"
            )

        return {
            'diagnosis_estimate': f"Suspected {primary.topic}",
            'confidence': confidence,
            'severity': 'moderate',
            'guidance_notes': guidance,
            'clarifying_questions': clarifying,
            'sources': sources,
            'expert_referred': confidence == 'preliminary',
            'expert_referral_reason': 'Preliminary identification; confirm with local KVK before chemical treatment.' if confidence == 'preliminary' else None
        }

    def answer_query(self, user_query: str, farmer_profile: FarmerProfile = None, active_crop: CropCycle = None, language: str = None) -> dict:
        """
        Answers inquiries in the farmer's native language using intent recognition,
        conversational intelligence, and source-grounded RAG.
        """
        self.ensure_knowledge_base_seeded()
        clean_query = (user_query or '').strip()
        
        # 1. Determine active language
        profile_lang = farmer_profile.preferred_language if farmer_profile else None
        active_lang = language or detect_language(clean_query, profile_lang or 'hi')
        if active_lang not in GREETING_RESPONSES:
            active_lang = 'en'

        # 2. Check for Greetings / Pleasantries
        for pattern in GREETING_PATTERNS:
            if re.search(pattern, clean_query, re.IGNORECASE):
                return {
                    'answer': GREETING_RESPONSES.get(active_lang, GREETING_RESPONSES['en']),
                    'sources': [],
                    'suggested_actions': [
                        "ধানের ব্লাস্ট রোগ প্রতিকার" if active_lang == 'bn' else "धान में रोग प्रबंधन",
                        "मौसम की जानकारी" if active_lang == 'hi' else "Check Weather"
                    ]
                }

        # 3. Check for Diagnostic Guide Requests (e.g., "I don't know what happened to my crop, can you tell me?")
        for pattern in DIAGNOSTIC_GUIDE_PATTERNS:
            if re.search(pattern, clean_query, re.IGNORECASE):
                return {
                    'answer': DIAGNOSTIC_GUIDE_RESPONSES.get(active_lang, DIAGNOSTIC_GUIDE_RESPONSES['en']),
                    'sources': [],
                    'suggested_actions': [
                        "ফসলের সমস্যা রিপোর্ট করুন" if active_lang == 'bn' else "Report Crop Problem",
                        "আবহাওয়া পূর্বাভাস" if active_lang == 'bn' else "Check Weather Alerts"
                    ]
                }

        # 4. Search Knowledge Base with vernacular expansion
        crop_hint = active_crop.crop_name if active_crop else None
        matches = self.search_knowledge(crop_name=crop_hint, query=clean_query)

        if not matches:
            fallback_template = UNMATCHED_FALLBACK_TEMPLATES.get(active_lang, UNMATCHED_FALLBACK_TEMPLATES['en'])
            response_text = fallback_template.format(query=clean_query)
            return {
                'answer': response_text,
                'sources': [],
                'suggested_actions': [
                    "সমস্যা রিপোর্ট করুন" if active_lang == 'bn' else "Report Crop Issue",
                    "আবহাওয়া ঝুঁকি পরীক্ষা" if active_lang == 'bn' else "Check Weather Risk"
                ]
            }

        top_match = matches[0]
        sources = [{
            'institution': top_match.source_institution,
            'source_url': top_match.source_url,
            'topic': top_match.topic,
            'year': top_match.publication_year
        }]

        # Construct localized answer
        if active_lang == 'bn':
            answer_text = (
                f"**বিষয়:** {top_match.crop_name} — {top_match.topic}\n\n"
                f"**শনাক্তকরণ ও লক্ষণ:**\n{top_match.symptoms}\n\n"
                f"**সমন্বিত বালাই ব্যবস্থাপনা (IPM) ও জৈব প্রতিকার:**\n"
                f"• {top_match.cultural_control}\n"
                f"• {top_match.biological_control or 'প্রমাণিত জৈব উপাদান ব্যবহার করুন।'}\n\n"
                f"**নিরাপত্তা ও রাসায়নিক সতর্কতা:**\n"
                f"• {top_match.chemical_guidelines_caution}\n\n"
                f"*(উৎস: {top_match.source_institution})*"
            )
        elif active_lang == 'hi':
            answer_text = (
                f"**विषय:** {top_match.crop_name} — {top_match.topic}\n\n"
                f"**पहचान व लक्षण:**\n{top_match.symptoms}\n\n"
                f"**प्रबंधन (IPM) व जैविक उपाय:**\n"
                f"• {top_match.cultural_control}\n"
                f"• {top_match.biological_control or 'प्रमाणित जैविक उपचार अपनाएं।'}\n\n"
                f"**सावधानी व सुरक्षा:**\n"
                f"• {top_match.chemical_guidelines_caution}\n\n"
                f"*(स्त्रोत: {top_match.source_institution})*"
            )
        elif active_lang == 'te':
            answer_text = (
                f"**అంశం:** {top_match.crop_name} — {top_match.topic}\n\n"
                f"**గుర్తింపు & లక్షణాలు:**\n{top_match.symptoms}\n\n"
                f"**యాజమాన్య పద్ధతులు & సేంద్రీయ నియంత్రణ (IPM):**\n"
                f"• {top_match.cultural_control}\n"
                f"• {top_match.biological_control or 'ధృవీకరించబడిన జీవ నియంత్రణలను వాడండి.'}\n\n"
                f"**రసాయన జాగ్రత్తలు:**\n"
                f"• {top_match.chemical_guidelines_caution}\n\n"
                f"*(మూలం: {top_match.source_institution})*"
            )
        elif active_lang == 'ta':
            answer_text = (
                f"**தலைப்பு:** {top_match.crop_name} — {top_match.topic}\n\n"
                f"**அறிகுறிகள் & அடையாளம்:**\n{top_match.symptoms}\n\n"
                f"**ஒருங்கிணைந்த பயிர் பாதுகாப்பு (IPM) & இயற்கை கட்டுப்பாடு:**\n"
                f"• {top_match.cultural_control}\n"
                f"• {top_match.biological_control or 'உயிர் பூச்சிக்கொல்லிகளைப் பயன்படுத்தவும்.'}\n\n"
                f"**பாதுகாப்பு வழிகாட்டுதல்கள்:**\n"
                f"• {top_match.chemical_guidelines_caution}\n\n"
                f"*(ஆதாரம்: {top_match.source_institution})*"
            )
        elif active_lang == 'mr':
            answer_text = (
                f"**विषय:** {top_match.crop_name} — {top_match.topic}\n\n"
                f"**ओळख व लक्षणे:**\n{top_match.symptoms}\n\n"
                f"**एकात्मिक कीड व्यवस्थापन (IPM) व जैविक उपाय:**\n"
                f"• {top_match.cultural_control}\n"
                f"• {top_match.biological_control or 'प्रमाणित जैविक घटक वापरा.'}\n\n"
                f"**सुरक्षेची काळजी:**\n"
                f"• {top_match.chemical_guidelines_caution}\n\n"
                f"*(संदर्भ: {top_match.source_institution})*"
            )
        elif active_lang == 'gu':
            answer_text = (
                f"**વિષય:** {top_match.crop_name} — {top_match.topic}\n\n"
                f"**ઓળખ અને લક્ષણો:**\n{top_match.symptoms}\n\n"
                f"**સંકલિત જીવાત નિયંત્રણ (IPM) અને જૈવિક ઉપાય:**\n"
                f"• {top_match.cultural_control}\n"
                f"• {top_match.biological_control or 'પ્રમાણિત જૈવિક દવાઓ વાપરો.'}\n\n"
                f"**સુરક્ષા સાવચેતી:**\n"
                f"• {top_match.chemical_guidelines_caution}\n\n"
                f"*(સ્ત્રોત: {top_match.source_institution})*"
            )
        elif active_lang == 'pa':
            answer_text = (
                f"**ਵਿਸ਼ਾ:** {top_match.crop_name} — {top_match.topic}\n\n"
                f"**ਪਛਾਣ ਅਤੇ ਲੱਛਣ:**\n{top_match.symptoms}\n\n"
                f"**ਏਕੀਕ੍ਰਿਤ ਕੀਟ ਪ੍ਰਬੰਧਨ (IPM) ਅਤੇ ਜੈਵਿਕ ਕੰਟਰੋਲ:**\n"
                f"• {top_match.cultural_control}\n"
                f"• {top_match.biological_control or 'ਜੈਵਿਕ ਤਰੀਕੇ ਵਰਤੋ।'}\n\n"
                f"**ਸੁਰੱਖਿਆ ਸਾਵਧਾਨੀ:**\n"
                f"• {top_match.chemical_guidelines_caution}\n\n"
                f"*(ਸਰੋਤ: {top_match.source_institution})*"
            )
        elif active_lang == 'kn':
            answer_text = (
                f"**ವಿಷಯ:** {top_match.crop_name} — {top_match.topic}\n\n"
                f"**ಗುರುತಿಸುವಿಕೆ & ರೋಗ ಲಕ್ಷಣಗಳು:**\n{top_match.symptoms}\n\n"
                f"**ಸಮಗ್ರ ಕೀಟ ನಿರ್ವಹಣೆ (IPM) & ಜೈವಿಕ ನಿಯಂತ್ರಣ:**\n"
                f"• {top_match.cultural_control}\n"
                f"• {top_match.biological_control or 'ಜೈವಿಕ ನಿಯಂತ್ರಣ ಕ್ರಮಗಳನ್ನು ಅನುಸರಿಸಿ.'}\n\n"
                f"**ಸುರಕ್ಷತಾ ಮುನ್ನೆಚ್ಚರಿಕೆ:**\n"
                f"• {top_match.chemical_guidelines_caution}\n\n"
                f"*(ಮೂಲ: {top_match.source_institution})*"
            )
        else:
            answer_text = (
                f"**Topic:** {top_match.crop_name} — {top_match.topic}\n\n"
                f"**Symptoms & Identification:**\n{top_match.symptoms}\n\n"
                f"**Recommended Management (IPM):**\n"
                f"• {top_match.cultural_control}\n"
                f"• {top_match.biological_control or ''}\n\n"
                f"**Safety Precaution:**\n{top_match.chemical_guidelines_caution}\n\n"
                f"*(Source: {top_match.source_institution})*"
            )

        return {
            'answer': answer_text,
            'sources': sources,
            'suggested_actions': [
                "সমস্যা রিপোর্ট করুন" if active_lang == 'bn' else "Report Crop Issue",
                "আবহাওয়া পূর্বাভাস" if active_lang == 'bn' else "View Weather Forecast"
            ]
        }
