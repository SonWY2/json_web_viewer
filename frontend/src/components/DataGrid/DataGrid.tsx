import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { useFileStore } from '../../stores/fileStore'
import { useAnalysisStore } from '../../stores/analysisStore'
import { useDataStore } from '../../stores/dataStore'
import { apiService } from '../../services/api'
import { DataRequest, DataChunk, SortOrder, FilterRule, FilterRequest, FilterGroup, LogicalOperator, SearchResponse, FilterOperator, Column } from '../../types'
import ColumnHeader from './ColumnHeader'
import DataCell from './DataCell'
import ColumnSelector from './ColumnSelector'
import ResizeHandle from './ResizeHandle'
import { useColumnResize } from '../../hooks/useColumnResize'
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'

interface DataGridRef {
  handleGlobalSearchResults: (results: SearchResponse | null) => void
}

interface ResizableHeaderProps {
  column: Column
  sortOrder?: SortOrder
  hasFilter: boolean
  onSort: (column: string, order: SortOrder) => void
  onFilter: (column: string, rule: FilterRule | null) => void
  onAnalyze?: (column: string) => void
  onColumnSearch?: (column: string, query: string) => void
}

const ResizableHeader: React.FC<ResizableHeaderProps> = ({ column, sortOrder, hasFilter, onSort, onFilter, onAnalyze, onColumnSearch }) => {
  const { width, isResizing, resizeHandleProps } = useColumnResize({
    columnId: column.name,
    initialWidth: 150,
    minWidth: 80,
    maxWidth: 800,
  });

  return (
    <th
      className="bg-gray-50 border-b border-gray-200 p-0 relative select-none"
      style={{
        width: `${width}px`
      }}
    >
      <div className="relative w-full h-full">
        <ColumnHeader
          column={column.name}
          dataType={column.data_type}
          sampleValues={column.sample_values}
          sortOrder={sortOrder}
          hasFilter={hasFilter}
          onSort={onSort}
          onFilter={onFilter}
          onAnalyze={onAnalyze}
          onColumnSearch={onColumnSearch}
          width={width}
        />
        <div className="absolute top-0 right-0 w-1.5 h-full">
          <ResizeHandle
            column={column.name}
            isResizing={isResizing}
            resizeHandleProps={resizeHandleProps}
          />
        </div>
      </div>
    </th>
  );
};

const DataGrid = forwardRef<DataGridRef>((props, ref) => {
  const { currentFile } = useFileStore()
  const { addActiveTask, setAnalysisLoading, setAnalysisError, setSelectedColumn } = useAnalysisStore()
  const {
    visibleColumns,
    columnOrder,
    columnWidths,
    setColumnWidth,
    setColumnOrder,
    toggleColumnVisibility,
    showAllColumns,
    hideAllColumns,
    resetColumnWidths,
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

  const allColumnsInOrder = React.useMemo(() => {
    if (!currentFile?.columns) return []
    const columnMap = new Map(currentFile.columns.map(c => [c.name, c]))
    const ordered = columnOrder
      .map(name => columnMap.get(name))
      .filter((c): c is Column => !!c)
    const orderedNames = new Set(ordered.map(c => c.name))
    const newColumns = currentFile.columns.filter(c => !orderedNames.has(c.name))
    return [...ordered, ...newColumns]
  }, [currentFile?.columns, columnOrder])

  const visibleColumnsInOrder = React.useMemo(() => {
    return allColumnsInOrder.filter(c => visibleColumns.includes(c.name))
  }, [allColumnsInOrder, visibleColumns])

  const calculateInitialColumnWidths = React.useCallback(() => {
    if (!currentFile) return
    
    const visibleCols = visibleColumnsInOrder
    if (visibleCols.length === 0) return
    
    const hasExistingWidths = visibleCols.some(col => columnWidths[col.name])
    if (hasExistingWidths) return
    
    // Set default width to 150px instead of calculating based on screen width
    const defaultWidth = 150
    
    visibleCols.forEach(col => {
      if (!columnWidths[col.name]) {
        setColumnWidth(col.name, defaultWidth)
      }
    })
  }, [currentFile, visibleColumnsInOrder, columnWidths, setColumnWidth])

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
      calculateInitialColumnWidths() // Call directly
    }
  }, [currentFile, setCurrentData, calculateInitialColumnWidths])

  useImperativeHandle(ref, () => ({
    handleGlobalSearchResults: (results: SearchResponse | null) => {
      setSearchResults(results)
      loadData(1) 
    }
  }))

  useEffect(() => {
    if (currentFile) {
      loadData(1)
    }
  }, [currentFile])

  const loadData = async (page?: number) => {
    if (!currentFile) return

    const targetPage = page || currentPage
    setLoading(true)
    setError(null)

    try {
      const baseFilterRules = Array.from(filters.values());
      const searchFilterRules: FilterRule[] = Array.from(columnSearches.entries())
        .filter(([_, query]) => query.trim())
        .map(([column, query]) => ({
          column: column,
          operator: 'contains' as FilterOperator, 
          value: query.trim()
        }));

      const allRules = [...baseFilterRules, ...searchFilterRules];

      const filterRequest: FilterRequest | undefined = allRules.length > 0 ? {
        groups: [
          {
            rules: allRules,
            logical_operator: LogicalOperator.AND
          }
        ],
        global_operator: LogicalOperator.AND
      } : undefined

      const request: DataRequest = {
        file_id: currentFile.id,
        page: targetPage,
        page_size: pageSize,
        sort: sortRules,
        filters: filterRequest
      }

      const result = await apiService.getData(request)

      setData(result)
      setCurrentData(result)
      setCurrentPage(result.page)

      if (searchResults && searchResults.matching_rows.length > 0) {
        const pageStartIndex = (result.page - 1) * pageSize
        const highlightedInPage = new Set<number>()
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

  useEffect(() => {
    if (currentFile) {
      loadData(1)
    }
  }, [sortRules, filters, columnSearches, searchResults, pageSize])

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
                columns={allColumnsInOrder} // Changed
                visibleColumns={visibleColumns}
                onVisibilityChange={toggleColumnVisibility}
                onOrderChange={setColumnOrder}
                onSelectAll={showAllColumns}
                onSelectNone={hideAllColumns}
                onResetWidths={resetColumnWidths}
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
          <table 
            className="data-grid-table" 
            style={{ 
              tableLayout: 'fixed',
              width: `${visibleColumnsInOrder.reduce((sum, col) => sum + (columnWidths[col.name] || 150), 0)}px`
            }}
          >
            <colgroup>
              {visibleColumnsInOrder.map((column) => (
                <col 
                  key={column.name} 
                  style={{ width: `${columnWidths[column.name] || 150}px` }} 
                />
              ))}
            </colgroup>
            <thead className="sticky top-0 bg-gray-50 z-10 border-b border-gray-200">
              <tr>
                {visibleColumnsInOrder.map((column) => (
                  <ResizableHeader
                    key={column.name}
                    column={column}
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
                  {visibleColumnsInOrder.map((column) => (
                    <DataCell
                      key={column.name}
                      value={row[column.name]}
                      column={column.name}
                      rowIndex={(currentPage - 1) * pageSize + rowIndex}
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
