import json
import pytest


def test_get_vehicles_empty(client):
    """Test getting vehicles when database is empty"""
    response = client.get('/api/vehicles')
    assert response.status_code == 200
    assert response.json == []


def test_create_vehicle(client):
    """Test creating a new vehicle"""
    vehicle_data = {
        'year': 2020,
        'make': 'Toyota',
        'model': 'Camry',
        'engine_type': '2.5L 4-cylinder',
        'current_mileage': 25000
    }

    response = client.post('/api/vehicles',
                          data=json.dumps(vehicle_data),
                          content_type='application/json')

    assert response.status_code == 201
    data = response.json
    assert data['year'] == 2020
    assert data['make'] == 'Toyota'
    assert data['model'] == 'Camry'
    assert data['engine_type'] == '2.5L 4-cylinder'
    assert data['current_mileage'] == 25000
    assert 'id' in data


def test_get_vehicle_by_id(client):
    """Test getting a specific vehicle by ID"""
    # Create a vehicle first
    vehicle_data = {
        'year': 2019,
        'make': 'Honda',
        'model': 'Civic',
        'current_mileage': 15000
    }

    create_response = client.post('/api/vehicles',
                                  data=json.dumps(vehicle_data),
                                  content_type='application/json')
    vehicle_id = create_response.json['id']

    # Get the vehicle
    response = client.get(f'/api/vehicles/{vehicle_id}')
    assert response.status_code == 200
    data = response.json
    assert data['id'] == vehicle_id
    assert data['make'] == 'Honda'
    assert data['model'] == 'Civic'


def test_update_vehicle(client):
    """Test updating a vehicle"""
    # Create a vehicle
    vehicle_data = {
        'year': 2018,
        'make': 'Ford',
        'model': 'F-150',
        'current_mileage': 50000
    }

    create_response = client.post('/api/vehicles',
                                  data=json.dumps(vehicle_data),
                                  content_type='application/json')
    vehicle_id = create_response.json['id']

    # Update the vehicle
    update_data = {
        'current_mileage': 55000
    }

    response = client.put(f'/api/vehicles/{vehicle_id}',
                         data=json.dumps(update_data),
                         content_type='application/json')

    assert response.status_code == 200
    data = response.json
    assert data['current_mileage'] == 55000
    assert data['make'] == 'Ford'  # Unchanged


def test_delete_vehicle(client):
    """Test deleting a vehicle"""
    # Create a vehicle
    vehicle_data = {
        'year': 2021,
        'make': 'Tesla',
        'model': 'Model 3',
        'current_mileage': 5000
    }

    create_response = client.post('/api/vehicles',
                                  data=json.dumps(vehicle_data),
                                  content_type='application/json')
    vehicle_id = create_response.json['id']

    # Delete the vehicle
    response = client.delete(f'/api/vehicles/{vehicle_id}')
    assert response.status_code == 204

    # Verify it's deleted
    get_response = client.get(f'/api/vehicles/{vehicle_id}')
    assert get_response.status_code == 404


def test_get_vehicle_not_found(client):
    """Test getting a non-existent vehicle"""
    response = client.get('/api/vehicles/999')
    assert response.status_code == 404
