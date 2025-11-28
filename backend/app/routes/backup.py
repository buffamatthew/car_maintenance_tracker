from flask import Blueprint, request, jsonify, send_file
from app import db
from app.models import Vehicle, MaintenanceItem, MaintenanceLog, GeneralMaintenance, Attachment
from datetime import datetime
import json
import io

bp = Blueprint('backup', __name__, url_prefix='/api/backup')

@bp.route('/export', methods=['GET'])
def export_data():
    """Export all data as JSON"""
    try:
        # Get all vehicles with related data
        vehicles = Vehicle.query.all()

        export_data = {
            'export_date': datetime.utcnow().isoformat(),
            'version': '1.0',
            'vehicles': []
        }

        for vehicle in vehicles:
            vehicle_data = vehicle.to_dict()

            # Get maintenance items for this vehicle
            maintenance_items = MaintenanceItem.query.filter_by(vehicle_id=vehicle.id).all()
            vehicle_data['maintenance_items'] = []

            for item in maintenance_items:
                item_data = item.to_dict()

                # Get logs for this maintenance item
                logs = MaintenanceLog.query.filter_by(maintenance_item_id=item.id).all()
                item_data['logs'] = []

                for log in logs:
                    log_data = log.to_dict()
                    # Include attachment metadata (but not the actual files)
                    log_data['attachments'] = [att.to_dict() for att in log.attachments]
                    item_data['logs'].append(log_data)

                vehicle_data['maintenance_items'].append(item_data)

            # Get general maintenance for this vehicle
            general_maintenance = GeneralMaintenance.query.filter_by(vehicle_id=vehicle.id).all()
            vehicle_data['general_maintenance'] = []

            for gm in general_maintenance:
                gm_data = gm.to_dict()
                # Include attachment metadata
                gm_data['attachments'] = [att.to_dict() for att in gm.attachments]
                vehicle_data['general_maintenance'].append(gm_data)

            export_data['vehicles'].append(vehicle_data)

        # Create JSON file in memory
        json_str = json.dumps(export_data, indent=2)
        json_bytes = io.BytesIO(json_str.encode('utf-8'))

        # Generate filename with timestamp
        filename = f"car_maintenance_backup_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"

        return send_file(
            json_bytes,
            mimetype='application/json',
            as_attachment=True,
            download_name=filename
        )

    except Exception as e:
        return jsonify({'error': f'Failed to export data: {str(e)}'}), 500

@bp.route('/import', methods=['POST'])
def import_data():
    """Import data from JSON backup file"""
    try:
        # Check if file was uploaded
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']

        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        if not file.filename.endswith('.json'):
            return jsonify({'error': 'File must be a JSON file'}), 400

        # Parse JSON
        try:
            data = json.load(file)
        except json.JSONDecodeError:
            return jsonify({'error': 'Invalid JSON file'}), 400

        # Validate basic structure
        if 'vehicles' not in data:
            return jsonify({'error': 'Invalid backup file format'}), 400

        # Get import mode
        mode = request.form.get('mode', 'merge')  # 'merge' or 'replace'

        if mode == 'replace':
            # Clear existing data
            Attachment.query.delete()
            MaintenanceLog.query.delete()
            GeneralMaintenance.query.delete()
            MaintenanceItem.query.delete()
            Vehicle.query.delete()
            db.session.commit()

        imported_counts = {
            'vehicles': 0,
            'maintenance_items': 0,
            'maintenance_logs': 0,
            'general_maintenance': 0
        }

        # Import vehicles
        for vehicle_data in data['vehicles']:
            # Create vehicle (without id to let DB auto-generate)
            vehicle = Vehicle(
                year=vehicle_data['year'],
                make=vehicle_data['make'],
                model=vehicle_data['model'],
                engine_type=vehicle_data.get('engine_type'),
                current_mileage=vehicle_data['current_mileage']
            )
            db.session.add(vehicle)
            db.session.flush()  # Get the new vehicle ID
            imported_counts['vehicles'] += 1

            # Import maintenance items
            for item_data in vehicle_data.get('maintenance_items', []):
                item = MaintenanceItem(
                    vehicle_id=vehicle.id,
                    name=item_data['name'],
                    maintenance_type=item_data['maintenance_type'],
                    frequency_value=item_data['frequency_value'],
                    frequency_unit=item_data.get('frequency_unit'),
                    notes=item_data.get('notes')
                )
                db.session.add(item)
                db.session.flush()  # Get the new item ID
                imported_counts['maintenance_items'] += 1

                # Import logs
                for log_data in item_data.get('logs', []):
                    log = MaintenanceLog(
                        maintenance_item_id=item.id,
                        date_performed=datetime.fromisoformat(log_data['date_performed']),
                        mileage=log_data.get('mileage'),
                        cost=log_data.get('cost'),
                        notes=log_data.get('notes')
                    )
                    db.session.add(log)
                    db.session.flush()
                    imported_counts['maintenance_logs'] += 1

                    # Note: Attachments are metadata only - actual files won't be restored
                    # This is intentional as file paths would be invalid

            # Import general maintenance
            for gm_data in vehicle_data.get('general_maintenance', []):
                gm = GeneralMaintenance(
                    vehicle_id=vehicle.id,
                    description=gm_data['description'],
                    date_performed=datetime.fromisoformat(gm_data['date_performed']),
                    mileage=gm_data.get('mileage'),
                    cost=gm_data.get('cost'),
                    notes=gm_data.get('notes')
                )
                db.session.add(gm)
                imported_counts['general_maintenance'] += 1

        db.session.commit()

        return jsonify({
            'message': 'Data imported successfully',
            'counts': imported_counts,
            'note': 'Attachment files were not restored - only metadata. Please re-upload attachments if needed.'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to import data: {str(e)}'}), 500
