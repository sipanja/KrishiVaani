from datetime import datetime, timezone
from flask import request, jsonify
from . import api_v1_bp
from ...models import db, User, FarmerProfile, AuditLog
from ...services.auth_service import generate_token, jwt_required

@api_v1_bp.route('/auth/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '')
    email = data.get('email', '').strip() or None
    phone = data.get('phone', '').strip() or None
    full_name = data.get('full_name', '').strip() or username
    preferred_language = data.get('preferred_language', 'hi')

    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400

    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters long'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username is already taken'}), 409

    if email and User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email is already registered'}), 409

    if phone and User.query.filter_by(phone=phone).first():
        return jsonify({'error': 'Phone number is already registered'}), 409

    # Determine role: first user can be admin or farmer default
    user_count = User.query.count()
    role = 'admin' if user_count == 0 else 'farmer'

    user = User(
        username=username,
        email=email,
        phone=phone,
        role=role
    )
    user.set_password(password)
    db.session.add(user)
    db.session.flush()

    # Create associated FarmerProfile
    profile = FarmerProfile(
        user_id=user.id,
        full_name=full_name,
        preferred_language=preferred_language,
        phone_number=phone,
        village=data.get('village'),
        district=data.get('district'),
        state=data.get('state'),
        pincode=data.get('pincode'),
        notification_sms=bool(data.get('notification_sms', False)),
        notification_whatsapp=bool(data.get('notification_whatsapp', False)),
        notification_voice=bool(data.get('notification_voice', False)),
        notification_in_app=True,
        location_consent=bool(data.get('location_consent', False))
    )
    db.session.add(profile)

    audit = AuditLog(
        user_id=user.id,
        action='REGISTER',
        ip_address=request.remote_addr,
        details=f"User registered with role {role}"
    )
    db.session.add(audit)

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create user: {str(e)}'}), 500

    token = generate_token(user)
    return jsonify({
        'message': 'Registration successful',
        'token': token,
        'user': user.to_dict(),
        'profile': profile.to_dict()
    }), 201

@api_v1_bp.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    identifier = data.get('username', '').strip()
    password = data.get('password', '')

    if not identifier or not password:
        return jsonify({'error': 'Username and password are required'}), 400

    user = User.query.filter(
        (User.username == identifier) | (User.email == identifier) | (User.phone == identifier)
    ).first()

    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid username or password'}), 401

    if not user.is_active:
        return jsonify({'error': 'Your account has been deactivated. Please contact support.'}), 403

    audit = AuditLog(
        user_id=user.id,
        action='LOGIN',
        ip_address=request.remote_addr,
        details="User logged in successfully"
    )
    db.session.add(audit)
    db.session.commit()

    token = generate_token(user)
    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': user.to_dict(),
        'profile': user.profile.to_dict() if user.profile else None
    })

@api_v1_bp.route('/auth/logout', methods=['POST'])
@jwt_required
def logout():
    user = request.current_user
    audit = AuditLog(
        user_id=user.id,
        action='LOGOUT',
        ip_address=request.remote_addr,
        details="User logged out"
    )
    db.session.add(audit)
    db.session.commit()
    return jsonify({'message': 'Logged out successfully'})

@api_v1_bp.route('/auth/me', methods=['GET'])
@jwt_required
def get_me():
    user = request.current_user
    return jsonify({
        'user': user.to_dict(),
        'profile': user.profile.to_dict() if user.profile else None
    })

@api_v1_bp.route('/auth/profile', methods=['PATCH'])
@jwt_required
def update_profile():
    user = request.current_user
    data = request.get_json() or {}

    profile = user.profile
    if not profile:
        profile = FarmerProfile(user_id=user.id, full_name=user.username)
        db.session.add(profile)

    if 'full_name' in data:
        profile.full_name = data['full_name'].strip()
    if 'preferred_language' in data:
        profile.preferred_language = data['preferred_language']
    if 'phone_number' in data:
        profile.phone_number = data['phone_number'].strip()
    if 'village' in data:
        profile.village = data['village'].strip()
    if 'district' in data:
        profile.district = data['district'].strip()
    if 'state' in data:
        profile.state = data['state'].strip()
    if 'pincode' in data:
        profile.pincode = data['pincode'].strip()
    if 'notification_sms' in data:
        profile.notification_sms = bool(data['notification_sms'])
    if 'notification_whatsapp' in data:
        profile.notification_whatsapp = bool(data['notification_whatsapp'])
    if 'notification_voice' in data:
        profile.notification_voice = bool(data['notification_voice'])
    if 'notification_in_app' in data:
        profile.notification_in_app = bool(data['notification_in_app'])
    if 'quiet_hours_start' in data:
        profile.quiet_hours_start = int(data['quiet_hours_start'])
    if 'quiet_hours_end' in data:
        profile.quiet_hours_end = int(data['quiet_hours_end'])
    if 'location_consent' in data:
        profile.location_consent = bool(data['location_consent'])
    if 'notification_consent' in data:
        profile.notification_consent = bool(data['notification_consent'])

    profile.updated_at = datetime.now(timezone.utc)
    db.session.commit()

    return jsonify({
        'message': 'Profile updated successfully',
        'profile': profile.to_dict()
    })

@api_v1_bp.route('/auth/account', methods=['DELETE'])
@jwt_required
def delete_account():
    user = request.current_user
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'Account and all associated farm data permanently deleted.'})
