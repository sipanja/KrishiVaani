from datetime import datetime, timezone
from . import db

class CropCycle(db.Model):
    __tablename__ = 'crop_cycles'

    id = db.Column(db.Integer, primary_key=True)
    farm_id = db.Column(db.Integer, db.ForeignKey('farms.id', ondelete='CASCADE'), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    
    crop_name = db.Column(db.String(100), nullable=False) # e.g. Paddy (Rice), Wheat, Cotton, Mustard, Sugarcane
    variety = db.Column(db.String(100), nullable=True) # e.g. PB-1121, HD-2967, Hybrid 4
    sowing_date = db.Column(db.Date, nullable=True)
    expected_harvest_date = db.Column(db.Date, nullable=True)
    
    # Growth stage: 'Germination', 'Vegetative / Tillering', 'Flowering / Panicle Initiation', 'Grain Formation / Fruiting', 'Maturity / Harvest'
    growth_stage = db.Column(db.String(100), default='Vegetative / Tillering', nullable=False)
    plot_identifier = db.Column(db.String(100), nullable=True) # e.g. 'North Field plot 2'
    status = db.Column(db.String(50), default='active', nullable=False) # 'active', 'harvested', 'abandoned'
    
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    issues = db.relationship('CropIssue', backref='crop', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'farm_id': self.farm_id,
            'farm_name': self.farm.name if self.farm else None,
            'user_id': self.user_id,
            'crop_name': self.crop_name,
            'variety': self.variety,
            'sowing_date': self.sowing_date.isoformat() if self.sowing_date else None,
            'expected_harvest_date': self.expected_harvest_date.isoformat() if self.expected_harvest_date else None,
            'growth_stage': self.growth_stage,
            'plot_identifier': self.plot_identifier,
            'status': self.status,
            'notes': self.notes,
            'active_issues_count': sum(1 for issue in self.issues if issue.status in ['open', 'monitoring', 'worsening']) if self.issues else 0,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
