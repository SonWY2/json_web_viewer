from fastapi import APIRouter, File, UploadFile, HTTPException, status, BackgroundTasks
from fastapi.responses import JSONResponse
from typing import List
from pathlib import Path
from pydantic import BaseModel
from ...services.file_loader import file_loader_service
from ...services.file_cleanup import delete_file_after_delay
from ...models.file_info import FileMetadata
from ...core.config import settings

router = APIRouter(prefix="/files", tags=["files"])

class LoadPathRequest(BaseModel):
    path: str

@router.post("/upload", response_model=FileMetadata)
async def upload_file(file: UploadFile = File(...), background_tasks: BackgroundTasks = None):
    """Upload and analyze JSONL file (temporary storage with auto-cleanup)"""
    
    # Validate file
    if not file.filename.endswith(('.jsonl', '.jsonl.gz', '.jsonl.bz2')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JSONL files are supported (.jsonl, .jsonl.gz, .jsonl.bz2)"
        )
    
    # Check file size
    contents = await file.read()
    if len(contents) > settings.max_file_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size: {settings.max_file_size / (1024**3):.1f}GB"
        )
    
    try:
        # Process file with temporary storage
        metadata = await file_loader_service.upload_file(contents, file.filename, temporary=True)
        
        # Schedule automatic cleanup after 30 minutes
        if background_tasks and metadata.file_path:
            background_tasks.add_task(
                delete_file_after_delay,
                file_path=metadata.file_path,
                delay_minutes=30
            )
            print(f"Scheduled cleanup for uploaded file: {metadata.file_path}")
        
        return metadata
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process file: {str(e)}"
        )

@router.post("/load-path", response_model=FileMetadata)
async def load_from_path(request: LoadPathRequest):
    """Load JSONL file from filesystem path (direct reference, no copy)"""
    file_path = Path(request.path)
    
    # Validate file exists and is JSONL
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    if not file_path.suffix.lower() in ['.jsonl', '.json']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JSONL/JSON files are supported"
        )
    
    # Check file size
    if file_path.stat().st_size > settings.max_file_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size: {settings.max_file_size / (1024**3):.1f}GB"
        )
    
    try:
        # Process file directly from original path (no copying)
        metadata = await file_loader_service.load_from_path(str(file_path))
        return metadata
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load file: {str(e)}"
        )

@router.get("/{file_id}", response_model=FileMetadata)
async def get_file_info(file_id: str):
    """Get file metadata"""
    metadata = file_loader_service.get_file_metadata(file_id)
    if not metadata:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    return metadata

@router.get("/", response_model=List[FileMetadata])
async def list_files():
    """List all uploaded files"""
    return file_loader_service.list_files()

@router.delete("/{file_id}")
async def delete_file(file_id: str):
    """Delete file"""
    success = file_loader_service.delete_file(file_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    return {"message": "File deleted successfully"}
