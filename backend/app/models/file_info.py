from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime
from enum import Enum

class DataType(Enum):
    STRING = "string"
    NUMBER = "number"
    BOOLEAN = "boolean"
    OBJECT = "object"
    ARRAY = "array"
    NULL = "null"
    DATE = "date"

class ColumnInfo(BaseModel):
    name: str
    data_type: DataType
    nullable: bool = True
    sample_values: List[Any] = []
    unique_count: Optional[int] = None
    null_count: Optional[int] = None

class FileMetadata(BaseModel):
    id: str
    filename: str
    original_filename: str
    file_path: str
    file_size: int
    total_records: int
    estimated_records: Optional[int] = None
    columns: List[ColumnInfo]
    upload_time: datetime
    processing_status: str = "uploaded"
    sample_data: List[Dict[str, Any]] = []
    schema_version: str = "1.0"

class SchemaInfo(BaseModel):
    columns: List[ColumnInfo]
    total_records: int
    estimated_records: Optional[int] = None
    sample_size: int
    detection_confidence: float = 0.0
    schema_hash: str = ""

class DataChunk(BaseModel):
    data: List[Dict[str, Any]]
    page: int
    page_size: int
    total_pages: int
    total_records: int
    has_next: bool
    has_prev: bool
