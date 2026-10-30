import os
import logging
from typing import Optional

logger = logging.getLogger('krishivaani.supabase')

try:
    from supabase import create_client, Client
except ImportError:
    create_client = None
    Client = None

class SupabaseService:
    """
    Manages connection and operations with Supabase (Auth, Storage, Database).
    """
    def __init__(self, url: Optional[str] = None, key: Optional[str] = None):
        self.url = url or os.getenv('SUPABASE_URL', 'https://plbqzqfuslulbqqfquvg.supabase.co')
        self.key = key or os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_ANON_KEY') or os.getenv('SUPABASE_KEY', '')
        self._client: Optional[Client] = None
        self._initialized = False

    @property
    def client(self) -> Optional[Client]:
        if not self._initialized:
            self._init_client()
        return self._client

    def _init_client(self):
        self._initialized = True
        if not create_client:
            logger.warning("Supabase python package not installed.")
            return

        if not self.url or not self.key:
            logger.info("Supabase URL or Key not set. Running without active Supabase client.")
            return

        try:
            self._client = create_client(self.url, self.key)
            logger.info(f"Supabase client initialized successfully for {self.url}")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {str(e)}")

    def upload_crop_photo(self, file_bytes: bytes, destination_path: str, content_type: str = "image/jpeg", bucket_name: str = "crop-photos") -> Optional[str]:
        """
        Uploads a crop photo to Supabase Storage and returns the public or signed URL.
        """
        if not self.client:
            return None

        try:
            # Upload file
            res = self.client.storage.from_(bucket_name).upload(
                path=destination_path,
                file=file_bytes,
                file_options={"content-type": content_type, "upsert": "true"}
            )
            # Retrieve public URL
            public_url_res = self.client.storage.from_(bucket_name).get_public_url(destination_path)
            return public_url_res
        except Exception as e:
            logger.error(f"Error uploading crop photo to Supabase Storage: {str(e)}")
            return None

# Singleton instance
supabase_service = SupabaseService()
