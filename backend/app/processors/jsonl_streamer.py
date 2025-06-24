import json
import ijson
from pathlib import Path
from typing import Iterator, Dict, Any, List, Optional
import gzip
import bz2
from ..core.config import settings

class JSONLStreamer:
    """Streaming JSONL file processor"""
    
    def __init__(self, file_path: Path):
        self.file_path = Path(file_path)
        self.is_compressed = self._detect_compression()
    
    def _detect_compression(self) -> Optional[str]:
        """Detect file compression type"""
        if self.file_path.suffix.lower() == '.gz':
            return 'gzip'
        elif self.file_path.suffix.lower() == '.bz2':
            return 'bz2'
        return None
    
    def _open_file(self, mode='r'):
        """Open file with appropriate compression handler"""
        if self.is_compressed == 'gzip':
            return gzip.open(self.file_path, mode + 't', encoding='utf-8')
        elif self.is_compressed == 'bz2':
            return bz2.open(self.file_path, mode + 't', encoding='utf-8')
        else:
            return open(self.file_path, mode, encoding='utf-8')
    
    def stream_records(self, start_offset: int = 0, limit: Optional[int] = None) -> Iterator[Dict[str, Any]]:
        """Stream records from JSONL file with offset and limit"""
        count = 0
        record_index = 0
        
        with self._open_file() as f:
            for line in f:
                if record_index < start_offset:
                    record_index += 1
                    continue
                
                line = line.strip()
                if not line:
                    continue
                
                try:
                    record = json.loads(line)
                    yield record
                    count += 1
                    
                    if limit and count >= limit:
                        break
                        
                except json.JSONDecodeError as e:
                    # Skip invalid JSON lines
                    continue
                
                record_index += 1
    
    def count_records(self) -> int:
        """Count total records in file"""
        count = 0
        with self._open_file() as f:
            for line in f:
                if line.strip():
                    count += 1
        return count
    
    def sample_records(self, sample_size: int = 1000) -> List[Dict[str, Any]]:
        """Get sample records for schema detection"""
        records = []
        count = 0
        
        with self._open_file() as f:
            for line in f:
                if count >= sample_size:
                    break
                
                line = line.strip()
                if not line:
                    continue
                
                try:
                    record = json.loads(line)
                    records.append(record)
                    count += 1
                except json.JSONDecodeError:
                    continue
        
        return records
    
    def get_file_info(self) -> Dict[str, Any]:
        """Get basic file information"""
        return {
            'size': self.file_path.stat().st_size,
            'compressed': self.is_compressed is not None,
            'compression_type': self.is_compressed,
            'exists': self.file_path.exists()
        }
