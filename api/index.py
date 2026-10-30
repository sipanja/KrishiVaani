import os
import sys

# Ensure project root and backend are in python path
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(current_dir)
backend_dir = os.path.join(root_dir, 'backend')

for path in [root_dir, backend_dir]:
    if path not in sys.path:
        sys.path.insert(0, path)

# Import the WSGI Flask app
from backend.wsgi import app

# Export for Vercel Serverless Function
handler = app
