"""Initialize Flask application."""
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from config import Config

db = SQLAlchemy()

def create_app(config_class=Config):
    """Create and configure the Flask application."""
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    db.init_app(app)
    CORS(app)
    
    # Register blueprints
    from app.routes import tickets, activities
    app.register_blueprint(tickets.bp)
    app.register_blueprint(activities.bp)
    
    return app
