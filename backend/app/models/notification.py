from datetime import datetime, timezone
from . import db

class NotificationRecord(db.Model):
    __tablename__ = 'notifications'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    follow_up_id = db.Column(db.Integer, db.ForeignKey('follow_up_tasks.id', ondelete='SET NULL'), nullable=True)
    
    channel = db.Column(db.String(50), default='in_app', nullable=False) # 'in_app', 'sms', 'whatsapp', 'voice'
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    
    # Status: 'sent', 'delivered', 'read', 'failed'
    status = db.Column(db.String(50), default='delivered', nullable=False)
    provider_message_id = db.Column(db.String(120), nullable=True)
    error_message = db.Column(db.Text, nullable=True)
    
    read_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'follow_up_id': self.follow_up_id,
            'channel': self.channel,
            'title': self.title,
            'message': self.message,
            'status': self.status,
            'read_at': self.read_at.isoformat() if self.read_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
