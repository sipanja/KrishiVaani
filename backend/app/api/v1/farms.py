from datetime import datetime, timezone
from flask import request, jsonify
from . import api_v1_bp
from ...models import db, Farm
from ...services.auth_service import jwt_required

@api_v1_bp.route('/farms', methods=['GET'])
@jwt_required
def get_farms():
    user = request.current_user
    farms = Farm.query.filter_by(user_id=user.id, is_active=True).order_by(Farm.created_at.desc()).all()
    return jsonify({
        'farms': [f.to_dict() for f in farms],
        'total': len(farms)
    })

@api_v1_bp.route('/farms', methods=['POST'])
@jwt_required
def create_farm():
    user = request.current_user
    data = request.get_json() or {}
    name = data.get('name', '').strip()

    if not name:
        return jsonify({'error': 'Farm name is required'}), 400

    lat = data.get('latitude')
    lon = data.get('longitude')
    if lat is not None:
        try:
            lat = float(lat)
        except ValueError:
            lat = None
    if lon is not None:
        try:
            lon = float(lon)
        except ValueError:
            lon = None

    size_val = data.get('size_value')
    if size_val is not None:
        try:
            size_val = float(size_val)
        except ValueError:
            size_val = None

    farm = Farm(
        user_id=user.id,
        name=name,
        latitude=lat,
        longitude=lon,
        size_value=size_val,
        size_unit=data.get('size_unit', 'Acres'),
        soil_type=data.get('soil_type'),
        irrigation_method=data.get('irrigation_method'),
        drainage_issues=bool(data.get('drainage_issues', False)),
        notes=data.get('notes')
    )
    db.session.add(farm)
    db.session.commit()

    return jsonify({
        'message': 'Farm created successfully',
        'farm': farm.to_dict()
    }), 201

@api_v1_bp.route('/farms/<int:farm_id>', methods=['GET'])
@jwt_required
def get_farm(farm_id: int):
    user = request.current_user
    farm = Farm.query.filter_by(id=farm_id, user_id=user.id).first()
    if not farm:
        return jsonify({'error': 'Farm not found'}), 404

    return jsonify({'farm': farm.to_dict()})

@api_v1_bp.route('/farms/<int:farm_id>', methods=['PUT', 'PATCH'])
@jwt_required
def update_farm(farm_id: int):
    user = request.current_user
    farm = Farm.query.filter_by(id=farm_id, user_id=user.id).first()
    if not farm:
        return jsonify({'error': 'Farm not found'}), 404

    data = request.get_json() or {}
    if 'name' in data:
        farm.name = data['name'].strip()
    if 'latitude' in data:
        farm.latitude = float(data['latitude']) if data['latitude'] is not None else None
    if 'longitude' in data:
        farm.longitude = float(data['longitude']) if data['longitude'] is not None else None
    if 'size_value' in data:
        farm.size_value = float(data['size_value']) if data['size_value'] is not None else None
    if 'size_unit' in data:
        farm.size_unit = data['size_unit']
    if 'soil_type' in data:
        farm.soil_type = data['soil_type']
    if 'irrigation_method' in data:
        farm.irrigation_method = data['irrigation_method']
    if 'drainage_issues' in data:
        farm.drainage_issues = bool(data['drainage_issues'])
    if 'notes' in data:
        farm.notes = data['notes']

    farm.updated_at = datetime.now(timezone.utc)
    db.session.commit()

    return jsonify({
        'message': 'Farm updated successfully',
        'farm': farm.to_dict()
    })

@api_v1_bp.route('/farms/<int:farm_id>', methods=['DELETE'])
@jwt_required
def delete_farm(farm_id: int):
    user = request.current_user
    farm = Farm.query.filter_by(id=farm_id, user_id=user.id).first()
    if not farm:
        return jsonify({'error': 'Farm not found'}), 404

    db.session.delete(farm)
    db.session.commit()
    return jsonify({'message': 'Farm deleted successfully'})
