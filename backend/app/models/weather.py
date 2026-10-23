from datetime import datetime, timezone
from . import db

class WeatherAlertRecord(db.Model):
    __tablename__ = 'weather_alerts'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    farm_id = db.Column(db.Integer, db.ForeignKey('farms.id', ondelete='CASCADE'), nullable=True, index=True)
    
    # Alert content
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    
    # Severity: 'advisory', 'watch', 'warning', 'severe'
    severity = db.Column(db.String(50), default='advisory', nullable=False)
    hazard_type = db.Column(db.String(80), nullable=False) # 'heavy_rainfall', 'dry_spell', 'heatwave', 'frost', 'pest_risk'
    
    # Source attribution: 'IMD Standard Criteria', 'SACHET / NDMA', 'Open-Meteo ECMWF Model'
    source = db.Column(db.String(120), nullable=False)
    is_official_warning = db.Column(db.Boolean, default=False, nullable=False)
    
    valid_from = db.Column(db.DateTime, nullable=False)
    valid_to = db.Column(db.DateTime, nullable=False)
    
    dedup_hash = db.Column(db.String(64), nullable=True, index=True)
    is_acknowledged = db.Column(db.Boolean, default=False, nullable=False)
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'farm_id': self.farm_id,
            'title': self.title,
            'description': self.description,
            'severity': self.severity,
            'hazard_type': self.hazard_type,
            'source': self.source,
            'is_official_warning': self.is_official_warning,
            'valid_from': self.valid_from.isoformat() if self.valid_from else None,
            'valid_to': self.valid_to.isoformat() if self.valid_to else None,
            'is_acknowledged': self.is_acknowledged,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
