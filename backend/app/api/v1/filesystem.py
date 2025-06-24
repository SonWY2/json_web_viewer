from fastapi import APIRouter, HTTPException, status
from pathlib import Path
import os
import platform
from typing import List, Dict, Any
from pydantic import BaseModel

router = APIRouter(prefix="/filesystem", tags=["filesystem"])

class FileItem(BaseModel):
    name: str
    path: str
    is_directory: bool
    size: int = 0
    extension: str = ""

class DirectoryListing(BaseModel):
    current_path: str
    parent_path: str = None
    items: List[FileItem]

def get_default_path() -> str:
    """Get default path based on OS"""
    system = platform.system().lower()
    try:
        # First try current working directory
        cwd = os.getcwd()
        if os.path.exists(cwd) and os.access(cwd, os.R_OK):
            return cwd
            
        if system == "linux":
            paths = [
                os.path.expanduser("~/Documents"),
                os.path.expanduser("~"),
                "/home/jovyan/work",
                "/home/jovyan", 
                "/tmp"
            ]
            for path in paths:
                if os.path.exists(path) and os.access(path, os.R_OK):
                    return path
            return "/tmp"
        elif system == "windows":
            paths = [
                os.path.expanduser("~/Documents"),
                os.path.expanduser("~/Desktop"),
                os.path.expanduser("~"),
                "C:\\Users"
            ]
            for path in paths:
                if os.path.exists(path) and os.access(path, os.R_OK):
                    return path
            return "C:\\"
        else:  # macOS
            return os.path.expanduser("~/Documents")
    except Exception as e:
        print(f"Error getting default path: {e}")
        return os.getcwd()

def is_safe_path(path: str) -> bool:
    """Check if path is safe to access - permissive approach for development"""
    try:
        resolved = Path(path).resolve()
        
        # Check if path exists and is readable
        if not resolved.exists():
            return False
            
        if not os.access(str(resolved), os.R_OK):
            return False
        
        # Only block extremely dangerous system directories
        dangerous_paths = [
            "/etc/passwd", "/etc/shadow", "/boot", "/dev", "/proc", "/sys",
            "C:\\Windows\\System32", "C:\\Windows\\SysWOW64"
        ]
        
        path_str = str(resolved).lower()
        for dangerous in dangerous_paths:
            if path_str.startswith(dangerous.lower()):
                return False
        
        # Allow most paths including project directories, user folders etc.
        return True
        
    except Exception as e:
        print(f"Path safety check failed: {e}")
        return False

@router.get("/", response_model=DirectoryListing)
async def list_directory(path: str = None):
    """List directory contents"""
    try:
        if not path:
            path = get_default_path()
        
        print(f"Attempting to list directory: {path}")
        
        current_path = Path(path)
        
        # Check if path exists and is accessible
        if not current_path.exists():
            print(f"Path does not exist: {path}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Directory does not exist: {path}"
            )
        
        if not current_path.is_dir():
            print(f"Path is not a directory: {path}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Path is not a directory"
            )
        
        if not os.access(str(current_path), os.R_OK):
            print(f"No read permission for: {path}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: {path}"
            )
        
        # Safety check - but allow most paths
        if not is_safe_path(str(current_path)):
            print(f"Path not safe: {path}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access not allowed: {path}"
            )
        
        items = []
        try:
            for item in current_path.iterdir():
                try:
                    # Skip hidden files (but not hidden folders for navigation)
                    if item.name.startswith('.') and item.is_file():
                        continue
                    
                    is_dir = item.is_dir()
                    size = 0
                    
                    if not is_dir:
                        try:
                            size = item.stat().st_size
                        except (OSError, PermissionError):
                            size = 0
                    
                    extension = item.suffix.lower() if not is_dir else ""
                    
                    # Show all directories and JSONL/JSON files
                    if is_dir or extension in ['.jsonl', '.json']:
                        items.append(FileItem(
                            name=item.name,
                            path=str(item),
                            is_directory=is_dir,
                            size=size,
                            extension=extension
                        ))
                except (OSError, PermissionError) as e:
                    print(f"Skipping item {item}: {e}")
                    continue
        except PermissionError as e:
            print(f"Permission error reading directory: {e}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permission denied reading directory contents"
            )
        
        # Sort: directories first, then files
        items.sort(key=lambda x: (not x.is_directory, x.name.lower()))
        
        # Get parent path - allow navigation up
        parent_path = None
        try:
            if current_path.parent != current_path:
                parent_candidate = str(current_path.parent)
                if os.access(parent_candidate, os.R_OK) and is_safe_path(parent_candidate):
                    parent_path = parent_candidate
        except:
            pass
        
        print(f"Successfully listed {len(items)} items in {path}")
        
        return DirectoryListing(
            current_path=str(current_path),
            parent_path=parent_path,
            items=items
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error listing directory: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list directory: {str(e)}"
        )

@router.get("/default-path")
async def get_default_directory():
    """Get default directory path"""
    return {"path": get_default_path()}
