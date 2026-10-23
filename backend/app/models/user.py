from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash
from . import db

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=True, index=True)
    phone = db.Column(db.String(20), unique=True, nullable=True, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='farmer', nullable=False) # 'farmer' or 'admin'
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    profile = db.relationship('FarmerProfile', backref='user', uselist=False, cascade='all, delete-orphan')
    farms = db.relationship('Farm', backref='owner', lazy=True, cascade='all, delete-orphan')
    crops = db.relationship('CropCycle', backref='owner', lazy=True, cascade='all, delete-orphan')
    crop_issues = db.relationship('CropIssue', backref='owner', lazy=True, cascade='all, delete-orphan')
    conversations = db.relationship('Conversation', backref='user', lazy=True, cascade='all, delete-orphan')
    follow_up_tasks = db.relationship('FollowUpTask', backref='user', lazy=True, cascade='all, delete-orphan')
    notifications = db.relationship('NotificationRecord', backref='user', lazy=True, cascade='all, delete-orphan')

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'phone': self.phone,
            'role': self.role,
            'is_active': self.is_active,
            'has_profile': self.profile is not None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
