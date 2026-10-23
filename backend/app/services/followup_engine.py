import logging
from datetime import datetime, timezone
from ..models import db, FollowUpTask, CropIssue, FarmerProfile, NotificationRecord

logger = logging.getLogger(__name__)

class FollowUpEngine:
    def process_due_followups(self, app=None):
        """
        Processes pending follow-up tasks:
        1. Validates that the underlying crop issue is still open or monitoring.
        2. Checks farmer quiet hours.
        3. Generates in-app notification and records delivery state.
        4. Increments attempts and updates task status.
        """
        def _execute():
            now = datetime.now(timezone.utc)
            # Find tasks that are due and pending
            due_tasks = FollowUpTask.query.filter(
                FollowUpTask.status.in_(['pending', 'in_progress']),
                FollowUpTask.scheduled_for <= now
            ).all()

            processed_count = 0
            for task in due_tasks:
                issue = task.issue
                # If issue was already marked resolved, cancel the follow-up
                if not issue or issue.status == 'resolved':
                    task.status = 'cancelled'
                    task.result_notes = 'Issue already marked resolved by farmer; follow-up cancelled automatically.'
                    task.completed_at = now
                    continue

                # Check quiet hours from farmer profile
                profile = FarmerProfile.query.filter_by(user_id=task.user_id).first()
                if profile:
                    # Current hour in IST (UTC + 5.5)
                    ist_hour = (now.hour + 5 + (1 if now.minute >= 30 else 0)) % 24
                    q_start = profile.quiet_hours_start
                    q_end = profile.quiet_hours_end

                    in_quiet_hours = False
                    if q_start > q_end:
                        in_quiet_hours = (ist_hour >= q_start or ist_hour < q_end)
                    else:
                        in_quiet_hours = (q_start <= ist_hour < q_end)

                    if in_quiet_hours:
                        logger.info(f"Task {task.id} skipped due to quiet hours ({ist_hour}:00 IST). Will retry in next active window.")
                        continue

                # Deliver In-App notification
                notif_title = f"Follow-up: {issue.title}"
                notif_msg = task.prompt_question

                existing_notif = NotificationRecord.query.filter_by(
                    follow_up_id=task.id,
                    user_id=task.user_id
                ).first()

                if not existing_notif:
                    notif = NotificationRecord(
                        user_id=task.user_id,
                        follow_up_id=task.id,
                        channel=task.delivery_channel or 'in_app',
                        title=notif_title,
                        message=notif_msg,
                        status='delivered'
                    )
                    db.session.add(notif)

                task.attempts += 1
                task.last_attempt_at = now
                task.status = 'in_progress'
                processed_count += 1

            if processed_count > 0 or due_tasks:
                try:
                    db.session.commit()
                    logger.info(f"Processed {processed_count} follow-up tasks successfully.")
                except Exception as e:
                    db.session.rollback()
                    logger.error(f"Error saving follow-up processing changes: {str(e)}")

        if app:
            with app.app_context():
                _execute()
        else:
            _execute()
