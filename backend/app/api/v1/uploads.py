import os
from flask import send_from_directory, current_app, abort
from werkzeug.utils import secure_filename
from . import api_v1_bp

@api_v1_bp.route('/uploads/<filename>', methods=['GET'])
def get_uploaded_file(filename: str):
    """
    Safely serves uploaded crop photos. Prevents path traversal.
    """
    clean_filename = secure_filename(filename)
    upload_dir = current_app.config['UPLOAD_FOLDER']
    
    # Check directly in upload_dir or in crops/ subfolder
    crops_dir = os.path.join(upload_dir, 'crops')
    
    if os.path.isfile(os.path.join(crops_dir, clean_filename)):
        return send_from_directory(crops_dir, clean_filename)
    elif os.path.isfile(os.path.join(upload_dir, clean_filename)):
        return send_from_directory(upload_dir, clean_filename)
        
    abort(404, description="File not found")
