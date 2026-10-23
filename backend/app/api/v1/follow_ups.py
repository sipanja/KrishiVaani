from datetime import datetime, timezone
from flask import request, jsonify
from . import api_v1_bp
from ...models import db, FollowUpTask, IssueObservation, CropIssue
from ...services.auth_service import jwt_required

@api_v1_bp.route('/follow-ups', methods=['GET'])
@jwt_required
def get_followups():
    user = request.current_user
    status = request.args.get('status')
    
    query = FollowUpTask.query.filter_by(user_id=user.id)
    if status:
        query = query.filter_by(status=status)
        
    tasks = query.order_by(FollowUpTask.scheduled_for.asc()).all()
    return jsonify({
        'follow_ups': [t.to_dict() for t in tasks],
        'total': len(tasks)
    })

@api_v1_bp.route('/follow-ups/<int:task_id>/respond', methods=['POST'])
@jwt_required
def respond_to_followup(task_id: int):
    user = request.current_user
    task = FollowUpTask.query.filter_by(id=task_id, user_id=user.id).first()
    if not task:
        return jsonify({'error': 'Follow-up task not found'}), 404

    data = request.get_json() or {}
    outcome = data.get('outcome', 'same') # 'improving', 'same', 'worsened', 'resolved'
    notes = data.get('notes', '').strip()
    action_taken = data.get('action_taken', '').strip()

    now = datetime.now(timezone.utc)
    task.status = 'completed'
    task.completed_at = now
    task.result_notes = f"Farmer outcome: {outcome}. Notes: {notes}"

    # Log as observation under the issue
    if task.crop_issue_id:
        issue = db.session.get(CropIssue, task.crop_issue_id)
        if issue:
            obs = IssueObservation(
                issue_id=issue.id,
                user_id=user.id,
                notes=notes or f"Follow-up feedback: Symptoms {outcome}",
                symptom_change=outcome,
                action_taken=action_taken
            )
            db.session.add(obs)
            
            if outcome == 'resolved':
                issue.status = 'resolved'
            elif outcome == 'improving':
                issue.status = 'improving'
            elif outcome == 'worsened':
                issue.status = 'worsening'
            issue.updated_at = now

    db.session.commit()

    return jsonify({
        'message': 'Response recorded successfully',
        'follow_up': task.to_dict()
    })

@api_v1_bp.route('/follow-ups/<int:task_id>/cancel', methods=['POST'])
@jwt_required
def cancel_followup(task_id: int):
    user = request.current_user
    task = FollowUpTask.query.filter_by(id=task_id, user_id=user.id).first()
    if not task:
        return jsonify({'error': 'Follow-up task not found'}), 404

    task.status = 'cancelled'
    task.completed_at = datetime.now(timezone.utc)
    task.result_notes = 'Cancelled by farmer'
    db.session.commit()

    return jsonify({
        'message': 'Follow-up task cancelled',
        'follow_up': task.to_dict()
    })
