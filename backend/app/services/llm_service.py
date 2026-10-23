import os
import json
import logging
import requests

logger = logging.getLogger(__name__)

LANGUAGE_PROMPT_MAP = {
    'bn': 'Bengali (বাংলা)',
    'hi': 'Hindi (हिंदी)',
    'te': 'Telugu (తెలుగు)',
    'ta': 'Tamil (தமிழ்)',
    'mr': 'Marathi (मराठी)',
    'gu': 'Gujarati (ગુજરાતી)',
    'pa': 'Punjabi (ਪੰਜਾਬੀ)',
    'kn': 'Kannada (ಕನ್ನಡ)',
    'en': 'English'
}

class LLMService:
    def __init__(self, api_key: str = None, model: str = None):
        self.api_key = api_key or os.getenv('OPENROUTER_API_KEY', '')
        self.model = model or os.getenv('OPENROUTER_MODEL', 'recursive/flint-v1.0:free')
        self.base_url = 'https://openrouter.ai/api/v1/chat/completions'

    def is_configured(self) -> bool:
        return bool(self.api_key and len(self.api_key.strip()) > 10 and not self.api_key.startswith('your_'))

    def generate_response(
        self,
        user_query: str,
        language: str = 'hi',
        farmer_profile = None,
        active_crop = None,
        knowledge_matches: list = None,
        conversation_history: list = None
    ) -> dict:
        """
        Generates conversational and source-grounded agricultural advice via OpenRouter LLM.
        """
        if not self.is_configured():
            return {
                'success': False,
                'error': 'OpenRouter is not configured.',
                'content': ''
            }

        lang_name = LANGUAGE_PROMPT_MAP.get(language, 'Bengali (বাংলা)' if language == 'bn' else 'Hindi (हिंदी)')

        # Format context for grounding
        context_parts = []
        if active_crop:
            context_parts.append(f"Active Crop: {active_crop.crop_name} (Variety: {active_crop.variety or 'Standard'}, Stage: {active_crop.growth_stage or 'Active'})")
        if farmer_profile:
            context_parts.append(f"Farmer Location: {farmer_profile.village or ''}, {farmer_profile.district or ''}, {farmer_profile.state or 'India'}")

        if knowledge_matches:
            icar_snippets = []
            for doc in knowledge_matches[:3]:
                icar_snippets.append(
                    f"- Crop: {doc.crop_name} | Issue: {doc.topic}\n"
                    f"  Symptoms: {doc.symptoms}\n"
                    f"  Cultural Control: {doc.cultural_control}\n"
                    f"  Bio Control: {doc.biological_control or 'N/A'}\n"
                    f"  Precautions: {doc.chemical_guidelines_caution}\n"
                    f"  Source: {doc.source_institution}"
                )
            context_parts.append("Certified ICAR / SAU Agricultural Knowledge Records:\n" + "\n\n".join(icar_snippets))

        context_str = "\n".join(context_parts) if context_parts else "No specific prior farm record provided."

        system_prompt = (
            f"You are KrishiVaani (कृषिवाणी AI), a trusted, senior agricultural specialist and AI companion for Indian farmers.\n"
            f"CRITICAL REQUIREMENT: You MUST formulate your entire response in {lang_name}. Do NOT answer in English unless the user explicitly requested English.\n"
            f"Guidelines:\n"
            f"1. Tone: Warm, respectful, farmer-friendly, empathetic, and clear.\n"
            f"2. Greetings: If the user greets you (e.g. 'হাই', 'নমস্কার', 'হ্যালো', 'how are you'), greet them warmly back in {lang_name} and ask how you can help with their farm or crops.\n"
            f"3. Diagnostic Help: If the farmer does not know what is wrong with their crop, guide them step by step in {lang_name} (ask for crop name, specific leaf/stem symptoms, and pests/insects).\n"
            f"4. Agricultural Safety: Ground your pest/disease remedies strictly on scientific IPM (Integrated Pest Management), cultural sanitation, and bio-controls. Advise consulting the local Krishi Vigyan Kendra (KVK) before applying hazardous chemical sprays.\n"
            f"5. Structure: Use clean formatting with bullet points and bold headers for clarity.\n\n"
            f"Context Data for this conversation:\n{context_str}"
        )

        messages = [{'role': 'system', 'content': system_prompt}]

        # Append recent conversation history if provided
        if conversation_history:
            for item in conversation_history[-4:]:
                messages.append({
                    'role': 'user' if item.get('role') == 'user' else 'assistant',
                    'content': item.get('content', '')
                })

        messages.append({'role': 'user', 'content': user_query})

        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'HTTP-Referer': 'https://krishivaani.ai',
            'X-Title': 'KrishiVaani AI Voice Platform',
            'Content-Type': 'application/json'
        }

        payload = {
            'model': self.model,
            'messages': messages,
            'max_tokens': 3500,
            'temperature': 0.6
        }

        try:
            resp = requests.post(self.base_url, headers=headers, json=payload, timeout=45)
            if resp.status_code == 200:
                data = resp.json()
                choice = data['choices'][0]
                message_obj = choice.get('message', {})
                content = (message_obj.get('content') or '').strip()

                if content:
                    return {
                        'success': True,
                        'content': content,
                        'model': self.model,
                        'usage': data.get('usage', {})
                    }
                else:
                    logger.warning("OpenRouter returned empty message content.")
                    return {
                        'success': False,
                        'error': 'Empty response from LLM',
                        'content': ''
                    }
            else:
                logger.error(f"OpenRouter API error (HTTP {resp.status_code}): {resp.text[:300]}")
                return {
                    'success': False,
                    'error': f"OpenRouter HTTP {resp.status_code}: {resp.text[:200]}",
                    'content': ''
                }
        except requests.exceptions.Timeout:
            logger.warning("OpenRouter request timed out.")
            return {
                'success': False,
                'error': 'LLM request timed out.',
                'content': ''
            }
        except Exception as e:
            logger.error(f"OpenRouter exception: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'content': ''
            }
