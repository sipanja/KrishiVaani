from datetime import datetime, timezone
from . import db

class IssueObservation(db.Model):
    __tablename__ = 'issue_observations'

    id = db.Column(db.Integer, primary_key=True)
    issue_id = db.Column(db.Integer, db.ForeignKey('crop_issues.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    
    # Farmer's observation & actions
    notes = db.Column(db.Text, nullable=False)
    image_path = db.Column(db.String(255), nullable=True)
    audio_path = db.Column(db.String(255), nullable=True)
    
    # Outcome: 'same', 'improving', 'worsened', 'resolved'
    symptom_change = db.Column(db.String(50), default='same', nullable=False)
    action_taken = db.Column(db.Text, nullable=True)
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'issue_id': self.issue_id,
            'user_id': self.user_id,
            'notes': self.notes,
            'image_url': f'/api/v1/uploads/{self.image_path.split("/")[-1]}' if self.image_path else None,
            'audio_url': f'/api/v1/uploads/{self.audio_path.split("/")[-1]}' if self.audio_path else None,
            'symptom_change': self.symptom_change,
            'action_taken': self.action_taken,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
