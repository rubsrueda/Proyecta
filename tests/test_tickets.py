"""Tests for ticket operations."""
import pytest
from app.models import Ticket

def test_create_ticket(client):
    """Test creating a new ticket."""
    response = client.post('/api/tickets', json={
        'titulo': 'Test Ticket',
        'descripcion': 'Test Description',
        'solicitante': 'Test User',
        'prioridad': 'alta'
    })
    assert response.status_code == 201
    data = response.get_json()
    assert data['titulo'] == 'Test Ticket'
    assert data['descripcion'] == 'Test Description'
    assert data['solicitante'] == 'Test User'
    assert data['prioridad'] == 'alta'
    assert data['status'] == 'nuevo'

def test_get_tickets(client):
    """Test getting all tickets."""
    # Create test tickets
    client.post('/api/tickets', json={
        'titulo': 'Ticket 1',
        'descripcion': 'Description 1',
        'solicitante': 'User 1'
    })
    client.post('/api/tickets', json={
        'titulo': 'Ticket 2',
        'descripcion': 'Description 2',
        'solicitante': 'User 2'
    })
    
    response = client.get('/api/tickets')
    assert response.status_code == 200
    data = response.get_json()
    assert len(data) == 2

def test_get_ticket(client):
    """Test getting a specific ticket."""
    # Create a test ticket
    create_response = client.post('/api/tickets', json={
        'titulo': 'Test Ticket',
        'descripcion': 'Test Description',
        'solicitante': 'Test User'
    })
    ticket_id = create_response.get_json()['id']
    
    response = client.get(f'/api/tickets/{ticket_id}')
    assert response.status_code == 200
    data = response.get_json()
    assert data['titulo'] == 'Test Ticket'

def test_update_ticket(client):
    """Test updating a ticket."""
    # Create a test ticket
    create_response = client.post('/api/tickets', json={
        'titulo': 'Original Title',
        'descripcion': 'Original Description',
        'solicitante': 'Test User'
    })
    ticket_id = create_response.get_json()['id']
    
    # Update the ticket
    response = client.put(f'/api/tickets/{ticket_id}', json={
        'titulo': 'Updated Title',
        'status': 'en_progreso'
    })
    assert response.status_code == 200
    data = response.get_json()
    assert data['titulo'] == 'Updated Title'
    assert data['status'] == 'en_progreso'

def test_delete_ticket(client):
    """Test deleting a ticket."""
    # Create a test ticket
    create_response = client.post('/api/tickets', json={
        'titulo': 'Test Ticket',
        'descripcion': 'Test Description',
        'solicitante': 'Test User'
    })
    ticket_id = create_response.get_json()['id']
    
    # Delete the ticket
    response = client.delete(f'/api/tickets/{ticket_id}')
    assert response.status_code == 204
    
    # Verify ticket is deleted
    get_response = client.get(f'/api/tickets/{ticket_id}')
    assert get_response.status_code == 404

def test_ticket_stats(client):
    """Test ticket statistics."""
    # Create test tickets with different statuses
    client.post('/api/tickets', json={
        'titulo': 'Ticket 1',
        'descripcion': 'Description 1',
        'solicitante': 'User 1',
        'prioridad': 'alta'
    })
    client.post('/api/tickets', json={
        'titulo': 'Ticket 2',
        'descripcion': 'Description 2',
        'solicitante': 'User 2',
        'prioridad': 'media'
    })
    
    response = client.get('/api/tickets/stats')
    assert response.status_code == 200
    data = response.get_json()
    assert data['total'] == 2
    assert 'por_status' in data
    assert 'por_prioridad' in data
