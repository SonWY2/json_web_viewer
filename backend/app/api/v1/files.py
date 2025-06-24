from fastapi import APIRouter, File, UploadFile, HTTPException, status
from fastapi.responses import JSONResponse
from typing import List
from ...services.file_loader import file_loader_service
from ...models.file_info import FileMetadata
from ...core.config import settings

router = APIRouter(prefix="/files", tags=["files"])

@router.post("/upload", response_model=FileMetadata)
async def upload_file(file: UploadFile = File(...)):
    """Upload and analyze JSONL file"""
    
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
        # Process file
        metadata = await file_loader_service.upload_file(contents, file.filename)
        return metadata
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process file: {str(e)}"
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
