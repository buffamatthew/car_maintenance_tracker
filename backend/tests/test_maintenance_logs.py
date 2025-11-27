import json
import pytest
from datetime import date


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


@pytest.fixture
def sample_maintenance_item(client, sample_vehicle):
    """Create a sample maintenance item for testing"""
    item_data = {
        'vehicle_id': sample_vehicle['id'],
        'name': 'Oil Change',
        'maintenance_type': 'mileage',
        'frequency_value': 5000,
        'frequency_unit': 'miles'
    }

    response = client.post('/api/maintenance-items',
                          data=json.dumps(item_data),
                          content_type='application/json')
    return response.json


def test_create_maintenance_log(client, sample_maintenance_item, sample_vehicle):
    """Test creating a maintenance log"""
    log_data = {
        'maintenance_item_id': sample_maintenance_item['id'],
        'date_performed': date.today().isoformat(),
        'mileage': 30000,
        'notes': 'Changed oil and filter'
    }

    response = client.post('/api/maintenance-logs',
                          data=json.dumps(log_data),
                          content_type='application/json')

    assert response.status_code == 201
    data = response.json
    assert data['maintenance_item_id'] == sample_maintenance_item['id']
    assert data['mileage'] == 30000
    assert data['notes'] == 'Changed oil and filter'


def test_vehicle_mileage_update(client, sample_maintenance_item, sample_vehicle):
    """Test that vehicle mileage updates when logging maintenance"""
    log_data = {
        'maintenance_item_id': sample_maintenance_item['id'],
        'date_performed': date.today().isoformat(),
        'mileage': 35000,
        'notes': 'Oil change'
    }

    # Create log with higher mileage
    client.post('/api/maintenance-logs',
               data=json.dumps(log_data),
               content_type='application/json')

    # Check that vehicle mileage was updated
    vehicle_response = client.get(f'/api/vehicles/{sample_vehicle["id"]}')
    vehicle = vehicle_response.json
    assert vehicle['current_mileage'] == 35000


def test_get_maintenance_logs(client, sample_maintenance_item):
    """Test getting maintenance logs for an item"""
    # Create two logs
    log1_data = {
        'maintenance_item_id': sample_maintenance_item['id'],
        'date_performed': '2024-01-15',
        'mileage': 30000
    }

    log2_data = {
        'maintenance_item_id': sample_maintenance_item['id'],
        'date_performed': '2024-06-15',
        'mileage': 35000
    }

    client.post('/api/maintenance-logs',
               data=json.dumps(log1_data),
               content_type='application/json')

    client.post('/api/maintenance-logs',
               data=json.dumps(log2_data),
               content_type='application/json')

    # Get logs for this item
    response = client.get(f'/api/maintenance-logs?maintenance_item_id={sample_maintenance_item["id"]}')
    assert response.status_code == 200
    data = response.json
    assert len(data) == 2


def test_delete_maintenance_log(client, sample_maintenance_item):
    """Test deleting a maintenance log"""
    log_data = {
        'maintenance_item_id': sample_maintenance_item['id'],
        'date_performed': date.today().isoformat(),
        'mileage': 30000
    }

    create_response = client.post('/api/maintenance-logs',
                                  data=json.dumps(log_data),
                                  content_type='application/json')
    log_id = create_response.json['id']

    # Delete log
    response = client.delete(f'/api/maintenance-logs/{log_id}')
    assert response.status_code == 204

    # Verify deleted
    get_response = client.get(f'/api/maintenance-logs/{log_id}')
    assert get_response.status_code == 404
