from datetime import datetime, timezone
from flask import request, jsonify
from . import api_v1_bp
from ...models import db, NotificationRecord
from ...services.auth_service import jwt_required

@api_v1_bp.route('/notifications', methods=['GET'])
@jwt_required
def get_notifications():
    user = request.current_user
    notifs = NotificationRecord.query.filter_by(user_id=user.id).order_by(NotificationRecord.created_at.desc()).limit(30).all()
    unread_count = sum(1 for n in notifs if n.read_at is None)
    return jsonify({
        'notifications': [n.to_dict() for n in notifs],
        'unread_count': unread_count,
        'total': len(notifs)
    })

@api_v1_bp.route('/notifications/<int:notif_id>/read', methods=['PATCH', 'POST'])
@jwt_required
def mark_read(notif_id: int):
    user = request.current_user
    notif = NotificationRecord.query.filter_by(id=notif_id, user_id=user.id).first()
    if not notif:
        return jsonify({'error': 'Notification not found'}), 404

    notif.read_at = datetime.now(timezone.utc)
    notif.status = 'read'
    db.session.commit()

    return jsonify({
        'message': 'Notification marked as read',
        'notification': notif.to_dict()
    })
