import os
import logging
from flask import Flask, jsonify
from flask_cors import CORS
from flask_migrate import Migrate
from apscheduler.schedulers.background import BackgroundScheduler

from .config import Config, DevelopmentConfig, TestingConfig, ProductionConfig
from .models import db
from .api.v1 import api_v1_bp
from .services.followup_engine import FollowUpEngine

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger('krishivaani')

migrate = Migrate()
scheduler = BackgroundScheduler()
followup_engine = FollowUpEngine()

def create_app(config_class=None):
    app = Flask(__name__)

    if config_class is None:
        env = os.getenv('FLASK_ENV', 'development')
        if env == 'production':
            config_class = ProductionConfig
        elif env == 'testing':
            config_class = TestingConfig
        else:
            config_class = DevelopmentConfig

    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    CORS(app, origins=app.config.get('CORS_ORIGINS', '*'), supports_credentials=True)

    # Ensure uploads directory exists
    os.makedirs(app.config.get('UPLOAD_FOLDER', 'backend/uploads'), exist_ok=True)
    os.makedirs(os.path.join(app.config.get('UPLOAD_FOLDER', 'backend/uploads'), 'crops'), exist_ok=True)

    # Register blueprints
    app.register_blueprint(api_v1_bp)

    # Centralized Error Handlers
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({'error': 'Bad Request', 'message': getattr(error, 'description', str(error))}), 400

    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify({'error': 'Unauthorized', 'message': getattr(error, 'description', str(error))}), 401

    @app.errorhandler(403)
    def forbidden(error):
        return jsonify({'error': 'Forbidden', 'message': getattr(error, 'description', str(error))}), 403

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Not Found', 'message': getattr(error, 'description', 'Resource not found')}), 404

    @app.errorhandler(413)
    def request_entity_too_large(error):
        return jsonify({'error': 'File Too Large', 'message': 'Maximum upload file size is 5MB'}), 413

    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f"Internal server error: {str(error)}")
        return jsonify({'error': 'Internal Server Error', 'message': 'An unexpected server error occurred'}), 500

    # Start background scheduler for follow-up reminders
    if app.config.get('ENABLE_BACKGROUND_SCHEDULER') and not app.config.get('TESTING'):
        try:
            if not scheduler.running:
                scheduler.add_job(
                    func=followup_engine.process_due_followups,
                    trigger="interval",
                    seconds=60,
                    id='followup_processor',
                    replace_existing=True,
                    args=[app]
                )
                scheduler.start()
                logger.info("Background follow-up scheduler started successfully.")
        except Exception as e:
            logger.warning(f"Could not start background scheduler: {str(e)}")

    # Auto-create tables if not present (SQLite local or Supabase PostgreSQL)
    with app.app_context():
        try:
            db.create_all()
        except Exception as e:
            logger.warning(f"Database schema auto-creation notice: {str(e)}")

    return app
