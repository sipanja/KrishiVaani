from datetime import datetime, timezone
from . import db

class FarmerProfile(db.Model):
    __tablename__ = 'farmer_profiles'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False)
    
    # Farmer Profile details
    full_name = db.Column(db.String(120), nullable=False)
    preferred_language = db.Column(db.String(10), default='hi', nullable=False) # 'hi', 'en', 'bn', 'te', 'ta', 'mr'
    phone_number = db.Column(db.String(20), nullable=True)
    
    # Location
    village = db.Column(db.String(100), nullable=True)
    district = db.Column(db.String(100), nullable=True)
    state = db.Column(db.String(100), nullable=True)
    country = db.Column(db.String(50), default='India', nullable=False)
    pincode = db.Column(db.String(10), nullable=True)
    
    # Preferences & Consent
    notification_sms = db.Column(db.Boolean, default=False, nullable=False)
    notification_whatsapp = db.Column(db.Boolean, default=False, nullable=False)
    notification_voice = db.Column(db.Boolean, default=False, nullable=False)
    notification_in_app = db.Column(db.Boolean, default=True, nullable=False)
    
    quiet_hours_start = db.Column(db.Integer, default=21, nullable=False) # 9 PM
    quiet_hours_end = db.Column(db.Integer, default=6, nullable=False)    # 6 AM
    location_consent = db.Column(db.Boolean, default=False, nullable=False)
    notification_consent = db.Column(db.Boolean, default=True, nullable=False)
    
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'full_name': self.full_name,
            'preferred_language': self.preferred_language,
            'phone_number': self.phone_number,
            'village': self.village,
            'district': self.district,
            'state': self.state,
            'country': self.country,
            'pincode': self.pincode,
            'notification_sms': self.notification_sms,
            'notification_whatsapp': self.notification_whatsapp,
            'notification_voice': self.notification_voice,
            'notification_in_app': self.notification_in_app,
            'quiet_hours_start': self.quiet_hours_start,
            'quiet_hours_end': self.quiet_hours_end,
            'location_consent': self.location_consent,
            'notification_consent': self.notification_consent,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
