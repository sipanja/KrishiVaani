from datetime import datetime, timezone, date
from flask import request, jsonify
from . import api_v1_bp
from ...models import db, CropCycle, Farm
from ...services.auth_service import jwt_required

@api_v1_bp.route('/crops', methods=['GET'])
@jwt_required
def get_crops():
    user = request.current_user
    farm_id = request.args.get('farm_id', type=int)
    
    query = CropCycle.query.filter_by(user_id=user.id)
    if farm_id:
        query = query.filter_by(farm_id=farm_id)
        
    crops = query.order_by(CropCycle.created_at.desc()).all()
    return jsonify({
        'crops': [c.to_dict() for c in crops],
        'total': len(crops)
    })

@api_v1_bp.route('/crops', methods=['POST'])
@jwt_required
def create_crop():
    user = request.current_user
    data = request.get_json() or {}
    
    farm_id = data.get('farm_id')
    crop_name = data.get('crop_name', '').strip()
    
    if not farm_id or not crop_name:
        return jsonify({'error': 'Farm selection and crop name are required'}), 400

    # Ensure farm belongs to user
    farm = Farm.query.filter_by(id=farm_id, user_id=user.id).first()
    if not farm:
        return jsonify({'error': 'Selected farm not found or unauthorized'}), 404

    sowing_date = None
    if data.get('sowing_date'):
        try:
            sowing_date = date.fromisoformat(data['sowing_date'])
        except ValueError:
            sowing_date = None

    expected_harvest = None
    if data.get('expected_harvest_date'):
        try:
            expected_harvest = date.fromisoformat(data['expected_harvest_date'])
        except ValueError:
            expected_harvest = None

    crop = CropCycle(
        farm_id=farm.id,
        user_id=user.id,
        crop_name=crop_name,
        variety=data.get('variety'),
        sowing_date=sowing_date,
        expected_harvest_date=expected_harvest,
        growth_stage=data.get('growth_stage', 'Vegetative / Tillering'),
        plot_identifier=data.get('plot_identifier'),
        status=data.get('status', 'active'),
        notes=data.get('notes')
    )
    db.session.add(crop)
    db.session.commit()

    return jsonify({
        'message': 'Crop cycle registered successfully',
        'crop': crop.to_dict()
    }), 201

@api_v1_bp.route('/crops/<int:crop_id>', methods=['GET'])
@jwt_required
def get_crop(crop_id: int):
    user = request.current_user
    crop = CropCycle.query.filter_by(id=crop_id, user_id=user.id).first()
    if not crop:
        return jsonify({'error': 'Crop not found'}), 404

    return jsonify({'crop': crop.to_dict()})

@api_v1_bp.route('/crops/<int:crop_id>', methods=['PUT', 'PATCH'])
@jwt_required
def update_crop(crop_id: int):
    user = request.current_user
    crop = CropCycle.query.filter_by(id=crop_id, user_id=user.id).first()
    if not crop:
        return jsonify({'error': 'Crop not found'}), 404

    data = request.get_json() or {}
    if 'crop_name' in data:
        crop.crop_name = data['crop_name'].strip()
    if 'variety' in data:
        crop.variety = data['variety'].strip()
    if 'growth_stage' in data:
        crop.growth_stage = data['growth_stage']
    if 'status' in data:
        crop.status = data['status']
    if 'plot_identifier' in data:
        crop.plot_identifier = data['plot_identifier']
    if 'notes' in data:
        crop.notes = data['notes']
    if 'sowing_date' in data:
        try:
            crop.sowing_date = date.fromisoformat(data['sowing_date']) if data['sowing_date'] else None
        except ValueError:
            pass
    if 'expected_harvest_date' in data:
        try:
            crop.expected_harvest_date = date.fromisoformat(data['expected_harvest_date']) if data['expected_harvest_date'] else None
        except ValueError:
            pass

    crop.updated_at = datetime.now(timezone.utc)
    db.session.commit()

    return jsonify({
        'message': 'Crop updated successfully',
        'crop': crop.to_dict()
    })

@api_v1_bp.route('/crops/<int:crop_id>', methods=['DELETE'])
@jwt_required
def delete_crop(crop_id: int):
    user = request.current_user
    crop = CropCycle.query.filter_by(id=crop_id, user_id=user.id).first()
    if not crop:
        return jsonify({'error': 'Crop not found'}), 404

    db.session.delete(crop)
    db.session.commit()
    return jsonify({'message': 'Crop deleted successfully'})
