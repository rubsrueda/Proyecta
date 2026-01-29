# Proyecta - Sistema de Gestión Integral de Actividades

Sistema de gestión integral de actividades con origen en tickets de soporte. Este sistema permite crear y gestionar tickets de soporte y las actividades relacionadas que se derivan de ellos.

## Características

- **Gestión de Tickets**: Crear, leer, actualizar y eliminar tickets de soporte
- **Gestión de Actividades**: Crear y gestionar actividades vinculadas a tickets
- **Estados y Prioridades**: Sistema de estados y prioridades para tickets y actividades
- **API RESTful**: API completa para integración con otros sistemas
- **Estadísticas**: Reportes y estadísticas de tickets y actividades

## Tecnologías

- **Backend**: Python 3.12 + Flask
- **Base de Datos**: SQLite (configurable para PostgreSQL/MySQL)
- **ORM**: SQLAlchemy
- **Testing**: pytest

## Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/rubsrueda/Proyecta.git
cd Proyecta
```

2. Crear entorno virtual e instalar dependencias:
```bash
python3 -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. Inicializar la base de datos:
```bash
flask --app run init-db
```

4. (Opcional) Poblar con datos de ejemplo:
```bash
flask --app run seed-db
```

## Uso

### Iniciar el servidor

```bash
python run.py
```

El servidor estará disponible en `http://localhost:5000`

### Endpoints de la API

#### Tickets

- `GET /api/tickets` - Listar todos los tickets
  - Parámetros opcionales: `status`, `prioridad`, `asignado_a`
- `GET /api/tickets/<id>` - Obtener un ticket específico
- `POST /api/tickets` - Crear un nuevo ticket
- `PUT /api/tickets/<id>` - Actualizar un ticket
- `DELETE /api/tickets/<id>` - Eliminar un ticket
- `GET /api/tickets/stats` - Obtener estadísticas de tickets

#### Actividades

- `GET /api/activities` - Listar todas las actividades
  - Parámetros opcionales: `ticket_id`, `status`, `asignado_a`
- `GET /api/activities/<id>` - Obtener una actividad específica
- `POST /api/activities` - Crear una nueva actividad
- `PUT /api/activities/<id>` - Actualizar una actividad
- `DELETE /api/activities/<id>` - Eliminar una actividad
- `GET /api/activities/stats` - Obtener estadísticas de actividades

## Modelos de Datos

### Ticket

```json
{
  "id": 1,
  "titulo": "Error en autenticación",
  "descripcion": "Los usuarios no pueden iniciar sesión",
  "status": "nuevo|en_progreso|en_espera|resuelto|cerrado",
  "prioridad": "baja|media|alta|urgente",
  "solicitante": "Juan Pérez",
  "asignado_a": "María García",
  "fecha_creacion": "2026-01-29T00:00:00",
  "fecha_actualizacion": "2026-01-29T00:00:00",
  "fecha_resolucion": null,
  "num_actividades": 2
}
```

### Actividad

```json
{
  "id": 1,
  "ticket_id": 1,
  "titulo": "Investigar causa del error",
  "descripcion": "Revisar logs del servidor",
  "status": "pendiente|en_progreso|completada|cancelada",
  "asignado_a": "María García",
  "fecha_creacion": "2026-01-29T00:00:00",
  "fecha_inicio": null,
  "fecha_fin": null,
  "horas_estimadas": 2.0,
  "horas_reales": null,
  "notas": "Notas adicionales"
}
```

## Ejemplos de Uso

### Crear un Ticket

```bash
curl -X POST http://localhost:5000/api/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Error en el sistema",
    "descripcion": "Descripción detallada del error",
    "solicitante": "Juan Pérez",
    "prioridad": "alta"
  }'
```

### Crear una Actividad

```bash
curl -X POST http://localhost:5000/api/activities \
  -H "Content-Type: application/json" \
  -d '{
    "ticket_id": 1,
    "titulo": "Investigar el error",
    "descripcion": "Revisar logs y base de datos",
    "horas_estimadas": 3.0
  }'
```

### Actualizar Status de un Ticket

```bash
curl -X PUT http://localhost:5000/api/tickets/1 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "en_progreso",
    "asignado_a": "María García"
  }'
```

## Testing

Ejecutar las pruebas:

```bash
pip install pytest
pytest
```

Ejecutar con cobertura:

```bash
pip install pytest-cov
pytest --cov=app tests/
```

## Estructura del Proyecto

```
Proyecta/
├── app/
│   ├── __init__.py          # Inicialización de Flask
│   ├── models.py            # Modelos de datos
│   └── routes/
│       ├── tickets.py       # Rutas de tickets
│       └── activities.py    # Rutas de actividades
├── tests/
│   ├── conftest.py          # Configuración de tests
│   ├── test_tickets.py      # Tests de tickets
│   └── test_activities.py   # Tests de actividades
├── config.py                # Configuración de la aplicación
├── run.py                   # Punto de entrada
├── requirements.txt         # Dependencias
└── README.md               # Este archivo
```

## Contribuir

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## Licencia

Este proyecto está bajo licencia MIT.

## Autor

rubsrueda - [rueda.castillo@gmail.com](mailto:rueda.castillo@gmail.com)