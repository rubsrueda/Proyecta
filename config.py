"""Configuration module for Proyecta application."""
import os

class Config:
    """Base configuration."""
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///proyecta.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
