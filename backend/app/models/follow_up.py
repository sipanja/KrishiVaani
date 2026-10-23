from datetime import datetime, timezone
from . import db

class FollowUpTask(db.Model):
    __tablename__ = 'follow_up_tasks'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    crop_issue_id = db.Column(db.Integer, db.ForeignKey('crop_issues.id', ondelete='CASCADE'), nullable=False, index=True)
    
    # Scheduling
    scheduled_for = db.Column(db.DateTime, nullable=False, index=True)
    status = db.Column(db.String(50), default='pending', nullable=False, index=True) # 'pending', 'in_progress', 'completed', 'cancelled', 'failed'
    
    # Prompt & Reason
    reason = db.Column(db.String(255), nullable=False) # e.g. "Observation follow-up for suspected Rice Blast"
    prompt_question = db.Column(db.Text, nullable=False) # e.g. "Have the brown spots on your paddy leaves started drying up, or are they spreading?"
    
    # Execution metadata
    delivery_channel = db.Column(db.String(50), default='in_app', nullable=False) # 'in_app', 'sms', 'whatsapp', 'voice'
    attempts = db.Column(db.Integer, default=0, nullable=False)
    last_attempt_at = db.Column(db.DateTime, nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)
    result_notes = db.Column(db.Text, nullable=True)
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    notifications = db.relationship('NotificationRecord', backref='follow_up', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'crop_issue_id': self.crop_issue_id,
            'issue_title': self.issue.title if self.issue else None,
            'scheduled_for': self.scheduled_for.isoformat() if self.scheduled_for else None,
            'status': self.status,
            'reason': self.reason,
            'prompt_question': self.prompt_question,
            'delivery_channel': self.delivery_channel,
            'attempts': self.attempts,
            'last_attempt_at': self.last_attempt_at.isoformat() if self.last_attempt_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'result_notes': self.result_notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
