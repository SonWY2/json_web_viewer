import uuid
import shutil
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Optional, List
import tempfile
import hashlib
from ..core.config import settings
from ..core.task_manager import task_manager
from ..models.file_info import FileMetadata, DataType, ColumnInfo
from ..processors.jsonl_streamer import JSONLStreamer
from ..services.schema_detector import SchemaDetector

class FileLoaderService:
    """Service for loading and processing JSONL files"""
    
    def __init__(self):
        self.upload_dir = Path(settings.upload_dir)
        self.upload_dir.mkdir(exist_ok=True)
        self.schema_detector = SchemaDetector()
        self.loaded_files: Dict[str, FileMetadata] = {}
    
    async def upload_file(self, file_data: bytes, filename: str, temporary: bool = False) -> FileMetadata:
        """Upload and process JSONL file"""
        file_id = str(uuid.uuid4())
        
        if temporary:
            # Use temporary file that will be auto-cleaned
            temp_dir = Path(settings.upload_dir) / "temp"
            temp_dir.mkdir(exist_ok=True)
            file_path = temp_dir / f"temp_{file_id}_{filename}"
        else:
            # Regular upload
            file_path = self.upload_dir / f"{file_id}_{filename}"
        
        # Save file
        with open(file_path, 'wb') as f:
            f.write(file_data)
        
        # Quick analysis for immediate response
        metadata = await self._analyze_file_quick(file_id, filename, file_path)
        self.loaded_files[file_id] = metadata
        
        # Start background full analysis
        task_manager.submit_task(
            self._analyze_file_full,
            f"Full analysis of {filename}",
            file_id, file_path
        )
        
        return metadata
    
    async def load_from_path(self, file_path: str) -> FileMetadata:
        """Load JSONL file directly from filesystem path (no copy)"""
        file_id = str(uuid.uuid4())
        path_obj = Path(file_path)
        
        # Quick analysis for immediate response
        metadata = await self._analyze_file_quick(file_id, path_obj.name, path_obj)
        # Override file_path to point to original file
        metadata.file_path = file_path
        metadata.original_filename = path_obj.name
        
        self.loaded_files[file_id] = metadata
        
        # Start background full analysis
        task_manager.submit_task(
            self._analyze_file_full,
            f"Full analysis of {path_obj.name}",
            file_id, path_obj
        )
        
        return metadata
    
    async def load_from_url(self, url: str) -> FileMetadata:
        """Load JSONL file from URL"""
        # TODO: Implement URL loading
        raise NotImplementedError("URL loading not yet implemented")
    
    async def _analyze_file_quick(self, file_id: str, filename: str, file_path: Path) -> FileMetadata:
        """Quick file analysis for immediate response"""
        streamer = JSONLStreamer(file_path)
        
        # Get basic file info
        file_info = streamer.get_file_info()
        
        # Sample records for schema detection
        sample_records = streamer.sample_records(settings.max_sample_size // 10)  # Quick sample
        
        # Detect schema
        schema_info = self.schema_detector.detect_schema(sample_records)
        
        # Estimate total records (rough calculation)
        estimated_records = self._estimate_record_count(file_path, len(sample_records))
        
        return FileMetadata(
            id=file_id,
            filename=filename,
            original_filename=filename,
            file_path=str(file_path),
            file_size=file_info['size'],
            total_records=len(sample_records),  # Will be updated in full analysis
            estimated_records=estimated_records,
            columns=schema_info.columns,
            upload_time=datetime.now(),
            processing_status="quick_analysis_complete",
            sample_data=sample_records[:50],  # First 50 records
            schema_version="1.0"
        )
    
    def _analyze_file_full(self, task_id: str, file_id: str, file_path: Path):
        """Full file analysis (background task)"""
        try:
            streamer = JSONLStreamer(file_path)
            
            # Update progress
            task_manager.update_progress(task_id, 10)
            
            # Count total records
            total_records = streamer.count_records()
            task_manager.update_progress(task_id, 30)
            
            # Sample more records for better schema detection
            sample_records = streamer.sample_records(settings.max_sample_size)
            task_manager.update_progress(task_id, 60)
            
            # Re-detect schema with larger sample
            schema_info = self.schema_detector.detect_schema(sample_records)
            task_manager.update_progress(task_id, 80)
            
            # Update file metadata
            if file_id in self.loaded_files:
                metadata = self.loaded_files[file_id]
                metadata.total_records = total_records
                metadata.columns = schema_info.columns
                metadata.processing_status = "full_analysis_complete"
                metadata.sample_data = sample_records[:100]  # More sample data
            
            task_manager.update_progress(task_id, 100)
            
            return {
                "file_id": file_id,
                "total_records": total_records,
                "schema_confidence": schema_info.detection_confidence,
                "columns_count": len(schema_info.columns)
            }
            
        except Exception as e:
            if file_id in self.loaded_files:
                self.loaded_files[file_id].processing_status = "analysis_failed"
            raise e
    
    def _estimate_record_count(self, file_path: Path, sample_size: int) -> int:
        """Estimate total records based on file size and sample"""
        if sample_size == 0:
            return 0
        
        file_size = file_path.stat().st_size
        
        # Read first chunk to estimate average line size
        chunk_size = min(1024 * 1024, file_size)  # 1MB or file size
        
        with open(file_path, 'rb') as f:
            chunk = f.read(chunk_size)
        
        lines_in_chunk = chunk.count(b'\n')
        if lines_in_chunk == 0:
            return sample_size
        
        avg_line_size = chunk_size / lines_in_chunk
        estimated_lines = file_size / avg_line_size
        
        return int(estimated_lines * 0.9)  # Slightly conservative estimate
    
    def get_file_metadata(self, file_id: str) -> Optional[FileMetadata]:
        """Get file metadata by ID"""
        return self.loaded_files.get(file_id)
    
    def list_files(self) -> List[FileMetadata]:
        """List all loaded files"""
        return list(self.loaded_files.values())
    
    def delete_file(self, file_id: str) -> bool:
        """Delete file and cleanup"""
        if file_id not in self.loaded_files:
            return False
        
        metadata = self.loaded_files[file_id]
        
        # Delete physical file
        try:
            Path(metadata.file_path).unlink(missing_ok=True)
        except Exception:
            pass
        
        # Remove from memory
        del self.loaded_files[file_id]
        return True

# Global service instance
file_loader_service = FileLoaderService()
