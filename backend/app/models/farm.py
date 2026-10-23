from datetime import datetime, timezone
from . import db

class Farm(db.Model):
    __tablename__ = 'farms'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    
    name = db.Column(db.String(120), nullable=False)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    size_value = db.Column(db.Float, nullable=True)
    size_unit = db.Column(db.String(20), default='Acres', nullable=False) # 'Acres', 'Bigha', 'Hectares', 'Gunta'
    
    soil_type = db.Column(db.String(80), nullable=True) # 'Alluvial', 'Black', 'Red', 'Laterite', 'Sandy', 'Clay Loam'
    irrigation_method = db.Column(db.String(80), nullable=True) # 'Canal', 'Tube Well / Borewell', 'Drip', 'Sprinkler', 'Rainfed'
    drainage_issues = db.Column(db.Boolean, default=False, nullable=False)
    notes = db.Column(db.Text, nullable=True)
    
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    crops = db.relationship('CropCycle', backref='farm', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'size_value': self.size_value,
            'size_unit': self.size_unit,
            'soil_type': self.soil_type,
            'irrigation_method': self.irrigation_method,
            'drainage_issues': self.drainage_issues,
            'notes': self.notes,
            'is_active': self.is_active,
            'crop_count': len(self.crops) if self.crops else 0,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
