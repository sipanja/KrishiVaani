import os
import uuid
from werkzeug.utils import secure_filename
from flask import current_app

class StorageService:
    @staticmethod
    def allowed_file(filename: str) -> bool:
        if '.' not in filename:
            return False
        ext = filename.rsplit('.', 1)[1].lower()
        return ext in current_app.config['ALLOWED_EXTENSIONS']

    @staticmethod
    def save_file(file_storage, subfolder: str = '') -> dict:
        """
        Safely saves an uploaded file (photo or audio) to the configured uploads directory.
        Prevents path traversal, sanitizes filenames, and assigns unique identifiers.
        """
        if not file_storage or file_storage.filename == '':
            return {'success': False, 'error': 'No file provided'}

        filename = secure_filename(file_storage.filename)
        if not StorageService.allowed_file(filename):
            allowed = ', '.join(current_app.config['ALLOWED_EXTENSIONS'])
            return {'success': False, 'error': f'File format not allowed. Supported formats: {allowed}'}

        ext = filename.rsplit('.', 1)[1].lower()
        unique_name = f"{uuid.uuid4().hex}.{ext}"

        upload_dir = current_app.config['UPLOAD_FOLDER']
        if subfolder:
            upload_dir = os.path.join(upload_dir, secure_filename(subfolder))

        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, unique_name)

        # Ensure no path traversal outside upload_dir
        if not os.path.abspath(file_path).startswith(os.path.abspath(current_app.config['UPLOAD_FOLDER'])):
            return {'success': False, 'error': 'Invalid file destination path'}

        file_storage.save(file_path)

        return {
            'success': True,
            'filename': unique_name,
            'file_path': file_path,
            'size': os.path.getsize(file_path)
        }
