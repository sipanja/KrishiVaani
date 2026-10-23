import sys
import os
import pytest

# Ensure backend directory is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from app.config import TestingConfig
from app.models import db, User, FarmerProfile, Farm, CropCycle

@pytest.fixture
def app():
    app = create_app(TestingConfig)
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def auth_headers(client):
    """Creates a test user and returns authorization Bearer header."""
    res = client.post('/api/v1/auth/register', json={
        'username': 'ramesh_patel',
        'password': 'SecretPassword123!',
        'full_name': 'Ramesh Patel',
        'preferred_language': 'hi',
        'village': 'Navsari',
        'district': 'Navsari',
        'state': 'Gujarat'
    })
    data = res.get_json()
    token = data['token']
    return {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
