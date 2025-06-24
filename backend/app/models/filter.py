from pydantic import BaseModel
from typing import List, Dict, Any, Optional, Union
from enum import Enum

class FilterOperator(Enum):
    EQUALS = "equals"
    NOT_EQUALS = "not_equals"
    CONTAINS = "contains"
    NOT_CONTAINS = "not_contains"
    STARTS_WITH = "starts_with"
    ENDS_WITH = "ends_with"
    GREATER_THAN = "greater_than"
    LESS_THAN = "less_than"
    GREATER_EQUAL = "greater_equal"
    LESS_EQUAL = "less_equal"
    IN = "in"
    NOT_IN = "not_in"
    IS_NULL = "is_null"
    IS_NOT_NULL = "is_not_null"
    REGEX = "regex"

class LogicalOperator(Enum):
    AND = "and"
    OR = "or"

class FilterRule(BaseModel):
    column: str
    operator: FilterOperator
    value: Optional[Union[str, int, float, bool, List[Any]]] = None
    case_sensitive: bool = True

class FilterGroup(BaseModel):
    rules: List[FilterRule]
    logical_operator: LogicalOperator = LogicalOperator.AND

class FilterRequest(BaseModel):
    groups: List[FilterGroup]
    global_operator: LogicalOperator = LogicalOperator.AND

class SortOrder(Enum):
    ASC = "asc"
    DESC = "desc"

class SortRule(BaseModel):
    column: str
    order: SortOrder = SortOrder.ASC

class DataRequest(BaseModel):
    file_id: str
    page: int = 1
    page_size: int = 50
    filters: Optional[FilterRequest] = None
    sort: Optional[List[SortRule]] = None
    search: Optional[str] = None
