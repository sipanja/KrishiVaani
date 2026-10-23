from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

from .user import User
from .farmer_profile import FarmerProfile
from .farm import Farm
from .crop import CropCycle
from .crop_issue import CropIssue
from .observation import IssueObservation
from .conversation import Conversation, ChatMessage
from .weather import WeatherAlertRecord
from .follow_up import FollowUpTask
from .notification import NotificationRecord
from .knowledge import AgriculturalKnowledge
from .audit import AuditLog

__all__ = [
    'db',
    'User',
    'FarmerProfile',
    'Farm',
    'CropCycle',
    'CropIssue',
    'IssueObservation',
    'Conversation',
    'ChatMessage',
    'WeatherAlertRecord',
    'FollowUpTask',
    'NotificationRecord',
    'AgriculturalKnowledge',
    'AuditLog',
]
