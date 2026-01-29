"""Tests for activity operations."""
import pytest
from app.models import Activity

def test_create_activity(client):
    """Test creating a new activity."""
    # First create a ticket
    ticket_response = client.post('/api/tickets', json={
        'titulo': 'Test Ticket',
        'descripcion': 'Test Description',
        'solicitante': 'Test User'
    })
    ticket_id = ticket_response.get_json()['id']
    
    # Create activity
    response = client.post('/api/activities', json={
        'ticket_id': ticket_id,
        'titulo': 'Test Activity',
        'descripcion': 'Activity Description',
        'horas_estimadas': 5.0
    })
    assert response.status_code == 201
    data = response.get_json()
    assert data['titulo'] == 'Test Activity'
    assert data['ticket_id'] == ticket_id
    assert data['horas_estimadas'] == 5.0

def test_get_activities(client):
    """Test getting all activities."""
    # Create a ticket
    ticket_response = client.post('/api/tickets', json={
        'titulo': 'Test Ticket',
        'descripcion': 'Test Description',
        'solicitante': 'Test User'
    })
    ticket_id = ticket_response.get_json()['id']
    
    # Create activities
    client.post('/api/activities', json={
        'ticket_id': ticket_id,
        'titulo': 'Activity 1'
    })
    client.post('/api/activities', json={
        'ticket_id': ticket_id,
        'titulo': 'Activity 2'
    })
    
    response = client.get('/api/activities')
    assert response.status_code == 200
    data = response.get_json()
    assert len(data) == 2

def test_get_activity(client):
    """Test getting a specific activity."""
    # Create a ticket
    ticket_response = client.post('/api/tickets', json={
        'titulo': 'Test Ticket',
        'descripcion': 'Test Description',
        'solicitante': 'Test User'
    })
    ticket_id = ticket_response.get_json()['id']
    
    # Create activity
    create_response = client.post('/api/activities', json={
        'ticket_id': ticket_id,
        'titulo': 'Test Activity'
    })
    activity_id = create_response.get_json()['id']
    
    response = client.get(f'/api/activities/{activity_id}')
    assert response.status_code == 200
    data = response.get_json()
    assert data['titulo'] == 'Test Activity'

def test_update_activity(client):
    """Test updating an activity."""
    # Create a ticket
    ticket_response = client.post('/api/tickets', json={
        'titulo': 'Test Ticket',
        'descripcion': 'Test Description',
        'solicitante': 'Test User'
    })
    ticket_id = ticket_response.get_json()['id']
    
    # Create activity
    create_response = client.post('/api/activities', json={
        'ticket_id': ticket_id,
        'titulo': 'Original Activity'
    })
    activity_id = create_response.get_json()['id']
    
    # Update activity
    response = client.put(f'/api/activities/{activity_id}', json={
        'titulo': 'Updated Activity',
        'status': 'en_progreso',
        'horas_reales': 3.5
    })
    assert response.status_code == 200
    data = response.get_json()
    assert data['titulo'] == 'Updated Activity'
    assert data['status'] == 'en_progreso'
    assert data['horas_reales'] == 3.5

def test_delete_activity(client):
    """Test deleting an activity."""
    # Create a ticket
    ticket_response = client.post('/api/tickets', json={
        'titulo': 'Test Ticket',
        'descripcion': 'Test Description',
        'solicitante': 'Test User'
    })
    ticket_id = ticket_response.get_json()['id']
    
    # Create activity
    create_response = client.post('/api/activities', json={
        'ticket_id': ticket_id,
        'titulo': 'Test Activity'
    })
    activity_id = create_response.get_json()['id']
    
    # Delete activity
    response = client.delete(f'/api/activities/{activity_id}')
    assert response.status_code == 204
    
    # Verify activity is deleted
    get_response = client.get(f'/api/activities/{activity_id}')
    assert get_response.status_code == 404

def test_activity_stats(client):
    """Test activity statistics."""
    # Create a ticket
    ticket_response = client.post('/api/tickets', json={
        'titulo': 'Test Ticket',
        'descripcion': 'Test Description',
        'solicitante': 'Test User'
    })
    ticket_id = ticket_response.get_json()['id']
    
    # Create activities
    client.post('/api/activities', json={
        'ticket_id': ticket_id,
        'titulo': 'Activity 1'
    })
    client.post('/api/activities', json={
        'ticket_id': ticket_id,
        'titulo': 'Activity 2'
    })
    
    response = client.get('/api/activities/stats')
    assert response.status_code == 200
    data = response.get_json()
    assert data['total'] == 2
    assert 'por_status' in data

def test_ticket_with_activities(client):
    """Test that ticket shows related activities."""
    # Create a ticket
    ticket_response = client.post('/api/tickets', json={
        'titulo': 'Test Ticket',
        'descripcion': 'Test Description',
        'solicitante': 'Test User'
    })
    ticket_id = ticket_response.get_json()['id']
    
    # Create activities
    client.post('/api/activities', json={
        'ticket_id': ticket_id,
        'titulo': 'Activity 1'
    })
    client.post('/api/activities', json={
        'ticket_id': ticket_id,
        'titulo': 'Activity 2'
    })
    
    # Get ticket with activities
    response = client.get(f'/api/tickets/{ticket_id}')
    assert response.status_code == 200
    data = response.get_json()
    assert 'actividades' in data
    assert len(data['actividades']) == 2

def test_create_activity_with_empty_title(client):
    """Test creating an activity with empty title."""
    # Create a ticket
    ticket_response = client.post('/api/tickets', json={
        'titulo': 'Test Ticket',
        'descripcion': 'Test Description',
        'solicitante': 'Test User'
    })
    ticket_id = ticket_response.get_json()['id']
    
    # Try to create activity with empty title
    response = client.post('/api/activities', json={
        'ticket_id': ticket_id,
        'titulo': '  '
    })
    assert response.status_code == 400
    data = response.get_json()
    assert 'error' in data

def test_update_activity_with_invalid_status(client):
    """Test updating an activity with invalid status."""
    # Create a ticket
    ticket_response = client.post('/api/tickets', json={
        'titulo': 'Test Ticket',
        'descripcion': 'Test Description',
        'solicitante': 'Test User'
    })
    ticket_id = ticket_response.get_json()['id']
    
    # Create activity
    create_response = client.post('/api/activities', json={
        'ticket_id': ticket_id,
        'titulo': 'Test Activity'
    })
    activity_id = create_response.get_json()['id']
    
    # Try to update with invalid status
    response = client.put(f'/api/activities/{activity_id}', json={
        'status': 'invalid_status'
    })
    assert response.status_code == 400
    data = response.get_json()
    assert 'error' in data
    assert 'Status inválido' in data['error']
