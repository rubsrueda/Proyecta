"""Main application entry point."""
from app import create_app, db
from app.models import Ticket, Activity

app = create_app()

@app.route('/')
def index():
    """Root endpoint."""
    return {
        'message': 'Proyecta - Sistema de Gestión Integral de Actividades',
        'version': '1.0.0',
        'endpoints': {
            'tickets': '/api/tickets',
            'activities': '/api/activities',
            'ticket_stats': '/api/tickets/stats',
            'activity_stats': '/api/activities/stats'
        }
    }

@app.cli.command()
def init_db():
    """Initialize the database."""
    db.create_all()
    print('Database initialized.')

@app.cli.command()
def seed_db():
    """Seed the database with sample data."""
    # Create sample tickets
    ticket1 = Ticket(
        titulo='Error en el sistema de autenticación',
        descripcion='Los usuarios no pueden iniciar sesión con sus credenciales',
        solicitante='Juan Pérez',
        prioridad='alta',
        asignado_a='María García'
    )
    
    ticket2 = Ticket(
        titulo='Solicitud de nueva funcionalidad',
        descripcion='Implementar exportación de reportes a PDF',
        solicitante='Ana López',
        prioridad='media',
        asignado_a='Carlos Ruiz'
    )
    
    db.session.add(ticket1)
    db.session.add(ticket2)
    db.session.commit()
    
    # Create sample activities
    activity1 = Activity(
        ticket_id=ticket1.id,
        titulo='Investigar causa del error de autenticación',
        descripcion='Revisar logs del servidor y base de datos',
        asignado_a='María García',
        horas_estimadas=2.0
    )
    
    activity2 = Activity(
        ticket_id=ticket1.id,
        titulo='Implementar corrección',
        descripcion='Aplicar parche de seguridad al módulo de autenticación',
        asignado_a='María García',
        horas_estimadas=4.0
    )
    
    activity3 = Activity(
        ticket_id=ticket2.id,
        titulo='Diseñar plantilla PDF',
        descripcion='Crear diseño de reporte en formato PDF',
        asignado_a='Carlos Ruiz',
        horas_estimadas=3.0
    )
    
    db.session.add(activity1)
    db.session.add(activity2)
    db.session.add(activity3)
    db.session.commit()
    
    print('Database seeded with sample data.')

if __name__ == '__main__':
    app.run(debug=True)
