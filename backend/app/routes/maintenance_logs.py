from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from app import db
from app.models import MaintenanceLog, MaintenanceItem, Vehicle
from datetime import datetime
import os

bp = Blueprint('maintenance_logs', __name__, url_prefix='/api/maintenance-logs')

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@bp.route('', methods=['GET'])
def get_maintenance_logs():
    item_id = request.args.get('maintenance_item_id', type=int)
    if item_id:
        logs = MaintenanceLog.query.filter_by(maintenance_item_id=item_id).order_by(MaintenanceLog.date_performed.desc()).all()
    else:
        logs = MaintenanceLog.query.order_by(MaintenanceLog.date_performed.desc()).all()
    return jsonify([log.to_dict() for log in logs])

@bp.route('/<int:log_id>', methods=['GET'])
def get_maintenance_log(log_id):
    log = MaintenanceLog.query.get_or_404(log_id)
    return jsonify(log.to_dict())

@bp.route('', methods=['POST'])
def create_maintenance_log():
    # Use request.form for multipart/form-data, request.get_json() for application/json
    data = request.form if request.form else request.get_json()

    # Verify maintenance item exists
    item = MaintenanceItem.query.get_or_404(data['maintenance_item_id'])

    # Parse date
    date_performed = datetime.fromisoformat(data['date_performed']).date()

    # Handle file upload
    receipt_photo = None
    if 'receipt_photo' in request.files:
        file = request.files['receipt_photo']
        if file and file.filename and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            # Add timestamp to prevent collisions
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"{timestamp}_{filename}"
            filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            receipt_photo = filename

    # Convert mileage to int if provided
    mileage = int(data.get('mileage')) if data.get('mileage') else None

    log = MaintenanceLog(
        maintenance_item_id=data['maintenance_item_id'],
        date_performed=date_performed,
        mileage=mileage,
        notes=data.get('notes'),
        receipt_photo=receipt_photo
    )

    db.session.add(log)

    # Update vehicle mileage if provided and higher than current
    if log.mileage:
        vehicle = Vehicle.query.get(item.vehicle_id)
        if vehicle and log.mileage > vehicle.current_mileage:
            vehicle.current_mileage = log.mileage

    db.session.commit()

    return jsonify(log.to_dict()), 201

@bp.route('/<int:log_id>', methods=['DELETE'])
def delete_maintenance_log(log_id):
    log = MaintenanceLog.query.get_or_404(log_id)

    # Delete associated file if exists
    if log.receipt_photo:
        filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], log.receipt_photo)
        if os.path.exists(filepath):
            os.remove(filepath)

    db.session.delete(log)
    db.session.commit()

    return '', 204
