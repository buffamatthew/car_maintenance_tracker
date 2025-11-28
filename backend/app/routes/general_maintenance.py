from flask import Blueprint, request, jsonify
from app import db
from app.models import GeneralMaintenance, Vehicle, Attachment
from datetime import datetime
from werkzeug.utils import secure_filename
import os

bp = Blueprint('general_maintenance', __name__, url_prefix='/api/general-maintenance')

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@bp.route('', methods=['GET'])
def get_all():
    """Get all general maintenance records, optionally filtered by vehicle_id"""
    vehicle_id = request.args.get('vehicle_id', type=int)

    if vehicle_id:
        records = GeneralMaintenance.query.filter_by(vehicle_id=vehicle_id).order_by(GeneralMaintenance.date_performed.desc()).all()
    else:
        records = GeneralMaintenance.query.order_by(GeneralMaintenance.date_performed.desc()).all()

    return jsonify([record.to_dict() for record in records]), 200

@bp.route('/<int:id>', methods=['GET'])
def get_one(id):
    """Get a specific general maintenance record"""
    record = GeneralMaintenance.query.get_or_404(id)
    return jsonify(record.to_dict()), 200

@bp.route('', methods=['POST'])
def create():
    """Create a new general maintenance record"""
    # Handle multipart form data
    if request.content_type and 'multipart/form-data' in request.content_type:
        data = request.form.to_dict()
        files = request.files.getlist('attachments')
    else:
        data = request.get_json()
        files = []

    # Validate required fields
    if not data.get('vehicle_id') or not data.get('description') or not data.get('date_performed'):
        return jsonify({'error': 'Missing required fields'}), 400

    # Verify vehicle exists
    vehicle = Vehicle.query.get(data['vehicle_id'])
    if not vehicle:
        return jsonify({'error': 'Vehicle not found'}), 404

    # Create general maintenance record
    record = GeneralMaintenance(
        vehicle_id=int(data['vehicle_id']),
        description=data['description'],
        date_performed=datetime.fromisoformat(data['date_performed']),
        mileage=int(data['mileage']) if data.get('mileage') else None,
        cost=float(data['cost']) if data.get('cost') else None,
        notes=data.get('notes')
    )

    db.session.add(record)
    db.session.flush()  # Get the record ID

    # Handle file attachments
    for file in files:
        if file and file.filename and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            # Add timestamp to avoid collisions
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            unique_filename = f"{timestamp}_{filename}"
            filepath = os.path.join(UPLOAD_FOLDER, unique_filename)
            file.save(filepath)

            # Create attachment record
            attachment = Attachment(
                filename=filename,
                file_path=filepath,
                file_type=file.content_type,
                file_size=os.path.getsize(filepath),
                general_maintenance_id=record.id
            )
            db.session.add(attachment)

    # Update vehicle mileage if this is higher
    if record.mileage and record.mileage > vehicle.current_mileage:
        vehicle.current_mileage = record.mileage

    db.session.commit()

    return jsonify(record.to_dict()), 201

@bp.route('/<int:id>', methods=['PUT'])
def update(id):
    """Update a general maintenance record"""
    record = GeneralMaintenance.query.get_or_404(id)

    # Handle multipart form data
    if request.content_type and 'multipart/form-data' in request.content_type:
        data = request.form.to_dict()
        files = request.files.getlist('attachments')
    else:
        data = request.get_json()
        files = []

    # Update fields
    if 'description' in data:
        record.description = data['description']
    if 'date_performed' in data:
        record.date_performed = datetime.fromisoformat(data['date_performed'])
    if 'mileage' in data:
        record.mileage = int(data['mileage']) if data['mileage'] else None
    if 'cost' in data:
        record.cost = float(data['cost']) if data['cost'] else None
    if 'notes' in data:
        record.notes = data.get('notes')

    # Handle new file attachments
    for file in files:
        if file and file.filename and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            unique_filename = f"{timestamp}_{filename}"
            filepath = os.path.join(UPLOAD_FOLDER, unique_filename)
            file.save(filepath)

            attachment = Attachment(
                filename=filename,
                file_path=filepath,
                file_type=file.content_type,
                file_size=os.path.getsize(filepath),
                general_maintenance_id=record.id
            )
            db.session.add(attachment)

    db.session.commit()

    return jsonify(record.to_dict()), 200

@bp.route('/<int:id>', methods=['DELETE'])
def delete(id):
    """Delete a general maintenance record"""
    record = GeneralMaintenance.query.get_or_404(id)

    # Delete associated files
    for attachment in record.attachments:
        if os.path.exists(attachment.file_path):
            os.remove(attachment.file_path)

    db.session.delete(record)
    db.session.commit()

    return '', 204

@bp.route('/attachments/<int:id>', methods=['DELETE'])
def delete_attachment(id):
    """Delete a specific attachment"""
    attachment = Attachment.query.get_or_404(id)

    # Delete the file
    if os.path.exists(attachment.file_path):
        os.remove(attachment.file_path)

    db.session.delete(attachment)
    db.session.commit()

    return '', 204
