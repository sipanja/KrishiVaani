import jwt
from functools import wraps
from datetime import datetime, timezone, timedelta
from flask import request, jsonify, current_app
from ..models import db, User

def generate_token(user: User) -> str:
    payload = {
        'sub': str(user.id),
        'username': user.username,
        'role': user.role,
        'exp': datetime.now(timezone.utc) + current_app.config['JWT_ACCESS_TOKEN_EXPIRES'],
        'iat': datetime.now(timezone.utc)
    }
    return jwt.encode(payload, current_app.config['JWT_SECRET_KEY'], algorithm='HS256')

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        return {'error': 'Token has expired'}
    except jwt.InvalidTokenError:
        return {'error': 'Invalid token'}

def jwt_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': 'Authorization header is missing'}), 401
            
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return jsonify({'error': 'Invalid authorization format. Format: Bearer <token>'}), 401
            
        token = parts[1]
        decoded = decode_token(token)
        if 'error' in decoded:
            return jsonify({'error': decoded['error']}), 401
            
        user = db.session.get(User, int(decoded['sub']))
        if not user or not user.is_active:
            return jsonify({'error': 'User not found or account deactivated'}), 401
            
        # Attach current_user to request context
        request.current_user = user
        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': 'Authorization header is missing'}), 401
            
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return jsonify({'error': 'Invalid authorization format'}), 401
            
        decoded = decode_token(parts[1])
        if 'error' in decoded:
            return jsonify({'error': decoded['error']}), 401
            
        user = db.session.get(User, int(decoded['sub']))
        if not user or user.role != 'admin':
            return jsonify({'error': 'Forbidden: Administrator access required'}), 403
            
        request.current_user = user
        return f(*args, **kwargs)
    return decorated
