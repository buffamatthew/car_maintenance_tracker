from flask import Blueprint, request, jsonify, current_app
from app import db
from app.models import GeneralMaintenance, Vehicle, Attachment
from datetime import datetime
from werkzeug.utils import secure_filename
import os

bp = Blueprint('general_maintenance', __name__, url_prefix='/api/general-maintenance')

UPLOAD_FOLDER = 'uploads'

def allowed_file(filename, app):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

def validate_file_size(file, app):
    """Check if file size is within limit"""
    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)
    return size <= app.config['MAX_ATTACHMENT_SIZE']

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
    # Validate attachment count
    if len(files) > current_app.config['MAX_ATTACHMENTS_PER_LOG']:
        return jsonify({'error': f"Maximum {current_app.config['MAX_ATTACHMENTS_PER_LOG']} attachments allowed"}), 400

    for file in files:
        if file and file.filename and allowed_file(file.filename, current_app):
            # Validate file size
            if not validate_file_size(file, current_app):
                return jsonify({'error': f"File {file.filename} exceeds maximum size of {current_app.config['MAX_ATTACHMENT_SIZE'] / (1024*1024)}MB"}), 400

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
        elif file and file.filename:
            return jsonify({'error': f"File type not allowed for {file.filename}"}), 400

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
    # Validate total attachment count (existing + new)
    total_attachments = len(record.attachments) + len(files)
    if total_attachments > current_app.config['MAX_ATTACHMENTS_PER_LOG']:
        return jsonify({'error': f"Maximum {current_app.config['MAX_ATTACHMENTS_PER_LOG']} attachments allowed"}), 400

    for file in files:
        if file and file.filename and allowed_file(file.filename, current_app):
            # Validate file size
            if not validate_file_size(file, current_app):
                return jsonify({'error': f"File {file.filename} exceeds maximum size of {current_app.config['MAX_ATTACHMENT_SIZE'] / (1024*1024)}MB"}), 400

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
        elif file and file.filename:
            return jsonify({'error': f"File type not allowed for {file.filename}"}), 400

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
