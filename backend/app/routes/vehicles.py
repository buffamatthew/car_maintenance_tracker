from flask import Blueprint, request, jsonify
from app import db
from app.models import Vehicle

bp = Blueprint('vehicles', __name__, url_prefix='/api/vehicles')

@bp.route('', methods=['GET'])
def get_vehicles():
    vehicles = Vehicle.query.all()
    return jsonify([v.to_dict() for v in vehicles])

@bp.route('/<int:vehicle_id>', methods=['GET'])
def get_vehicle(vehicle_id):
    vehicle = Vehicle.query.get_or_404(vehicle_id)
    return jsonify(vehicle.to_dict())

@bp.route('', methods=['POST'])
def create_vehicle():
    data = request.get_json()

    vehicle = Vehicle(
        year=data['year'],
        make=data['make'],
        model=data['model'],
        engine_type=data.get('engine_type'),
        current_mileage=data.get('current_mileage', 0)
    )

    db.session.add(vehicle)
    db.session.commit()

    return jsonify(vehicle.to_dict()), 201

@bp.route('/<int:vehicle_id>', methods=['PUT'])
def update_vehicle(vehicle_id):
    vehicle = Vehicle.query.get_or_404(vehicle_id)
    data = request.get_json()

    vehicle.year = data.get('year', vehicle.year)
    vehicle.make = data.get('make', vehicle.make)
    vehicle.model = data.get('model', vehicle.model)
    vehicle.engine_type = data.get('engine_type', vehicle.engine_type)
    vehicle.current_mileage = data.get('current_mileage', vehicle.current_mileage)

    db.session.commit()

    return jsonify(vehicle.to_dict())

@bp.route('/<int:vehicle_id>', methods=['DELETE'])
def delete_vehicle(vehicle_id):
    vehicle = Vehicle.query.get_or_404(vehicle_id)
    db.session.delete(vehicle)
    db.session.commit()

    return '', 204
