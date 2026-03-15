from flask import Blueprint, request, jsonify
from app import db
from app.models import Settings

bp = Blueprint('settings', __name__, url_prefix='/api/settings')

ALLOWED_KEYS = [
    'notification_email',
    'smtp_host',
    'smtp_port',
    'smtp_username',
    'smtp_password',
    'smtp_use_tls',
    'reminder_threshold_percent',
    'reminder_interval_days',
]

@bp.route('', methods=['GET'])
def get_settings():
    settings = {}
    for key in ALLOWED_KEYS:
        value = Settings.get(key)
        if value is not None:
            # Don't expose the SMTP password in full
            if key == 'smtp_password' and value:
                settings[key] = '••••••••'
            else:
                settings[key] = value
    return jsonify(settings)

@bp.route('', methods=['PUT'])
def update_settings():
    data = request.get_json()

    for key, value in data.items():
        if key in ALLOWED_KEYS:
            # Skip if password is the masked placeholder
            if key == 'smtp_password' and value == '••••••••':
                continue
            Settings.set(key, str(value) if value is not None else '')

    return jsonify({'message': 'Settings updated successfully'})

@bp.route('/test-email', methods=['POST'])
def test_email():
    from app.services.email import send_test_email
    try:
        send_test_email()
        return jsonify({'message': 'Test email sent successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 400
