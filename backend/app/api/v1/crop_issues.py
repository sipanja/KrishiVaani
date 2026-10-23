import json
from datetime import datetime, timezone, timedelta
from flask import request, jsonify
from . import api_v1_bp
from ...models import db, CropIssue, CropCycle, IssueObservation, FollowUpTask
from ...services.auth_service import jwt_required
from ...services.advisory_service import AdvisoryService
from ...services.storage_service import StorageService

advisory_service = AdvisoryService()

@api_v1_bp.route('/crop-issues', methods=['GET'])
@jwt_required
def get_issues():
    user = request.current_user
    crop_id = request.args.get('crop_id', type=int)
    status_filter = request.args.get('status')

    query = CropIssue.query.filter_by(user_id=user.id)
    if crop_id:
        query = query.filter_by(crop_id=crop_id)
    if status_filter:
        query = query.filter_by(status=status_filter)

    issues = query.order_by(CropIssue.created_at.desc()).all()
    return jsonify({
        'issues': [i.to_dict() for i in issues],
        'total': len(issues)
    })

@api_v1_bp.route('/crop-issues', methods=['POST'])
@jwt_required
def report_issue():
    user = request.current_user
    
    # Handle both multipart form-data (with voluntary image) and JSON
    if request.is_json:
        data = request.get_json() or {}
        image_file = None
    else:
        data = request.form.to_dict()
        image_file = request.files.get('image')

    crop_id = data.get('crop_id')
    title = data.get('title', '').strip()
    symptoms = data.get('symptoms', '').strip()

    if not crop_id or not symptoms:
        return jsonify({'error': 'Crop ID and symptoms description are required'}), 400

    crop = CropCycle.query.filter_by(id=crop_id, user_id=user.id).first()
    if not crop:
        return jsonify({'error': 'Crop not found or unauthorized'}), 404

    if not title:
        title = f"{crop.crop_name} issue: {symptoms[:40]}"

    # Save voluntary photo if uploaded
    image_path = None
    if image_file:
        saved = StorageService.save_file(image_file, subfolder='crops')
        if saved['success']:
            image_path = saved['filename']

    language = data.get('language') or (user.profile.preferred_language if user.profile else 'hi')

    # Analyze with verified RAG advisory service
    analysis = advisory_service.analyze_crop_problem(
        crop=crop,
        symptoms=symptoms,
        farmer_profile=user.profile,
        language=language
    )

    issue = CropIssue(
        crop_id=crop.id,
        user_id=user.id,
        title=title,
        reported_symptoms=symptoms,
        status='open',
        diagnosis_estimate=analysis['diagnosis_estimate'],
        severity=analysis['severity'],
        confidence=analysis['confidence'],
        guidance_notes=analysis['guidance_notes'],
        sources_cited=json.dumps(analysis['sources']),
        expert_referred=analysis['expert_referred'],
        expert_referral_reason=analysis['expert_referral_reason']
    )
    db.session.add(issue)
    db.session.flush()

    # Initial Observation entry
    initial_obs = IssueObservation(
        issue_id=issue.id,
        user_id=user.id,
        notes=f"Initial problem reported: {symptoms}",
        image_path=image_path,
        symptom_change='same',
        action_taken=data.get('action_taken')
    )
    db.session.add(initial_obs)

    # Schedule proactive observation follow-up in 2 days (or configured window)
    now = datetime.now(timezone.utc)
    follow_up_time = now + timedelta(days=2)
    
    is_hindi = user.profile and user.profile.preferred_language == 'hi'
    prompt_q = (
        f"नमस्ते! क्या आपके {crop.crop_name} में {issue.diagnosis_estimate or 'लक्षण'} में कोई सुधार हुआ है, "
        f"या स्थिति पहले जैसी है/बिगड़ गई है?"
        if is_hindi else
        f"Follow-up: Have the symptoms for {issue.diagnosis_estimate or 'reported issue'} on your {crop.crop_name} improved, "
        f"remained the same, or worsened?"
    )

    followup = FollowUpTask(
        user_id=user.id,
        crop_issue_id=issue.id,
        scheduled_for=follow_up_time,
        status='pending',
        reason=f"Observation follow-up for {issue.title}",
        prompt_question=prompt_q,
        delivery_channel='in_app'
    )
    db.session.add(followup)

    db.session.commit()

    return jsonify({
        'message': 'Crop issue reported and analyzed successfully',
        'issue': issue.to_dict(),
        'analysis': analysis,
        'scheduled_followup': followup.to_dict()
    }), 201

@api_v1_bp.route('/crop-issues/<int:issue_id>', methods=['GET'])
@jwt_required
def get_issue(issue_id: int):
    user = request.current_user
    issue = CropIssue.query.filter_by(id=issue_id, user_id=user.id).first()
    if not issue:
        return jsonify({'error': 'Crop issue not found'}), 404

    observations = [o.to_dict() for o in issue.observations]
    follow_ups = [f.to_dict() for f in issue.follow_up_tasks]

    res = issue.to_dict()
    res['observations'] = observations
    res['follow_up_tasks'] = follow_ups
    return jsonify({'issue': res})

@api_v1_bp.route('/crop-issues/<int:issue_id>', methods=['PATCH'])
@jwt_required
def update_issue_status(issue_id: int):
    user = request.current_user
    issue = CropIssue.query.filter_by(id=issue_id, user_id=user.id).first()
    if not issue:
        return jsonify({'error': 'Crop issue not found'}), 404

    data = request.get_json() or {}
    if 'status' in data:
        valid_statuses = ['open', 'monitoring', 'improving', 'worsening', 'resolved']
        if data['status'] not in valid_statuses:
            return jsonify({'error': f"Invalid status. Must be one of: {', '.join(valid_statuses)}"}), 400
        issue.status = data['status']

    if 'expert_referred' in data:
        issue.expert_referred = bool(data['expert_referred'])
    if 'expert_referral_reason' in data:
        issue.expert_referral_reason = data['expert_referral_reason']

    issue.updated_at = datetime.now(timezone.utc)
    db.session.commit()

    return jsonify({
        'message': 'Issue updated successfully',
        'issue': issue.to_dict()
    })

@api_v1_bp.route('/crop-issues/<int:issue_id>/observations', methods=['POST'])
@jwt_required
def add_observation(issue_id: int):
    user = request.current_user
    issue = CropIssue.query.filter_by(id=issue_id, user_id=user.id).first()
    if not issue:
        return jsonify({'error': 'Crop issue not found'}), 404

    if request.is_json:
        data = request.get_json() or {}
        image_file = None
    else:
        data = request.form.to_dict()
        image_file = request.files.get('image')

    notes = data.get('notes', '').strip()
    symptom_change = data.get('symptom_change', 'same')
    action_taken = data.get('action_taken', '').strip()

    if not notes and not symptom_change:
        return jsonify({'error': 'Observation notes or symptom status change required'}), 400

    image_path = None
    if image_file:
        saved = StorageService.save_file(image_file, subfolder='crops')
        if saved['success']:
            image_path = saved['filename']

    obs = IssueObservation(
        issue_id=issue.id,
        user_id=user.id,
        notes=notes or f"Updated symptom status: {symptom_change}",
        image_path=image_path,
        symptom_change=symptom_change,
        action_taken=action_taken
    )
    db.session.add(obs)

    # Reflect symptom change in parent issue status
    if symptom_change == 'resolved':
        issue.status = 'resolved'
    elif symptom_change == 'improving':
        issue.status = 'improving'
    elif symptom_change == 'worsened':
        issue.status = 'worsening'

    issue.updated_at = datetime.now(timezone.utc)
    db.session.commit()

    return jsonify({
        'message': 'Observation recorded successfully',
        'observation': obs.to_dict(),
        'issue': issue.to_dict()
    }), 201
