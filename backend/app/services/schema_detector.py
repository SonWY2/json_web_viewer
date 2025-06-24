from typing import Dict, Any, List, Set, Optional
import re
from datetime import datetime
from collections import Counter
import hashlib
from ..models.file_info import DataType, ColumnInfo, SchemaInfo

class SchemaDetector:
    """Automatic schema detection for JSONL data"""
    
    def __init__(self):
        self.date_patterns = [
            r'\d{4}-\d{2}-\d{2}',  # YYYY-MM-DD
            r'\d{2}/\d{2}/\d{4}',  # MM/DD/YYYY
            r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}',  # ISO datetime
        ]
        self.compiled_patterns = [re.compile(p) for p in self.date_patterns]
    
    def detect_type(self, value: Any) -> DataType:
        """Detect data type of a single value"""
        if value is None:
            return DataType.NULL
        
        if isinstance(value, bool):
            return DataType.BOOLEAN
        
        if isinstance(value, int):
            return DataType.NUMBER
        
        if isinstance(value, float):
            return DataType.NUMBER
        
        if isinstance(value, (list, tuple)):
            return DataType.ARRAY
        
        if isinstance(value, dict):
            return DataType.OBJECT
        
        if isinstance(value, str):
            # Check if it's a date string
            if self._is_date_string(value):
                return DataType.DATE
            return DataType.STRING
        
        return DataType.STRING
    
    def _is_date_string(self, value: str) -> bool:
        """Check if string matches common date patterns"""
        for pattern in self.compiled_patterns:
            if pattern.match(value):
                return True
        return False
    
    def analyze_column(self, values: List[Any], column_name: str) -> ColumnInfo:
        """Analyze a column's data to determine its characteristics"""
        non_null_values = [v for v in values if v is not None]
        null_count = len(values) - len(non_null_values)
        
        if not non_null_values:
            return ColumnInfo(
                name=column_name,
                data_type=DataType.NULL,
                nullable=True,
                null_count=null_count,
                sample_values=[]
            )
        
        # Detect primary type (most common type)
        type_counts = Counter()
        for value in non_null_values:
            type_counts[self.detect_type(value)] += 1
        
        primary_type = type_counts.most_common(1)[0][0]
        
        # Get sample values (up to 10 unique values)
        unique_values = list(set(str(v) for v in non_null_values[:100]))[:10]
        
        return ColumnInfo(
            name=column_name,
            data_type=primary_type,
            nullable=null_count > 0,
            sample_values=unique_values,
            null_count=null_count,
            unique_count=len(set(str(v) for v in non_null_values))
        )
    
    def detect_schema(self, records: List[Dict[str, Any]]) -> SchemaInfo:
        """Detect schema from sample records"""
        if not records:
            return SchemaInfo(
                columns=[],
                total_records=0,
                sample_size=0,
                detection_confidence=0.0
            )
        
        # Collect all column names
        all_columns = set()
        for record in records:
            all_columns.update(record.keys())
        
        # Analyze each column
        columns = []
        column_data = {col: [] for col in all_columns}
        
        # Collect column values
        for record in records:
            for col in all_columns:
                column_data[col].append(record.get(col))
        
        # Analyze each column
        for column_name in sorted(all_columns):
            column_info = self.analyze_column(column_data[column_name], column_name)
            columns.append(column_info)
        
        # Calculate detection confidence
        confidence = self._calculate_confidence(records, columns)
        
        # Generate schema hash
        schema_hash = self._generate_schema_hash(columns)
        
        return SchemaInfo(
            columns=columns,
            total_records=len(records),
            sample_size=len(records),
            detection_confidence=confidence,
            schema_hash=schema_hash
        )
    
    def _calculate_confidence(self, records: List[Dict[str, Any]], columns: List[ColumnInfo]) -> float:
        """Calculate confidence score for schema detection"""
        if not records or not columns:
            return 0.0
        
        # Factors affecting confidence:
        # 1. Sample size
        # 2. Consistency of column presence
        # 3. Type consistency
        
        sample_size_factor = min(1.0, len(records) / 1000)  # Max confidence at 1000+ records
        
        # Column consistency (how many records have each column)
        column_presence = {}
        for record in records:
            for col in record.keys():
                column_presence[col] = column_presence.get(col, 0) + 1
        
        consistency_scores = []
        for col_info in columns:
            presence_ratio = column_presence.get(col_info.name, 0) / len(records)
            consistency_scores.append(presence_ratio)
        
        consistency_factor = sum(consistency_scores) / len(consistency_scores) if consistency_scores else 0
        
        # Overall confidence
        confidence = (sample_size_factor * 0.3 + consistency_factor * 0.7) * 100
        return round(confidence, 2)
    
    def _generate_schema_hash(self, columns: List[ColumnInfo]) -> str:
        """Generate hash for schema fingerprinting"""
        schema_str = ""
        for col in sorted(columns, key=lambda x: x.name):
            schema_str += f"{col.name}:{col.data_type.value}:{col.nullable}"
        
        return hashlib.md5(schema_str.encode()).hexdigest()[:16]
