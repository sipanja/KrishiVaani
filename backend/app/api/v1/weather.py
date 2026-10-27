from flask import request, jsonify
from . import api_v1_bp
from ...models import Farm, WeatherAlertRecord
from ...services.auth_service import jwt_required
from ...services.weather_service import WeatherService

weather_service = WeatherService()

# Regional coordinates fallback map for Indian states/UTs
INDIAN_STATE_COORDS = {
    'west bengal': (22.9868, 87.8550),
    'bengal': (22.9868, 87.8550),
    'punjab': (31.1471, 75.3412),
    'haryana': (29.0588, 76.0856),
    'uttar pradesh': (26.8467, 80.9462),
    'up': (26.8467, 80.9462),
    'madhya pradesh': (22.9734, 78.6569),
    'mp': (22.9734, 78.6569),
    'bihar': (25.0961, 85.3131),
    'maharashtra': (19.7515, 75.7139),
    'rajasthan': (27.0238, 74.2179),
    'gujarat': (22.2587, 71.1924),
    'karnataka': (15.3173, 75.7139),
    'andhra pradesh': (15.9129, 79.7400),
    'andhra': (15.9129, 79.7400),
    'telangana': (18.1124, 79.0193),
    'tamil nadu': (11.1271, 78.6569),
    'kerala': (10.8505, 76.2711),
    'odisha': (20.9517, 85.0985),
    'orissa': (20.9517, 85.0985),
    'assam': (26.2006, 92.9376),
    'jharkhand': (23.6102, 85.2799),
    'chhattisgarh': (21.2787, 81.8661),
    'uttarakhand': (30.0668, 79.0193),
    'himachal pradesh': (31.1048, 77.1734),
    'himachal': (31.1048, 77.1734),
    'jammu and kashmir': (33.7782, 76.5762),
    'delhi': (28.6139, 77.2090),
}

@api_v1_bp.route('/weather', methods=['GET'])
@jwt_required
def get_weather():
    user = request.current_user
    farm_id = request.args.get('farm_id', type=int)
    param_lat = request.args.get('lat', type=float)
    param_lon = request.args.get('lon', type=float)

    target_farm = None
    lat = None
    lon = None
    location_label = "Auto Location"
    is_auto_detected = False

    # 1. If explicit farm_id requested
    if farm_id:
        target_farm = Farm.query.filter_by(id=farm_id, user_id=user.id).first()
        if target_farm and target_farm.latitude and target_farm.longitude:
            lat = target_farm.latitude
            lon = target_farm.longitude
            location_label = target_farm.name
        elif param_lat is not None and param_lon is not None:
            lat = param_lat
            lon = param_lon
            is_auto_detected = True
            location_label = target_farm.name if target_farm else "GPS Location"
            if target_farm and not target_farm.latitude:
                target_farm.latitude = lat
                target_farm.longitude = lon
                from ...models import db
                db.session.commit()

    # 2. If browser provided automatic GPS coordinates
    if lat is None and param_lat is not None and param_lon is not None:
        lat = param_lat
        lon = param_lon
        is_auto_detected = True
        if user.profile and user.profile.village:
            state_suffix = f", {user.profile.state}" if user.profile.state else ""
            location_label = f"{user.profile.village}{state_suffix}"
        else:
            location_label = f"GPS Location ({lat:.2f}°, {lon:.2f}°)"

    # 3. If still not resolved, check user's registered farms with coordinates
    if lat is None:
        target_farm = Farm.query.filter_by(user_id=user.id).filter(Farm.latitude.isnot(None)).first()
        if target_farm and target_farm.latitude and target_farm.longitude:
            lat = target_farm.latitude
            lon = target_farm.longitude
            location_label = target_farm.name

    # 4. Fallback to user's registered State / District in profile
    if lat is None and user.profile and user.profile.state:
        state_key = user.profile.state.strip().lower()
        matched_coords = INDIAN_STATE_COORDS.get(state_key)
        if not matched_coords:
            for k, coords in INDIAN_STATE_COORDS.items():
                if k in state_key:
                    matched_coords = coords
                    break
        if matched_coords:
            lat, lon = matched_coords
            state_suffix = f", {user.profile.state}" if user.profile.village else user.profile.state
            village_prefix = f"{user.profile.village}" if user.profile.village else ""
            location_label = f"{village_prefix}{state_suffix}".strip()
            is_auto_detected = True

    # 5. Ultimate fallback: National agricultural benchmark (IARI Pusa, New Delhi)
    if lat is None or lon is None:
        lat = 28.6366
        lon = 77.1574
        location_label = "Representative Region (Coordinates not set)"

    weather_data = weather_service.fetch_weather_for_coords(lat=lat, lon=lon)

    # Evaluate IMD agricultural hazard rules and persist deduplicated alerts
    if weather_data.get('success'):
        weather_service.evaluate_agricultural_risks(
            user_id=user.id,
            farm=target_farm,
            weather_data=weather_data
        )

    # Retrieve current active alerts for user
    active_alerts = WeatherAlertRecord.query.filter_by(user_id=user.id).order_by(WeatherAlertRecord.created_at.desc()).limit(5).all()

    return jsonify({
        'location_label': location_label,
        'farm_id': target_farm.id if target_farm else None,
        'latitude': lat,
        'longitude': lon,
        'is_auto_detected': is_auto_detected,
        'weather': weather_data,
        'alerts': [a.to_dict() for a in active_alerts]
    })

@api_v1_bp.route('/weather/alerts', methods=['GET'])
@jwt_required
def get_weather_alerts():
    user = request.current_user
    alerts = WeatherAlertRecord.query.filter_by(user_id=user.id).order_by(WeatherAlertRecord.created_at.desc()).all()
    return jsonify({
        'alerts': [a.to_dict() for a in alerts],
        'total': len(alerts)
    })
