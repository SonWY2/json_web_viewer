// Data Models
export interface FileMetadata {
  id: string
  filename: string
  original_filename: string
  file_path: string
  file_size: number
  total_records: number
  estimated_records?: number
  columns: ColumnInfo[]
  upload_time: string
  processing_status: string
  sample_data: Record<string, any>[]
  schema_version: string
}

export interface ColumnInfo {
  name: string
  data_type: DataType
  nullable: boolean
  sample_values: any[]
  unique_count?: number
  null_count?: number
}

export enum DataType {
  STRING = "string",
  NUMBER = "number",
  BOOLEAN = "boolean",
  OBJECT = "object",
  ARRAY = "array",
  NULL = "null",
  DATE = "date"
}

export interface DataChunk {
  data: Record<string, any>[]
  page: number
  page_size: number
  total_pages: number
  total_records: number
  has_next: boolean
  has_prev: boolean
}

// Filter Types
export enum FilterOperator {
  EQUALS = "equals",
  NOT_EQUALS = "not_equals",
  CONTAINS = "contains",
  NOT_CONTAINS = "not_contains",
  STARTS_WITH = "starts_with",
  ENDS_WITH = "ends_with",
  GREATER_THAN = "greater_than",
  LESS_THAN = "less_than",
  GREATER_EQUAL = "greater_equal",
  LESS_EQUAL = "less_equal",
  IN = "in",
  NOT_IN = "not_in",
  IS_NULL = "is_null",
  IS_NOT_NULL = "is_not_null",
  REGEX = "regex"
}

export enum LogicalOperator {
  AND = "and",
  OR = "or"
}

export interface FilterRule {
  column: string
  operator: FilterOperator
  value?: string | number | boolean | any[]
  case_sensitive?: boolean
}

export interface FilterGroup {
  rules: FilterRule[]
  logical_operator: LogicalOperator
}

export interface FilterRequest {
  groups: FilterGroup[]
  global_operator: LogicalOperator
}

export enum SortOrder {
  ASC = "asc",
  DESC = "desc"
}

export interface SortRule {
  column: string
  order: SortOrder
}

export interface DataRequest {
  file_id: string
  page: number
  page_size: number
  filters?: FilterRequest
  sort?: SortRule[]
  search?: string
}

// Task Types
export enum TaskStatus {
  PENDING = "pending",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled"
}

export interface TaskInfo {
  id: string
  name: string
  status: TaskStatus
  progress: number
  result?: any
  error?: string
  created_at: number
  started_at?: number
  completed_at?: number
}

// Search Types
export interface SearchRequest {
  file_id: string
  query: string
  column?: string
  regex?: boolean
  limit?: number
}

export interface SearchResponse {
  matching_rows: number[]
  total_matches: number
  query: string
  execution_time_ms: number
}

// Analysis Types
export interface ColumnAnalysis {
  column: string
  data_type: string
  total_records: number
  non_null_count: number
  null_count: number
  null_percentage: number
  unique_count: number
  unique_percentage: number
  most_common_values: Array<[string, number]>
  length_stats?: {
    min: number
    max: number
    mean: number
    median: number
    std_dev: number
  }
  numeric_stats?: {
    min: number
    max: number
    mean: number
    median: number
    std_dev: number
    q1: number
    q3: number
    histogram: Array<{range: string, count: number, percentage: number}>
  }
}

// UI Types
export type ViewMode = 'table' | 'card' | 'json'

export interface PaginationState {
  currentPage: number
  pageSize: number
  totalPages: number
  totalRecords: number
}

export interface SortState {
  column?: string
  direction?: SortOrder
}

export interface SearchState {
  query: string
  column?: string
  isSearching: boolean
  results?: SearchResponse
}
