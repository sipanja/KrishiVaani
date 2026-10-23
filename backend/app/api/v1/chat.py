import json
from datetime import datetime, timezone
from flask import request, jsonify
from . import api_v1_bp
from ...models import db, Conversation, ChatMessage, CropCycle, FarmerProfile
from ...services.auth_service import jwt_required
from ...services.advisory_service import AdvisoryService

advisory_service = AdvisoryService()

@api_v1_bp.route('/conversations', methods=['GET'])
@jwt_required
def get_conversations():
    user = request.current_user
    convs = Conversation.query.filter_by(user_id=user.id).order_by(Conversation.updated_at.desc()).all()
    return jsonify({
        'conversations': [c.to_dict() for c in convs],
        'total': len(convs)
    })

@api_v1_bp.route('/conversations', methods=['POST'])
@jwt_required
def create_conversation():
    user = request.current_user
    data = request.get_json() or {}
    
    crop_id = data.get('crop_id')
    title = data.get('title', 'General Crop Advisory').strip()

    conv = Conversation(
        user_id=user.id,
        crop_id=crop_id,
        title=title
    )
    db.session.add(conv)
    db.session.commit()

    return jsonify({
        'message': 'Conversation started',
        'conversation': conv.to_dict()
    }), 201

@api_v1_bp.route('/conversations/<int:conv_id>', methods=['GET'])
@jwt_required
def get_conversation_messages(conv_id: int):
    user = request.current_user
    conv = Conversation.query.filter_by(id=conv_id, user_id=user.id).first()
    if not conv:
        return jsonify({'error': 'Conversation not found'}), 404

    messages = [m.to_dict() for m in conv.messages]
    res = conv.to_dict()
    res['messages'] = messages
    return jsonify({'conversation': res})

@api_v1_bp.route('/conversations/<int:conv_id>/messages', methods=['POST'])
@jwt_required
def send_message(conv_id: int):
    user = request.current_user
    conv = Conversation.query.filter_by(id=conv_id, user_id=user.id).first()
    if not conv:
        return jsonify({'error': 'Conversation not found'}), 404

    data = request.get_json() or {}
    user_content = data.get('content', '').strip()
    audio_url = data.get('audio_url')
    language = data.get('language', user.profile.preferred_language if user.profile else 'hi')

    if not user_content:
        return jsonify({'error': 'Message content is required'}), 400

    # Save user's question
    user_msg = ChatMessage(
        conversation_id=conv.id,
        user_id=user.id,
        role='user',
        content=user_content,
        audio_url=audio_url,
        language=language
    )
    db.session.add(user_msg)

    # Active crop context if conversation is tied to a crop
    active_crop = db.session.get(CropCycle, conv.crop_id) if conv.crop_id else None

    # Advisory RAG response
    result = advisory_service.answer_query(
        user_query=user_content,
        farmer_profile=user.profile,
        active_crop=active_crop,
        language=language
    )

    # Assistant's verified answer
    assistant_msg = ChatMessage(
        conversation_id=conv.id,
        user_id=user.id,
        role='assistant',
        content=result['answer'],
        language=language,
        sources_used=json.dumps(result['sources']),
        suggested_actions=json.dumps(result.get('suggested_actions', []))
    )
    db.session.add(assistant_msg)

    conv.updated_at = datetime.now(timezone.utc)
    db.session.commit()

    return jsonify({
        'user_message': user_msg.to_dict(),
        'assistant_message': assistant_msg.to_dict()
    }), 201
