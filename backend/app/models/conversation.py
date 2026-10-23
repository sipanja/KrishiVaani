import json
from datetime import datetime, timezone
from . import db

class Conversation(db.Model):
    __tablename__ = 'conversations'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    crop_id = db.Column(db.Integer, db.ForeignKey('crop_cycles.id', ondelete='SET NULL'), nullable=True)
    title = db.Column(db.String(200), default='General Advisory', nullable=False)
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    messages = db.relationship('ChatMessage', backref='conversation', lazy=True, cascade='all, delete-orphan', order_by='ChatMessage.created_at.asc()')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'crop_id': self.crop_id,
            'title': self.title,
            'message_count': len(self.messages) if self.messages else 0,
            'latest_message': self.messages[-1].to_dict() if self.messages else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class ChatMessage(db.Model):
    __tablename__ = 'chat_messages'

    id = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(db.Integer, db.ForeignKey('conversations.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    
    role = db.Column(db.String(20), nullable=False) # 'user', 'assistant', 'system'
    content = db.Column(db.Text, nullable=False)
    audio_url = db.Column(db.String(255), nullable=True)
    language = db.Column(db.String(10), default='hi', nullable=False)
    
    # Traceable evidence & sources
    sources_used = db.Column(db.Text, nullable=True) # JSON array of sources
    suggested_actions = db.Column(db.Text, nullable=True) # JSON array of action chips
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    def to_dict(self):
        sources = []
        if self.sources_used:
            try:
                sources = json.loads(self.sources_used)
            except Exception:
                sources = []
                
        actions = []
        if self.suggested_actions:
            try:
                actions = json.loads(self.suggested_actions)
            except Exception:
                actions = []

        return {
            'id': self.id,
            'conversation_id': self.conversation_id,
            'user_id': self.user_id,
            'role': self.role,
            'content': self.content,
            'audio_url': self.audio_url,
            'language': self.language,
            'sources_used': sources,
            'suggested_actions': actions,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
