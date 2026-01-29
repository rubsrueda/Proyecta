"""Configuration module for Proyecta application."""
import os
import sys

class Config:
    """Base configuration."""
    SECRET_KEY = os.environ.get('SECRET_KEY')
    if not SECRET_KEY:
        SECRET_KEY = 'dev-secret-key-change-in-production'
        if not os.environ.get('FLASK_ENV') == 'development':
            print("WARNING: Using default SECRET_KEY. Set SECRET_KEY environment variable in production!", file=sys.stderr)
    
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///proyecta.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
