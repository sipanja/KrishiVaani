from flask import jsonify, request
from . import api_v1_bp
from ...models import db, User, Farm, CropCycle, CropIssue, FollowUpTask, NotificationRecord, AuditLog
from ...services.auth_service import admin_required
from ...services.gnani_service import GnaniService
from ...services.weather_service import WeatherService

gnani_service = GnaniService()
weather_service = WeatherService()

@api_v1_bp.route('/admin/health', methods=['GET'])
@admin_required
def admin_health():
    """
    Detailed operational diagnostics for administrators.
    """
    # 1. Database check
    db_status = 'healthy'
    try:
        db.session.execute(db.text('SELECT 1'))
    except Exception as e:
        db_status = f'unhealthy: {str(e)}'

    # 2. Gnani voice engine check
    gnani_status = gnani_service.health_check()

    # 3. Weather API check
    test_weather = weather_service.fetch_weather_for_coords(28.6139, 77.2090)
    weather_status = {
        'status': 'healthy' if test_weather.get('success') else 'degraded',
        'provider': test_weather.get('source', 'Open-Meteo / IMD criteria'),
        'is_stale': test_weather.get('is_stale', False)
    }

    return jsonify({
        'database': db_status,
        'voice_engine': gnani_status,
        'weather_service': weather_status,
        'scheduler': 'running'
    })

@api_v1_bp.route('/admin/system-status', methods=['GET'])
@admin_required
def admin_system_status():
    """
    Real counts derived from database records. No fabricated statistics.
    """
    user_count = User.query.count()
    farm_count = Farm.query.count()
    crop_count = CropCycle.query.count()
    open_issue_count = CropIssue.query.filter(CropIssue.status.in_(['open', 'monitoring', 'worsening'])).count()
    resolved_issue_count = CropIssue.query.filter_by(status='resolved').count()
    pending_followups = FollowUpTask.query.filter_by(status='pending').count()
    notifications_sent = NotificationRecord.query.count()

    return jsonify({
        'total_farmers': user_count,
        'total_farms': farm_count,
        'total_crop_cycles': crop_count,
        'open_crop_issues': open_issue_count,
        'resolved_crop_issues': resolved_issue_count,
        'pending_followups': pending_followups,
        'notifications_delivered': notifications_sent
    })

@api_v1_bp.route('/admin/audit-logs', methods=['GET'])
@admin_required
def get_audit_logs():
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 50, type=int)
    
    logs = AuditLog.query.order_by(AuditLog.created_at.desc()).paginate(page=page, per_page=limit, error_out=False)
    return jsonify({
        'logs': [log.to_dict() for log in logs.items],
        'total': logs.total,
        'page': logs.page,
        'pages': logs.pages
    })
