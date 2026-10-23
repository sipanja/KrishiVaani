import os
from datetime import timedelta
from dotenv import load_dotenv

# Load local environment variables from workspace root .env if present
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env'))

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'default-dev-secret-change-in-prod')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', SECRET_KEY)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=7)
    
    # Database
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///krishivaani.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Gnani AI API
    GNANI_API_KEY = os.getenv('GNANI_API_KEY', '')
    GNANI_BASE_URL = os.getenv('GNANI_BASE_URL', 'https://api.vachana.ai')
    
    # Uploads
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
    MAX_CONTENT_LENGTH = int(os.getenv('MAX_CONTENT_LENGTH', 5 * 1024 * 1024)) # 5MB limit
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp', 'wav', 'mp3', 'm4a', 'ogg'}
    
    # Follow-up Engine
    ENABLE_BACKGROUND_SCHEDULER = os.getenv('ENABLE_BACKGROUND_SCHEDULER', 'true').lower() == 'true'
    QUIET_HOURS_START = int(os.getenv('QUIET_HOURS_START', 21)) # 9 PM
    QUIET_HOURS_END = int(os.getenv('QUIET_HOURS_END', 6))       # 6 AM
    
    # CORS
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*').split(',')


class DevelopmentConfig(Config):
    DEBUG = True


class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    ENABLE_BACKGROUND_SCHEDULER = False
    SECRET_KEY = 'test-secret-key'


class ProductionConfig(Config):
    DEBUG = False
    # In production, require actual PostgreSQL and secure secret
    if not os.getenv('SECRET_KEY') or os.getenv('SECRET_KEY') == 'default-dev-secret-change-in-prod':
        # Don't fail during static import, but warn or validate on run
        pass
