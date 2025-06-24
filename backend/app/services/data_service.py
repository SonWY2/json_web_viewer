from typing import List, Dict, Any, Optional
import math
from ..models.file_info import DataChunk
from ..models.filter import DataRequest, FilterRequest, SortRule, SortOrder
from ..processors.jsonl_streamer import JSONLStreamer
from ..services.file_loader import file_loader_service

class DataService:
    """Service for retrieving and processing JSONL data"""

    def __init__(self):
        # NOTE: 캐싱 메커니즘을 추가하면 필터링/정렬 시 성능을 더욱 향상시킬 수 있습니다.
        self._filtered_data_cache = {}

    async def get_data_chunk(self, request: DataRequest) -> DataChunk:
        """Get paginated data chunk with filtering and sorting"""
        metadata = file_loader_service.get_file_metadata(request.file_id)
        if not metadata:
            raise ValueError(f"File not found: {request.file_id}")

        streamer = JSONLStreamer(metadata.file_path)

        # 필터링, 정렬, 검색이 없는 경우, 효율적으로 직접 스트리밍합니다.
        has_operations = request.filters or request.sort or request.search
        if not has_operations:
            page_start = (request.page - 1) * request.page_size
            page_records = list(streamer.stream_records(start_offset=page_start, limit=request.page_size))
            total_records = metadata.total_records
            total_pages = max(1, math.ceil(total_records / request.page_size))

            return DataChunk(
                data=page_records,
                page=request.page,
                page_size=request.page_size,
                total_pages=total_pages,
                total_records=total_records,
                has_next=request.page < total_pages,
                has_prev=request.page > 1,
            )

        # 필터링, 정렬, 검색이 있는 경우, 전체 데이터를 처리합니다.
        # 이 과정은 첫 요청 시에만 오래 걸리고, 이후 페이지 이동은 빠릅니다.
        # TODO: 향후 대용량 파일을 위해 캐시 키에 필터/정렬 조건을 포함하는 캐싱 전략을 구현할 수 있습니다.
        all_records = list(streamer.stream_records())

        if request.filters:
            all_records = self._apply_filters(all_records, request.filters)

        if request.search:
            all_records = self._apply_search(all_records, request.search)

        if request.sort:
            all_records = self._apply_sorting(all_records, request.sort)

        total_filtered_records = len(all_records)
        total_pages = max(1, math.ceil(total_filtered_records / request.page_size))

        page_start = (request.page - 1) * request.page_size
        page_end = page_start + request.page_size
        page_records = all_records[page_start:page_end]

        return DataChunk(
            data=page_records,
            page=request.page,
            page_size=request.page_size,
            total_pages=total_pages,
            total_records=total_filtered_records,
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

            if group.logical_operator.value == "and":
                group_result = all(rule_results)
            else:  # OR
                group_result = any(rule_results)

            group_results.append(group_result)

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

        try:
            numeric_field = float(field_value) if isinstance(field_value, (int, float, str)) and str(field_value).replace('.', '', 1).isdigit() else None
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
            for value in record.values():
                if value is not None and search_term in str(value).lower():
                    filtered_records.append(record)
                    break

        return filtered_records

    def _apply_sorting(self, records: List[Dict[str, Any]], sort_rules: List[SortRule]) -> List[Dict[str, Any]]:
        """Apply sorting to records by each SortRule sequentially"""
        if not sort_rules:
            return records

        result = records[:]
        for rule in reversed(sort_rules):
            def sort_key(record, _rule=rule): # _rule을 사용하여 클로저 문제 방지
                value = record.get(_rule.column)
                if value is None:
                    # None 값은 ASC 정렬 시 맨 앞, DESC 정렬 시 맨 뒤에 오도록 튜플의 첫 번째 요소로 제어
                    if _rule.order == SortOrder.ASC:
                        return (0, )
                    else:
                        return (2, ) # Type 2 for None in DESC

                # 숫자 타입 시도
                try:
                    num_val = float(value)
                    return (1, num_val) # Type 1 for numbers
                except (ValueError, TypeError):
                    # 문자열로 처리
                    return (1, str(value).lower()) # Type 1 for strings too

            result.sort(key=sort_key, reverse=rule.order == SortOrder.DESC)

        return result


# Global service instance
data_service = DataService()


def test_multiple_column_sorting():
    """Test sorting by multiple columns with mixed ASC/DESC orders"""
    from ..models.filter import SortRule, SortOrder

    # Test data
    test_records = [
        {"name": "Charlie", "age": 30, "city": "Austin"},
        {"name": "Alice", "age": 30, "city": "Boston"},
        {"name": "Bob", "age": 25, "city": "Boston"},
        {"name": "Eve", "age": 35, "city": "Boston"},
        {"name": "David", "age": 25, "city": "Austin"},
        {"name": "Frank", "age": None, "city": "Austin"}
    ]

    service = DataService()

    # Test 1: Sort by city ASC, then age DESC
    sort_rules1 = [
        SortRule(column="city", order=SortOrder.ASC),
        SortRule(column="age", order=SortOrder.DESC)
    ]
    result1 = service._apply_sorting(list(test_records), sort_rules1)
    print("\nTest 1 - City ASC, Age DESC:")
    for r in result1: print(r)
    expected1 = [
        {'name': 'Frank', 'age': None, 'city': 'Austin'},
        {'name': 'Charlie', 'age': 30, 'city': 'Austin'},
        {'name': 'David', 'age': 25, 'city': 'Austin'},
        {'name': 'Eve', 'age': 35, 'city': 'Boston'},
        {'name': 'Alice', 'age': 30, 'city': 'Boston'},
        {'name': 'Bob', 'age': 25, 'city': 'Boston'}
    ]
    assert result1 == expected1, "Test 1 Failed"
    print("Test 1 PASSED")


    # Test 2: Sort by age ASC, then name DESC
    sort_rules2 = [
        SortRule(column="age", order=SortOrder.ASC),
        SortRule(column="name", order=SortOrder.DESC)
    ]
    result2 = service._apply_sorting(list(test_records), sort_rules2)
    print("\nTest 2 - Age ASC, Name DESC:")
    for r in result2: print(r)
    expected2 = [
        {'name': 'Frank', 'age': None, 'city': 'Austin'},
        {'name': 'David', 'age': 25, 'city': 'Austin'},
        {'name': 'Bob', 'age': 25, 'city': 'Boston'},
        {'name': 'Charlie', 'age': 30, 'city': 'Austin'},
        {'name': 'Alice', 'age': 30, 'city': 'Boston'},
        {'name': 'Eve', 'age': 35, 'city': 'Boston'}
    ]
    assert result2 == expected2, "Test 2 Failed"
    print("Test 2 PASSED")


if __name__ == "__main__":
    test_multiple_column_sorting()