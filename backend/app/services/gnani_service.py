import os
import io
import json
import logging
import requests
from flask import current_app

logger = logging.getLogger(__name__)

# Standard BCP-47 language codes supported by Gnani AI
LANGUAGE_CODE_MAP = {
    'hi': 'hi-IN',
    'en': 'en-IN',
    'bn': 'bn-IN',
    'te': 'te-IN',
    'ta': 'ta-IN',
    'mr': 'mr-IN',
    'gu': 'gu-IN',
    'kn': 'kn-IN',
    'pa': 'pa-IN'
}

VOICE_MAP = {
    'hi': 'Nalini',
    'en': 'Nalini',
    'bn': 'Nalini',
    'te': 'Nalini',
    'ta': 'Nalini',
    'mr': 'Nalini'
}

class GnaniService:
    def __init__(self, api_key: str = None, base_url: str = None):
        self.api_key = api_key or os.getenv('GNANI_API_KEY', '')
        self.base_url = (base_url or os.getenv('GNANI_BASE_URL', 'https://api.vachana.ai')).rstrip('/')
        self.headers = {
            'X-API-Key-ID': self.api_key,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }

    def is_configured(self) -> bool:
        return bool(self.api_key and not self.api_key.startswith('your_'))

    def transcribe(self, audio_bytes: bytes, filename: str = 'audio.wav', language_code: str = 'hi') -> dict:
        """
        Transcribes speech audio into text using Gnani Prisma v2.5 / v3 STT.
        """
        if not self.is_configured():
            return {
                'success': False,
                'error': 'Gnani STT is not configured. Missing GNANI_API_KEY.',
                'transcript': ''
            }

        gnani_lang = LANGUAGE_CODE_MAP.get(language_code, 'hi-IN')
        url = f'{self.base_url}/stt/v3'

        try:
            files = {
                'audio_file': (filename, io.BytesIO(audio_bytes), 'audio/wav')
            }
            data = {
                'language_code': gnani_lang,
                'format': 'transcribe',
                'itn_native_numerals': 'true'
            }

            response = requests.post(
                url,
                headers=self.headers,
                files=files,
                data=data,
                timeout=30
            )

            if response.status_code == 200:
                res_json = response.json()
                transcript = res_json.get('transcript', '') or res_json.get('text', '')
                return {
                    'success': True,
                    'transcript': transcript,
                    'model': res_json.get('model', 'gnani-prisma-v2.5'),
                    'request_id': res_json.get('request_id'),
                    'language_code': gnani_lang
                }
            else:
                logger.error(f"Gnani STT error: HTTP {response.status_code} - {response.text}")
                return {
                    'success': False,
                    'error': f"Gnani STT API error (HTTP {response.status_code}): {response.text[:200]}",
                    'transcript': ''
                }

        except requests.exceptions.Timeout:
            logger.error("Gnani STT request timed out.")
            return {
                'success': False,
                'error': 'Speech transcription timed out. Please try speaking again or type your question.',
                'transcript': ''
            }
        except Exception as e:
            logger.error(f"Unexpected Gnani STT exception: {str(e)}")
            return {
                'success': False,
                'error': f'Transcription service error: {str(e)}',
                'transcript': ''
            }

    def synthesize(self, text: str, language_code: str = 'hi', speed: float = 1.0) -> dict:
        """
        Synthesizes text into natural Indian language voice audio using Gnani Timbre TTS.
        """
        if not self.is_configured():
            return {
                'success': False,
                'error': 'Gnani TTS is not configured. Missing GNANI_API_KEY.',
                'audio_data': None
            }

        gnani_lang = LANGUAGE_CODE_MAP.get(language_code, 'hi-IN')
        voice_name = VOICE_MAP.get(language_code, 'Nalini')
        url = f'{self.base_url}/api/v1/tts/inference'

        payload = {
            'text': text,
            'voice': voice_name,
            'model': 'timbre-v2.5',
            'language': gnani_lang,
            'speed': speed,
            'audio_config': {
                'container': 'wav',
                'encoding': 'linear_pcm',
                'sample_rate': 48000
            }
        }

        try:
            req_headers = dict(self.headers)
            req_headers['Content-Type'] = 'application/json'

            response = requests.post(
                url,
                headers=req_headers,
                data=json.dumps(payload),
                timeout=30
            )

            if response.status_code == 200:
                audio_bytes = response.content
                return {
                    'success': True,
                    'audio_data': audio_bytes,
                    'content_type': response.headers.get('Content-Type', 'audio/wav'),
                    'length': len(audio_bytes)
                }
            else:
                logger.error(f"Gnani TTS error: HTTP {response.status_code} - {response.text}")
                return {
                    'success': False,
                    'error': f"Gnani TTS API error (HTTP {response.status_code}): {response.text[:200]}",
                    'audio_data': None
                }

        except requests.exceptions.Timeout:
            logger.error("Gnani TTS request timed out.")
            return {
                'success': False,
                'error': 'Speech synthesis timed out.',
                'audio_data': None
            }
        except Exception as e:
            logger.error(f"Unexpected Gnani TTS exception: {str(e)}")
            return {
                'success': False,
                'error': f'Speech synthesis error: {str(e)}',
                'audio_data': None
            }

    def health_check(self) -> dict:
        """
        Validates Gnani connection and API key status.
        """
        if not self.is_configured():
            return {
                'configured': False,
                'status': 'unconfigured',
                'message': 'GNANI_API_KEY is not configured.'
            }

        # Perform a fast test synthesis of a single greeting word
        result = self.synthesize(text='नमस्ते', language_code='hi')
        if result['success']:
            return {
                'configured': True,
                'status': 'healthy',
                'provider': 'Gnani AI (Prisma STT & Timbre TTS)',
                'message': 'Connected successfully to Gnani AI.'
            }
        else:
            return {
                'configured': True,
                'status': 'degraded',
                'provider': 'Gnani AI',
                'message': result.get('error')
            }
