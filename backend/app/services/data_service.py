from typing import List, Dict, Any, Optional
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
        """Apply sorting to records by each SortRule sequentially"""
        if not sort_rules:
            return records
        
        # Sort by rules in reverse order to maintain priority
        # (stable sorting means last sort has highest priority)
        result = records[:]
        
        for rule in reversed(sort_rules):
            def sort_key(record):
                value = record.get(rule.column)
                
                # Handle None values - always sort them first
                if value is None:
                    return (0, "")
                
                # Try to sort as number first
                try:
                    if isinstance(value, (int, float)):
                        return (1, value)
                    else:
                        return (1, float(str(value)))
                except (ValueError, TypeError):
                    # Fallback to string sorting
                    return (1, str(value).lower())
            
            result = sorted(result, key=sort_key, reverse=(rule.order == SortOrder.DESC))
        
        return result

# Global service instance
data_service = DataService()


def test_multiple_column_sorting():
    """Test sorting by multiple columns with mixed ASC/DESC orders"""
    from ..models.filter import SortRule, SortOrder
    
    # Test data
    test_records = [
        {"name": "Alice", "age": 30, "city": "Boston"},
        {"name": "Bob", "age": 25, "city": "Boston"},
        {"name": "Charlie", "age": 30, "city": "Austin"},
        {"name": "David", "age": 25, "city": "Austin"},
        {"name": "Eve", "age": 35, "city": "Boston"},
    ]
    
    service = DataService()
    
    # Test 1: Sort by city ASC, then age DESC
    sort_rules = [
        SortRule(column="city", order=SortOrder.ASC),
        SortRule(column="age", order=SortOrder.DESC)
    ]
    
    result1 = service._apply_sorting(test_records, sort_rules)
    expected1 = [
        {"name": "David", "age": 25, "city": "Austin"},
        {"name": "Charlie", "age": 30, "city": "Austin"},
        {"name": "Eve", "age": 35, "city": "Boston"},
        {"name": "Alice", "age": 30, "city": "Boston"},
        {"name": "Bob", "age": 25, "city": "Boston"},
    ]
    
    print("Test 1 - City ASC, Age DESC:")
    for i, record in enumerate(result1):
        print(f"  {record}")
        assert record == expected1[i], f"Mismatch at index {i}"
    
    # Test 2: Sort by age ASC, then name DESC
    sort_rules = [
        SortRule(column="age", order=SortOrder.ASC),
        SortRule(column="name", order=SortOrder.DESC)
    ]
    
    result2 = service._apply_sorting(test_records, sort_rules)
    expected2 = [
        {"name": "David", "age": 25, "city": "Austin"},
        {"name": "Bob", "age": 25, "city": "Boston"},
        {"name": "Charlie", "age": 30, "city": "Austin"},
        {"name": "Alice", "age": 30, "city": "Boston"},
        {"name": "Eve", "age": 35, "city": "Boston"},
    ]
    
    print("\nTest 2 - Age ASC, Name DESC:")
    for i, record in enumerate(result2):
        print(f"  {record}")
        assert record == expected2[i], f"Mismatch at index {i}"
    
    # Test 3: Single column DESC
    sort_rules = [SortRule(column="age", order=SortOrder.DESC)]
    
    result3 = service._apply_sorting(test_records, sort_rules)
    ages = [record["age"] for record in result3]
    assert ages == [35, 30, 30, 25, 25], f"Single column DESC failed: {ages}"
    
    print("\nTest 3 - Single column DESC: PASSED")
    
    # Test 4: Handle None values
    test_with_none = [
        {"name": "Alice", "age": None},
        {"name": "Bob", "age": 25},
        {"name": "Charlie", "age": 30},
    ]
    
    sort_rules = [SortRule(column="age", order=SortOrder.ASC)]
    result4 = service._apply_sorting(test_with_none, sort_rules)
    
    # None should come first
    assert result4[0]["age"] is None, "None values should sort first"
    assert result4[1]["age"] == 25, "25 should come after None"
    assert result4[2]["age"] == 30, "30 should come last"
    
    print("Test 4 - None values: PASSED")
    print("\nAll sorting tests passed! ✅")

if __name__ == "__main__":
    test_multiple_column_sorting()
