# from pydantic import BaseSettings
from pydantic_settings import BaseSettings
from pathlib import Path
import os

class Settings(BaseSettings):
    app_name: str = "JSONL Viewer API"
    version: str = "1.0.0"
    debug: bool = True
    
    # File handling
    max_file_size: int = 10 * 1024 * 1024 * 1024  # 10GB
    upload_dir: str = "uploads"
    cache_dir: str = "cache"
    max_sample_size: int = 10000
    
    # Performance settings
    chunk_size: int = 1000
    max_workers: int = 4
    cache_ttl: int = 3600  # 1 hour
    
    # Database
    database_url: str = "sqlite:///./jsonl_viewer.db"
    
    # CORS
    allowed_origins: list = ["http://localhost:3000", "http://localhost:5173"]
    
    class Config:
        env_file = ".env"

# Create global settings instance
settings = Settings()

# Ensure directories exist
Path(settings.upload_dir).mkdir(exist_ok=True)
Path(settings.cache_dir).mkdir(exist_ok=True)
