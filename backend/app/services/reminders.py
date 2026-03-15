from datetime import datetime, timedelta
from app import db
from app.models import MaintenanceItem, MaintenanceLog, Asset, Settings
from app.services.email import send_reminder_email


def check_and_send_reminders(app):
    with app.app_context():
        notification_email = Settings.get('notification_email', '')
        if not notification_email:
            return

        threshold = float(Settings.get('reminder_threshold_percent', '30'))
        interval_days = int(Settings.get('reminder_interval_days', '1'))

        items = MaintenanceItem.query.filter_by(reminders_enabled=True).all()
        items_due = []

        for item in items:
            # Skip if reminder was sent recently
            if item.last_reminder_sent:
                days_since = (datetime.utcnow() - item.last_reminder_sent).total_seconds() / 86400
                if days_since < interval_days:
                    continue

            asset = Asset.query.get(item.asset_id)
            if not asset:
                continue

            status_info = get_item_status(item, asset)
            if not status_info:
                continue

            # Check if percentage remaining is at or below threshold
            if status_info['percentage_remaining'] <= threshold:
                items_due.append({
                    'asset_name': asset.name,
                    'item_name': item.name,
                    'status': status_info['status'],
                    'remaining': status_info['remaining_text'],
                    'item_id': item.id
                })

        if items_due:
            try:
                send_reminder_email(notification_email, items_due)
                # Update last_reminder_sent for all notified items
                for due_item in items_due:
                    item = MaintenanceItem.query.get(due_item['item_id'])
                    if item:
                        item.last_reminder_sent = datetime.utcnow()
                db.session.commit()
            except Exception as e:
                print(f'Failed to send reminder email: {e}')


def get_item_status(item, asset):
    last_log = (MaintenanceLog.query
                .filter_by(maintenance_item_id=item.id)
                .order_by(MaintenanceLog.date_performed.desc())
                .first())

    if not last_log:
        return {
            'status': 'overdue',
            'percentage_remaining': 0,
            'remaining_text': 'Never performed'
        }

    if item.maintenance_type == 'usage' and asset.usage_metric:
        last_usage = last_log.usage_reading or 0
        next_usage = last_usage + item.frequency_value
        usage_remaining = next_usage - asset.current_usage
        percentage = max(0, (usage_remaining / item.frequency_value) * 100)

        status = 'good'
        if usage_remaining <= 0:
            status = 'overdue'
        elif percentage <= 30:
            status = 'due-soon'

        return {
            'status': status,
            'percentage_remaining': percentage,
            'remaining_text': f'{max(0, usage_remaining)} {asset.usage_metric} remaining'
        }
    else:
        last_date = last_log.date_performed
        if isinstance(last_date, str):
            last_date = datetime.strptime(last_date, '%Y-%m-%d').date()

        today = datetime.utcnow().date()
        days_since = (today - last_date).days

        frequency_in_days = item.frequency_value
        if item.frequency_unit == 'weeks':
            frequency_in_days = item.frequency_value * 7
        elif item.frequency_unit == 'months':
            frequency_in_days = item.frequency_value * 30
        elif item.frequency_unit == 'years':
            frequency_in_days = item.frequency_value * 365

        days_remaining = frequency_in_days - days_since
        percentage = max(0, (days_remaining / frequency_in_days) * 100)

        status = 'good'
        if days_remaining <= 0:
            status = 'overdue'
        elif percentage <= 30:
            status = 'due-soon'

        return {
            'status': status,
            'percentage_remaining': percentage,
            'remaining_text': f'{max(0, days_remaining)} days remaining' if days_remaining > 0 else 'Overdue'
        }
