import json
import pytest


@pytest.fixture
def sample_vehicle(client):
    """Create a sample vehicle for testing"""
    vehicle_data = {
        'year': 2020,
        'make': 'Toyota',
        'model': 'Camry',
        'current_mileage': 25000
    }

    response = client.post('/api/vehicles',
                          data=json.dumps(vehicle_data),
                          content_type='application/json')
    return response.json


def test_create_maintenance_item(client, sample_vehicle):
    """Test creating a maintenance item"""
    item_data = {
        'vehicle_id': sample_vehicle['id'],
        'name': 'Oil Change',
        'maintenance_type': 'mileage',
        'frequency_value': 5000,
        'frequency_unit': 'miles',
        'notes': 'Use synthetic oil'
    }

    response = client.post('/api/maintenance-items',
                          data=json.dumps(item_data),
                          content_type='application/json')

    assert response.status_code == 201
    data = response.json
    assert data['name'] == 'Oil Change'
    assert data['maintenance_type'] == 'mileage'
    assert data['frequency_value'] == 5000
    assert data['vehicle_id'] == sample_vehicle['id']


def test_get_maintenance_items_by_vehicle(client, sample_vehicle):
    """Test getting maintenance items for a specific vehicle"""
    # Create two maintenance items
    item1_data = {
        'vehicle_id': sample_vehicle['id'],
        'name': 'Oil Change',
        'maintenance_type': 'mileage',
        'frequency_value': 5000,
        'frequency_unit': 'miles'
    }

    item2_data = {
        'vehicle_id': sample_vehicle['id'],
        'name': 'Tire Rotation',
        'maintenance_type': 'mileage',
        'frequency_value': 10000,
        'frequency_unit': 'miles'
    }

    client.post('/api/maintenance-items',
               data=json.dumps(item1_data),
               content_type='application/json')

    client.post('/api/maintenance-items',
               data=json.dumps(item2_data),
               content_type='application/json')

    # Get items for this vehicle
    response = client.get(f'/api/maintenance-items?vehicle_id={sample_vehicle["id"]}')
    assert response.status_code == 200
    data = response.json
    assert len(data) == 2
    assert any(item['name'] == 'Oil Change' for item in data)
    assert any(item['name'] == 'Tire Rotation' for item in data)


def test_update_maintenance_item(client, sample_vehicle):
    """Test updating a maintenance item"""
    # Create item
    item_data = {
        'vehicle_id': sample_vehicle['id'],
        'name': 'Air Filter',
        'maintenance_type': 'mileage',
        'frequency_value': 15000,
        'frequency_unit': 'miles'
    }

    create_response = client.post('/api/maintenance-items',
                                  data=json.dumps(item_data),
                                  content_type='application/json')
    item_id = create_response.json['id']

    # Update item
    update_data = {
        'frequency_value': 20000,
        'notes': 'Updated frequency'
    }

    response = client.put(f'/api/maintenance-items/{item_id}',
                         data=json.dumps(update_data),
                         content_type='application/json')

    assert response.status_code == 200
    data = response.json
    assert data['frequency_value'] == 20000
    assert data['notes'] == 'Updated frequency'


def test_delete_maintenance_item(client, sample_vehicle):
    """Test deleting a maintenance item"""
    # Create item
    item_data = {
        'vehicle_id': sample_vehicle['id'],
        'name': 'Brake Pads',
        'maintenance_type': 'mileage',
        'frequency_value': 30000,
        'frequency_unit': 'miles'
    }

    create_response = client.post('/api/maintenance-items',
                                  data=json.dumps(item_data),
                                  content_type='application/json')
    item_id = create_response.json['id']

    # Delete item
    response = client.delete(f'/api/maintenance-items/{item_id}')
    assert response.status_code == 204

    # Verify deleted
    get_response = client.get(f'/api/maintenance-items/{item_id}')
    assert get_response.status_code == 404


def test_create_time_based_maintenance(client, sample_vehicle):
    """Test creating a time-based maintenance item"""
    item_data = {
        'vehicle_id': sample_vehicle['id'],
        'name': 'Battery Replacement',
        'maintenance_type': 'time',
        'frequency_value': 3,
        'frequency_unit': 'years',
        'notes': 'Group Size 48 H6'
    }

    response = client.post('/api/maintenance-items',
                          data=json.dumps(item_data),
                          content_type='application/json')

    assert response.status_code == 201
    data = response.json
    assert data['maintenance_type'] == 'time'
    assert data['frequency_unit'] == 'years'
