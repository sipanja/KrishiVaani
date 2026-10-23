import io
from flask import request, jsonify, Response
from . import api_v1_bp
from ...services.auth_service import jwt_required
from ...services.gnani_service import GnaniService

gnani_service = GnaniService()

@api_v1_bp.route('/voice/health', methods=['GET'])
def voice_health():
    """
    Checks the status and availability of the Gnani AI speech engine.
    """
    status = gnani_service.health_check()
    return jsonify(status)

@api_v1_bp.route('/voice/transcribe', methods=['POST'])
@jwt_required
def transcribe_voice():
    """
    Converts farmer voice audio into text using Gnani Prisma STT.
    """
    audio_file = request.files.get('audio')
    language_code = request.form.get('language', 'hi')

    if not audio_file:
        # Check if raw audio bytes in request data
        if request.data:
            audio_bytes = request.data
            filename = 'input.wav'
        else:
            return jsonify({'error': 'Audio file or raw audio stream is required'}), 400
    else:
        audio_bytes = audio_file.read()
        filename = audio_file.filename or 'input.wav'

    if len(audio_bytes) < 100:
        return jsonify({'error': 'Audio recording is too short or empty.'}), 400

    result = gnani_service.transcribe(
        audio_bytes=audio_bytes,
        filename=filename,
        language_code=language_code
    )

    if not result['success']:
        return jsonify({
            'success': False,
            'error': result.get('error', 'Transcription failed'),
            'transcript': ''
        }), 502

    return jsonify({
        'success': True,
        'transcript': result['transcript'],
        'model': result.get('model'),
        'language_code': result.get('language_code')
    })

@api_v1_bp.route('/voice/synthesize', methods=['POST'])
@jwt_required
def synthesize_voice():
    """
    Synthesizes text into high-quality Indian regional language speech using Gnani Timbre TTS.
    """
    data = request.get_json() or {}
    text = data.get('text', '').strip()
    language_code = data.get('language', 'hi')
    speed = float(data.get('speed', 1.0))

    if not text:
        return jsonify({'error': 'Text is required for speech synthesis'}), 400

    # Truncate text if excessively long for a single audio playback clip (max 600 chars)
    if len(text) > 600:
        text = text[:597] + '...'

    result = gnani_service.synthesize(text=text, language_code=language_code, speed=speed)

    if not result['success']:
        return jsonify({
            'success': False,
            'error': result.get('error', 'Speech synthesis failed')
        }), 502

    return Response(
        result['audio_data'],
        mimetype='audio/wav',
        headers={
            'Content-Disposition': 'inline; filename="response.wav"',
            'Content-Length': str(result['length'])
        }
    )
