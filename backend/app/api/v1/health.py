from flask import jsonify
from . import api_v1_bp
from ...models import db

@api_v1_bp.route('/health/live', methods=['GET'])
def liveness():
    """Liveness probe: verifies the process is running."""
    return jsonify({'status': 'live'}), 200

@api_v1_bp.route('/health/ready', methods=['GET'])
def readiness():
    """Readiness probe: verifies database and dependencies are responsive."""
    try:
        db.session.execute(db.text('SELECT 1'))
        return jsonify({'status': 'ready', 'database': 'connected'}), 200
    except Exception as e:
        return jsonify({'status': 'not_ready', 'database': str(e)}), 503
