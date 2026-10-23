from flask import request, jsonify
from . import api_v1_bp
from ...models import Farm, WeatherAlertRecord
from ...services.auth_service import jwt_required
from ...services.weather_service import WeatherService

weather_service = WeatherService()

@api_v1_bp.route('/weather', methods=['GET'])
@jwt_required
def get_weather():
    user = request.current_user
    farm_id = request.args.get('farm_id', type=int)

    # Find target farm or fallback to user's first registered farm with coordinates
    target_farm = None
    if farm_id:
        target_farm = Farm.query.filter_by(id=farm_id, user_id=user.id).first()
    else:
        target_farm = Farm.query.filter_by(user_id=user.id).filter(Farm.latitude.isnot(None)).first()

    # If coordinates are available on farm
    if target_farm and target_farm.latitude and target_farm.longitude:
        lat = target_farm.latitude
        lon = target_farm.longitude
        location_label = target_farm.name
    else:
        # Default representative Indian agricultural coordinates (New Delhi / IARI Pusa: 28.6366, 77.1574)
        lat = 28.6366
        lon = 77.1574
        location_label = "Representative Region (Coordinates not set for farm)"

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
