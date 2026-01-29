#!/bin/bash

# Setup script for Proyecta

echo "Setting up Proyecta - Sistema de Gestión Integral de Actividades"
echo "=================================================================="

# Create virtual environment
echo "Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Initialize database
echo "Initializing database..."
export FLASK_APP=run.py
flask init-db

# Seed database with sample data
echo "Seeding database with sample data..."
flask seed-db

echo ""
echo "Setup complete!"
echo "To start the server, run: python run.py"
echo "To run tests, run: PYTHONPATH=. pytest"
