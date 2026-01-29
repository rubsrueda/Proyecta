"""Activity routes for Proyecta API."""
from flask import Blueprint, request, jsonify
from app import db
from app.models import Activity, Ticket, ActivityStatus
from datetime import datetime

bp = Blueprint('activities', __name__, url_prefix='/api/activities')

@bp.route('', methods=['GET'])
def get_activities():
    """Get all activities with optional filtering."""
    ticket_id = request.args.get('ticket_id', type=int)
    status = request.args.get('status')
    asignado_a = request.args.get('asignado_a')
    
    query = Activity.query
    
    if ticket_id:
        query = query.filter_by(ticket_id=ticket_id)
    if status:
        query = query.filter_by(status=status)
    if asignado_a:
        query = query.filter_by(asignado_a=asignado_a)
    
    activities = query.order_by(Activity.fecha_creacion.desc()).all()
    return jsonify([activity.to_dict() for activity in activities])

@bp.route('/<int:activity_id>', methods=['GET'])
def get_activity(activity_id):
    """Get a specific activity by ID."""
    activity = Activity.query.get_or_404(activity_id)
    return jsonify(activity.to_dict())

@bp.route('', methods=['POST'])
def create_activity():
    """Create a new activity linked to a ticket."""
    data = request.get_json()
    
    if not data or 'ticket_id' not in data or 'titulo' not in data:
        return jsonify({'error': 'Se requieren ticket_id y titulo'}), 400
    
    # Verify ticket exists
    ticket = Ticket.query.get_or_404(data['ticket_id'])
    
    activity = Activity(
        ticket_id=data['ticket_id'],
        titulo=data['titulo'],
        descripcion=data.get('descripcion'),
        asignado_a=data.get('asignado_a'),
        horas_estimadas=data.get('horas_estimadas')
    )
    
    db.session.add(activity)
    db.session.commit()
    
    return jsonify(activity.to_dict()), 201

@bp.route('/<int:activity_id>', methods=['PUT'])
def update_activity(activity_id):
    """Update an existing activity."""
    activity = Activity.query.get_or_404(activity_id)
    data = request.get_json()
    
    if 'titulo' in data:
        activity.titulo = data['titulo']
    if 'descripcion' in data:
        activity.descripcion = data['descripcion']
    if 'status' in data:
        activity.status = data['status']
        if data['status'] == ActivityStatus.EN_PROGRESO.value and not activity.fecha_inicio:
            activity.fecha_inicio = datetime.utcnow()
        elif data['status'] == ActivityStatus.COMPLETADA.value and not activity.fecha_fin:
            activity.fecha_fin = datetime.utcnow()
    if 'asignado_a' in data:
        activity.asignado_a = data['asignado_a']
    if 'horas_estimadas' in data:
        activity.horas_estimadas = data['horas_estimadas']
    if 'horas_reales' in data:
        activity.horas_reales = data['horas_reales']
    if 'notas' in data:
        activity.notas = data['notas']
    
    db.session.commit()
    return jsonify(activity.to_dict())

@bp.route('/<int:activity_id>', methods=['DELETE'])
def delete_activity(activity_id):
    """Delete an activity."""
    activity = Activity.query.get_or_404(activity_id)
    db.session.delete(activity)
    db.session.commit()
    return '', 204

@bp.route('/stats', methods=['GET'])
def get_stats():
    """Get activity statistics."""
    total = Activity.query.count()
    por_status = {}
    for status in ['pendiente', 'en_progreso', 'completada', 'cancelada']:
        por_status[status] = Activity.query.filter_by(status=status).count()
    
    return jsonify({
        'total': total,
        'por_status': por_status
    })
