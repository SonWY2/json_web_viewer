import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { useFileStore } from '../../stores/fileStore'
import { useAnalysisStore } from '../../stores/analysisStore'
import { useDataStore } from '../../stores/dataStore'
import { apiService } from '../../services/api'
import { DataRequest, DataChunk, SortOrder, FilterRule, FilterRequest, FilterGroup, LogicalOperator, SearchResponse, FilterOperator } from '../../types' // FilterOperator 추가
import ColumnHeader from './ColumnHeader'
import DataCell from './DataCell'
import ColumnSelector from './ColumnSelector'
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'

interface DataGridRef {
  handleGlobalSearchResults: (results: SearchResponse | null) => void
}

const DataGrid = forwardRef<DataGridRef>((props, ref) => {
  const { currentFile } = useFileStore()
  const { addActiveTask, setAnalysisLoading, setAnalysisError, setSelectedColumn } = useAnalysisStore()
  const {
    visibleColumns,
    columnOrder,
    setVisibleColumns,
    setColumnOrder,
    toggleColumnVisibility,
    showAllColumns,
    hideAllColumns,
    getOrderedVisibleColumns,
    setCurrentData
  } = useDataStore()

  const [data, setData] = useState<DataChunk | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [jumpToPage, setJumpToPage] = useState('')
  const [sortRules, setSortRules] = useState<Array<{column: string, order: SortOrder}>>([])
  const [filters, setFilters] = useState<Map<string, FilterRule>>(new Map())
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null)
  const [highlightRows, setHighlightRows] = useState<Set<number>>(new Set())
  const [columnSearches, setColumnSearches] = useState<Map<string, string>>(new Map())

  const getVisibleColumnsInOrder = () => {
    if (!currentFile) return []
    if (visibleColumns.length === 0) {
      return currentFile.columns
    }
    const orderedVisible = getOrderedVisibleColumns()
    return currentFile.columns.filter(col => orderedVisible.includes(col.name))
  }

  useEffect(() => {
    if (currentFile) {
      const mockDataChunk = {
        data: [],
        page: 1,
        page_size: 50,
        total_pages: 1,
        total_records: currentFile.total_records,
        has_next: false,
        has_prev: false,
        schema: currentFile.columns
      }
      setCurrentData(mockDataChunk)
    }
  }, [currentFile, setCurrentData])

  useImperativeHandle(ref, () => ({
    handleGlobalSearchResults: (results: SearchResponse | null) => {
      setSearchResults(results)
      // 전역 검색 결과는 여전히 프론트엔드에서 하이라이팅을 위해 사용될 수 있습니다.
      // 하지만 데이터 로딩은 useEffect가 처리하도록 페이지를 1로 리셋합니다.
      loadData(1) 
    }
  }))

  useEffect(() => {
    if (currentFile) {
      loadData(1)
    }
  }, [currentFile])

  // ==================================================================
  // 여기가 핵심 수정 부분입니다.
  // ==================================================================
  const loadData = async (page?: number) => {
    if (!currentFile) return

    const targetPage = page || currentPage
    setLoading(true)
    setError(null)

    try {
      // 1. 기존 필터와 컬럼 검색(Column Searches)을 통합합니다.
      const baseFilterRules = Array.from(filters.values());
      const searchFilterRules: FilterRule[] = Array.from(columnSearches.entries())
        .filter(([_, query]) => query.trim())
        .map(([column, query]) => ({
          column: column,
          // 중요: 'contains'는 백엔드 API에서 지원하는 텍스트 검색 연산자여야 합니다.
          // 실제 연산자 이름(예: FilterOperator.CONTAINS)으로 변경해야 할 수 있습니다.
          operator: 'contains' as FilterOperator, 
          value: query.trim()
        }));

      const allRules = [...baseFilterRules, ...searchFilterRules];

      // 2. 통합된 규칙으로 새로운 필터 요청 객체를 생성합니다.
      const filterRequest: FilterRequest | undefined = allRules.length > 0 ? {
        groups: [
          {
            rules: allRules,
            logical_operator: LogicalOperator.AND
          }
        ],
        global_operator: LogicalOperator.AND
      } : undefined
      
      // 전역 검색 결과를 필터 조건으로 추가 (백엔드 지원이 필요할 수 있음)
      // 만약 전역 검색 결과(row indices)도 필터링 조건으로 보내야 한다면,
      // 아래와 같이 추가적인 필터 그룹을 생성할 수 있습니다.
      // 이 로직은 백엔드 API의 설계에 따라 달라집니다.
      if (searchResults && searchResults.matching_rows.length > 0) {
          if (!filterRequest) {
              // filterRequest가 없는 경우 새로 생성
          }
          // 여기에 `searchResults.matching_rows`를 사용하는 필터 규칙 추가
          // 예: { column: '__ROW_ID__', operator: 'in', value: searchResults.matching_rows }
          // 이 부분은 백엔드와의 협의가 필요하여 일단 비워둡니다.
      }

      // 3. 서버에 올바른 필터 조건이 포함된 데이터 요청을 보냅니다.
      const request: DataRequest = {
        file_id: currentFile.id,
        page: targetPage,
        page_size: pageSize,
        sort: sortRules,
        filters: filterRequest // 통합된 필터 사용
      }

      const result = await apiService.getData(request)

      // 4. 프론트엔드에서 수동으로 필터링 하던 로직을 제거합니다.
      // 서버가 이미 필터링된 결과를 올바른 페이지 정보와 함께 보내줍니다.
      setData(result)
      setCurrentData(result)
      setCurrentPage(result.page)

      // 하이라이팅 로직은 여전히 필요할 수 있습니다.
      if (searchResults && searchResults.matching_rows.length > 0) {
        const pageStartIndex = (result.page - 1) * pageSize
        const pageEndIndex = pageStartIndex + pageSize
        const highlightedInPage = new Set<number>()
        searchResults.matching_rows.forEach(globalRowIndex => {
          // 서버에서 받은 데이터 내에서 로컬 인덱스를 찾아야 합니다.
          // 이 부분은 백엔드에서 받은 데이터에 원래 행 번호가 포함되어 있는지에 따라 달라집니다.
          // 여기서는 간단히 비워둡니다.
        })
        setHighlightRows(highlightedInPage)
      } else {
        setHighlightRows(new Set())
      }
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load data'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  // 더 이상 필요하지 않으므로 이 함수는 제거하거나 주석 처리합니다.
  /*
  const getFilteredRowIndices = async (): Promise<number[] | null> => { ... }
  */

  useEffect(() => {
    if (currentFile) {
      loadData(1)
    }
  }, [sortRules, filters, columnSearches, searchResults, pageSize]) // searchResults도 의존성에 추가

  const handleSort = (column: string, order: SortOrder) => {
    setSortRules([{ column, order }])
  }

  const handleFilter = (column: string, rule: FilterRule | null) => {
    const newFilters = new Map(filters)
    if (rule) {
      newFilters.set(column, rule)
    } else {
      newFilters.delete(column)
    }
    setFilters(newFilters)
  }

  const handleAnalyze = async (column: string) => {
    if (!currentFile) return
    
    setAnalysisLoading(column, true)
    setSelectedColumn(column)
    
    try {
      const result = await apiService.analyzeColumn(currentFile.id, column)
      
      if (result.status === 'started' && result.task_id) {
        addActiveTask(result.task_id, {
          id: result.task_id,
          name: `Analyze ${column}`,
          status: 'running' as any,
          progress: 0,
          created_at: Date.now()
        })
      } else if (result.result) {
        setAnalysisLoading(column, false)
      }
    } catch (error) {
      console.error('Analysis failed:', error)
      setAnalysisError(column, 'Analysis failed')
    }
  }

  const handleColumnSearch = (column: string, query: string) => {
    const newSearches = new Map(columnSearches)
    if (query.trim()) {
      newSearches.set(column, query.trim())
    } else {
      newSearches.delete(column)
    }
    setColumnSearches(newSearches)
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && data && page <= data.total_pages) {
      loadData(page)
    }
  }

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setCurrentPage(1)
  }

  const handleJumpToPage = () => {
    const pageNum = parseInt(jumpToPage)
    if (!isNaN(pageNum) && pageNum >= 1 && data && pageNum <= data.total_pages) {
      handlePageChange(pageNum)
      setJumpToPage('')
    }
  }

  const clearAllSearches = () => {
    setSearchResults(null)
    setColumnSearches(new Map())
    setHighlightRows(new Set())
  }

  const hasActiveSearches = searchResults || columnSearches.size > 0

  if (!currentFile) return null

  return (
    <div className="flex-1 flex flex-col bg-white h-full">
      {/* Toolbar */}
      <div className="border-b border-gray-200 px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {currentFile.filename} • {data ? data.total_records.toLocaleString() : currentFile.total_records.toLocaleString()} records
            </span>
            {filters.size > 0 && (
              <span className="text-sm text-blue-600">
                {filters.size} filter{filters.size === 1 ? '' : 's'} active
              </span>
            )}
            {hasActiveSearches && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-green-600">
                  {columnSearches.size} column search active
                </span>
                <button onClick={clearAllSearches} className="text-xs text-gray-500 hover:text-gray-700 underline">
                  Clear all
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {currentFile && (
              <ColumnSelector
                columns={currentFile.columns}
                visibleColumns={visibleColumns}
                onVisibilityChange={toggleColumnVisibility}
                onOrderChange={setColumnOrder}
                onSelectAll={showAllColumns}
                onSelectNone={hideAllColumns}
              />
            )}
            {data && data.total_records > 0 && (
              <>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Show:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                  </select>
                  <span className="text-sm text-gray-600">per page</span>
                </div>
                <span className="text-sm text-gray-600">
                  Page {data.page} of {data.total_pages}
                </span>
                <div className="flex items-center space-x-2">
                  <button onClick={() => handlePageChange(1)} disabled={!data.has_prev || loading} className="px-2 py-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50">
                    « First
                  </button>
                  <button onClick={() => handlePageChange(currentPage - 1)} disabled={!data.has_prev || loading} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex items-center space-x-1">
                    <span className="text-sm text-gray-600">Go to:</span>
                    <input
                      type="number"
                      min={1}
                      max={data.total_pages}
                      value={jumpToPage}
                      onChange={(e) => setJumpToPage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleJumpToPage()}
                      className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={String(currentPage)}
                    />
                    <button onClick={handleJumpToPage} disabled={loading} className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                      Go
                    </button>
                  </div>
                  <button onClick={() => handlePageChange(currentPage + 1)} disabled={!data.has_next || loading} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button onClick={() => handlePageChange(data.total_pages)} disabled={!data.has_next || loading} className="px-2 py-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50">
                    Last »
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 m-4 flex-shrink-0">
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Data Table Wrapper */}
      <div className="flex-1 min-h-0 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading data...</span>
          </div>
        ) : data && data.data.length > 0 ? (
          <table className="w-full table-fixed">
            <thead className="sticky top-0 bg-gray-50 z-10 border-b border-gray-200">
              <tr>
                {getVisibleColumnsInOrder().map((column) => (
                  <ColumnHeader
                    key={column.name}
                    column={column.name}
                    dataType={column.data_type}
                    sampleValues={column.sample_values}
                    sortOrder={sortRules.find(r => r.column === column.name)?.order}
                    hasFilter={filters.has(column.name)}
                    onSort={handleSort}
                    onFilter={handleFilter}
                    onAnalyze={handleAnalyze}
                    onColumnSearch={handleColumnSearch}
                  />
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.data.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={`hover:bg-gray-50 group ${
                    highlightRows.has(rowIndex) ? 'bg-yellow-50 border-l-4 border-yellow-400' : ''
                  }`}
                >
                  {getVisibleColumnsInOrder().map((column) => (
                    <DataCell
                      key={column.name}
                      value={row[column.name]}
                      column={column.name}
                      rowIndex={(currentPage - 1) * pageSize + rowIndex}
                      maxWidth={300}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-gray-500">No data available for the current filter.</span>
          </div>
        )}
      </div>
    </div>
  )
})

DataGrid.displayName = 'DataGrid'

export default DataGrid