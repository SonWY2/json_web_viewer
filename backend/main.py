import uvicorn
from app import create_app
from app.services.file_cleanup import cleanup_temp_files

app = create_app()

# Cleanup old temp files on startup
cleanup_temp_files()

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
