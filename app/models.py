"""Database models for Proyecta."""
from app import db
from datetime import datetime
from enum import Enum as PyEnum

class TicketStatus(PyEnum):
    """Ticket status enumeration."""
    NUEVO = "nuevo"
    EN_PROGRESO = "en_progreso"
    EN_ESPERA = "en_espera"
    RESUELTO = "resuelto"
    CERRADO = "cerrado"

class TicketPriority(PyEnum):
    """Ticket priority enumeration."""
    BAJA = "baja"
    MEDIA = "media"
    ALTA = "alta"
    URGENTE = "urgente"

class ActivityStatus(PyEnum):
    """Activity status enumeration."""
    PENDIENTE = "pendiente"
    EN_PROGRESO = "en_progreso"
    COMPLETADA = "completada"
    CANCELADA = "cancelada"

class Ticket(db.Model):
    """Ticket model representing support tickets."""
    __tablename__ = 'tickets'
    
    id = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(200), nullable=False)
    descripcion = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(50), default=TicketStatus.NUEVO.value)
    prioridad = db.Column(db.String(50), default=TicketPriority.MEDIA.value)
    solicitante = db.Column(db.String(100), nullable=False)
    asignado_a = db.Column(db.String(100))
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)
    fecha_actualizacion = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    fecha_resolucion = db.Column(db.DateTime)
    
    # Relationship with activities
    actividades = db.relationship('Activity', backref='ticket', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        """Convert ticket to dictionary."""
        return {
            'id': self.id,
            'titulo': self.titulo,
            'descripcion': self.descripcion,
            'status': self.status,
            'prioridad': self.prioridad,
            'solicitante': self.solicitante,
            'asignado_a': self.asignado_a,
            'fecha_creacion': self.fecha_creacion.isoformat() if self.fecha_creacion else None,
            'fecha_actualizacion': self.fecha_actualizacion.isoformat() if self.fecha_actualizacion else None,
            'fecha_resolucion': self.fecha_resolucion.isoformat() if self.fecha_resolucion else None,
            'num_actividades': len(self.actividades)
        }

class Activity(db.Model):
    """Activity model representing activities originating from tickets."""
    __tablename__ = 'activities'
    
    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey('tickets.id'), nullable=False)
    titulo = db.Column(db.String(200), nullable=False)
    descripcion = db.Column(db.Text)
    status = db.Column(db.String(50), default=ActivityStatus.PENDIENTE.value)
    asignado_a = db.Column(db.String(100))
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)
    fecha_inicio = db.Column(db.DateTime)
    fecha_fin = db.Column(db.DateTime)
    horas_estimadas = db.Column(db.Float)
    horas_reales = db.Column(db.Float)
    notas = db.Column(db.Text)
    
    def to_dict(self):
        """Convert activity to dictionary."""
        return {
            'id': self.id,
            'ticket_id': self.ticket_id,
            'titulo': self.titulo,
            'descripcion': self.descripcion,
            'status': self.status,
            'asignado_a': self.asignado_a,
            'fecha_creacion': self.fecha_creacion.isoformat() if self.fecha_creacion else None,
            'fecha_inicio': self.fecha_inicio.isoformat() if self.fecha_inicio else None,
            'fecha_fin': self.fecha_fin.isoformat() if self.fecha_fin else None,
            'horas_estimadas': self.horas_estimadas,
            'horas_reales': self.horas_reales,
            'notas': self.notas
        }
