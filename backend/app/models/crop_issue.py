from datetime import datetime, timezone
from . import db

class CropIssue(db.Model):
    __tablename__ = 'crop_issues'

    id = db.Column(db.Integer, primary_key=True)
    crop_id = db.Column(db.Integer, db.ForeignKey('crop_cycles.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    
    title = db.Column(db.String(200), nullable=False)
    reported_symptoms = db.Column(db.Text, nullable=False)
    
    # Status: 'open', 'monitoring', 'improving', 'worsening', 'resolved'
    status = db.Column(db.String(50), default='open', nullable=False, index=True)
    
    # Diagnosis Assessment (Grounded, Qualified)
    diagnosis_estimate = db.Column(db.String(200), nullable=True) # e.g. "Suspected Rice Blast (Pyricularia oryzae)"
    severity = db.Column(db.String(50), default='moderate', nullable=False) # 'low', 'moderate', 'high', 'critical'
    confidence = db.Column(db.String(50), default='preliminary', nullable=False) # 'preliminary', 'probable', 'confirmed'
    
    # Safe Agricultural Guidelines
    guidance_notes = db.Column(db.Text, nullable=True)
    sources_cited = db.Column(db.Text, nullable=True) # JSON or markdown string of official ICAR / SAU sources
    
    # Expert escalation
    expert_referred = db.Column(db.Boolean, default=False, nullable=False)
    expert_referral_reason = db.Column(db.String(255), nullable=True)
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    observations = db.relationship('IssueObservation', backref='issue', lazy=True, cascade='all, delete-orphan', order_by='IssueObservation.created_at.desc()')
    follow_up_tasks = db.relationship('FollowUpTask', backref='issue', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'crop_id': self.crop_id,
            'crop_name': self.crop.crop_name if self.crop else None,
            'farm_name': self.crop.farm.name if self.crop and self.crop.farm else None,
            'user_id': self.user_id,
            'title': self.title,
            'reported_symptoms': self.reported_symptoms,
            'status': self.status,
            'diagnosis_estimate': self.diagnosis_estimate,
            'severity': self.severity,
            'confidence': self.confidence,
            'guidance_notes': self.guidance_notes,
            'sources_cited': self.sources_cited,
            'expert_referred': self.expert_referred,
            'expert_referral_reason': self.expert_referral_reason,
            'observations_count': len(self.observations) if self.observations else 0,
            'latest_observation': self.observations[0].to_dict() if self.observations else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
