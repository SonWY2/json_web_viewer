from typing import Dict, Any, List, Optional
import math
from ..models.file_info import DataChunk
from ..models.filter import DataRequest, FilterRequest, SortRule, SortOrder
from ..processors.jsonl_streamer import JSONLStreamer
from ..services.file_loader import file_loader_service

class DataService:
    """Service for retrieving and processing JSONL data"""
    
    def __init__(self):
        pass
    
    async def get_data_chunk(self, request: DataRequest) -> DataChunk:
        """Get paginated data chunk with filtering and sorting"""
        # Get file metadata
        metadata = file_loader_service.get_file_metadata(request.file_id)
        if not metadata:
            raise ValueError(f"File not found: {request.file_id}")
        
        # Create streamer
        streamer = JSONLStreamer(metadata.file_path)
        
        # Calculate pagination
        start_offset = (request.page - 1) * request.page_size
        
        # Get raw data
        records = list(streamer.stream_records(
            start_offset=start_offset,
            limit=request.page_size * 2  # Get extra to handle filtering
        ))
        
        # Apply filters
        if request.filters:
            records = self._apply_filters(records, request.filters)
        
        # Apply search
        if request.search:
            records = self._apply_search(records, request.search)
        
        # Apply sorting
        if request.sort:
            records = self._apply_sorting(records, request.sort)
        
        # Trim to page size
        records = records[:request.page_size]
        
        # Calculate pagination info
        total_pages = math.ceil(metadata.total_records / request.page_size)
        
        return DataChunk(
            data=records,
            page=request.page,
            page_size=request.page_size,
            total_pages=total_pages,
            total_records=metadata.total_records,
            has_next=request.page < total_pages,
            has_prev=request.page > 1
        )
    
    def _apply_filters(self, records: List[Dict[str, Any]], filters: FilterRequest) -> List[Dict[str, Any]]:
        """Apply filters to records"""
        filtered_records = []
        
        for record in records:
            if self._record_matches_filters(record, filters):
                filtered_records.append(record)
        
        return filtered_records
    
    def _record_matches_filters(self, record: Dict[str, Any], filters: FilterRequest) -> bool:
        """Check if record matches filter criteria"""
        group_results = []
        
        for group in filters.groups:
            rule_results = []
            
            for rule in group.rules:
                rule_result = self._evaluate_filter_rule(record, rule)
                rule_results.append(rule_result)
            
            # Combine rules within group
            if group.logical_operator.value == "and":
                group_result = all(rule_results)
            else:  # OR
                group_result = any(rule_results)
            
            group_results.append(group_result)
        
        # Combine groups
        if filters.global_operator.value == "and":
            return all(group_results)
        else:  # OR
            return any(group_results)
    
    def _evaluate_filter_rule(self, record: Dict[str, Any], rule) -> bool:
        """Evaluate a single filter rule"""
        field_value = record.get(rule.column)
        
        if rule.operator.value == "is_null":
            return field_value is None
        
        if rule.operator.value == "is_not_null":
            return field_value is not None
        
        if field_value is None:
            return False
        
        # Convert to string for text operations
        str_value = str(field_value)
        filter_value = str(rule.value) if rule.value is not None else ""
        
        if not rule.case_sensitive:
            str_value = str_value.lower()
            filter_value = filter_value.lower()
        
        if rule.operator.value == "equals":
            return str_value == filter_value
        
        elif rule.operator.value == "not_equals":
            return str_value != filter_value
        
        elif rule.operator.value == "contains":
            return filter_value in str_value
        
        elif rule.operator.value == "not_contains":
            return filter_value not in str_value
        
        elif rule.operator.value == "starts_with":
            return str_value.startswith(filter_value)
        
        elif rule.operator.value == "ends_with":
            return str_value.endswith(filter_value)
        
        # Numeric operations
        try:
            numeric_field = float(field_value) if isinstance(field_value, (int, float, str)) else None
            numeric_filter = float(rule.value) if rule.value is not None else None
            
            if numeric_field is not None and numeric_filter is not None:
                if rule.operator.value == "greater_than":
                    return numeric_field > numeric_filter
                elif rule.operator.value == "less_than":
                    return numeric_field < numeric_filter
                elif rule.operator.value == "greater_equal":
                    return numeric_field >= numeric_filter
                elif rule.operator.value == "less_equal":
                    return numeric_field <= numeric_filter
        except (ValueError, TypeError):
            pass
        
        # List operations
        if rule.operator.value == "in" and isinstance(rule.value, list):
            return str_value in [str(v) for v in rule.value]
        
        elif rule.operator.value == "not_in" and isinstance(rule.value, list):
            return str_value not in [str(v) for v in rule.value]
        
        return False
    
    def _apply_search(self, records: List[Dict[str, Any]], search_term: str) -> List[Dict[str, Any]]:
        """Apply global search to records"""
        if not search_term:
            return records
        
        search_term = search_term.lower()
        filtered_records = []
        
        for record in records:
            # Search in all string fields
            for value in record.values():
                if value is not None and search_term in str(value).lower():
                    filtered_records.append(record)
                    break
        
        return filtered_records
    
    def _apply_sorting(self, records: List[Dict[str, Any]], sort_rules: List[SortRule]) -> List[Dict[str, Any]]:
        """Apply sorting to records"""
        if not sort_rules:
            return records
        
        def sort_key(record):
            keys = []
            for rule in sort_rules:
                value = record.get(rule.column)
                
                # Handle None values
                if value is None:
                    keys.append((0, ""))  # Sort nulls first
                else:
                    # Try to sort as number, fallback to string
                    try:
                        if isinstance(value, (int, float)):
                            keys.append((1, value))
                        else:
                            numeric_value = float(str(value))
                            keys.append((1, numeric_value))
                    except (ValueError, TypeError):
                        keys.append((1, str(value).lower()))
            
            return keys
        
        # Sort with reverse for descending order
        reverse_flags = [rule.order == SortOrder.DESC for rule in sort_rules]
        
        # For multiple sort columns, we need to sort by all at once
        return sorted(records, key=sort_key, reverse=reverse_flags[0] if reverse_flags else False)

# Global service instance
data_service = DataService()
