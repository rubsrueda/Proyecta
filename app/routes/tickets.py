"""Ticket routes for Proyecta API."""
from flask import Blueprint, request, jsonify
from app import db
from app.models import Ticket, TicketStatus
from datetime import datetime

bp = Blueprint('tickets', __name__, url_prefix='/api/tickets')

@bp.route('', methods=['GET'])
def get_tickets():
    """Get all tickets with optional filtering."""
    status = request.args.get('status')
    prioridad = request.args.get('prioridad')
    asignado_a = request.args.get('asignado_a')
    
    query = Ticket.query
    
    if status:
        query = query.filter_by(status=status)
    if prioridad:
        query = query.filter_by(prioridad=prioridad)
    if asignado_a:
        query = query.filter_by(asignado_a=asignado_a)
    
    tickets = query.order_by(Ticket.fecha_creacion.desc()).all()
    return jsonify([ticket.to_dict() for ticket in tickets])

@bp.route('/<int:ticket_id>', methods=['GET'])
def get_ticket(ticket_id):
    """Get a specific ticket by ID."""
    ticket = Ticket.query.get_or_404(ticket_id)
    result = ticket.to_dict()
    result['actividades'] = [activity.to_dict() for activity in ticket.actividades]
    return jsonify(result)

@bp.route('', methods=['POST'])
def create_ticket():
    """Create a new ticket."""
    data = request.get_json()
    
    if not data or 'titulo' not in data or 'descripcion' not in data or 'solicitante' not in data:
        return jsonify({'error': 'Se requieren titulo, descripcion y solicitante'}), 400
    
    ticket = Ticket(
        titulo=data['titulo'],
        descripcion=data['descripcion'],
        solicitante=data['solicitante'],
        prioridad=data.get('prioridad', 'media'),
        asignado_a=data.get('asignado_a')
    )
    
    db.session.add(ticket)
    db.session.commit()
    
    return jsonify(ticket.to_dict()), 201

@bp.route('/<int:ticket_id>', methods=['PUT'])
def update_ticket(ticket_id):
    """Update an existing ticket."""
    ticket = Ticket.query.get_or_404(ticket_id)
    data = request.get_json()
    
    if 'titulo' in data:
        ticket.titulo = data['titulo']
    if 'descripcion' in data:
        ticket.descripcion = data['descripcion']
    if 'status' in data:
        ticket.status = data['status']
        if data['status'] in [TicketStatus.RESUELTO.value, TicketStatus.CERRADO.value]:
            if not ticket.fecha_resolucion:
                ticket.fecha_resolucion = datetime.utcnow()
    if 'prioridad' in data:
        ticket.prioridad = data['prioridad']
    if 'asignado_a' in data:
        ticket.asignado_a = data['asignado_a']
    
    db.session.commit()
    return jsonify(ticket.to_dict())

@bp.route('/<int:ticket_id>', methods=['DELETE'])
def delete_ticket(ticket_id):
    """Delete a ticket."""
    ticket = Ticket.query.get_or_404(ticket_id)
    db.session.delete(ticket)
    db.session.commit()
    return '', 204

@bp.route('/stats', methods=['GET'])
def get_stats():
    """Get ticket statistics."""
    total = Ticket.query.count()
    por_status = {}
    for status in ['nuevo', 'en_progreso', 'en_espera', 'resuelto', 'cerrado']:
        por_status[status] = Ticket.query.filter_by(status=status).count()
    
    por_prioridad = {}
    for prioridad in ['baja', 'media', 'alta', 'urgente']:
        por_prioridad[prioridad] = Ticket.query.filter_by(prioridad=prioridad).count()
    
    return jsonify({
        'total': total,
        'por_status': por_status,
        'por_prioridad': por_prioridad
    })
