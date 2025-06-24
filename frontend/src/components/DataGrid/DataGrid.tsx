import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { useFileStore } from '../../stores/fileStore'
import { useAnalysisStore } from '../../stores/analysisStore'
import { useDataStore } from '../../stores/dataStore'
import { apiService } from '../../services/api'
import { DataRequest, DataChunk, SortOrder, FilterRule, FilterRequest, FilterGroup, LogicalOperator, SearchResponse } from '../../types'
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
  const [pageSize] = useState(50)
  const [sortRules, setSortRules] = useState<Array<{column: string, order: SortOrder}>>([])
  const [filters, setFilters] = useState<Map<string, FilterRule>>(new Map())
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null)
  const [highlightRows, setHighlightRows] = useState<Set<number>>(new Set())
  const [columnSearches, setColumnSearches] = useState<Map<string, string>>(new Map())

  // Get visible columns in correct order
  const getVisibleColumnsInOrder = () => {
    if (!currentFile) return []
    
    // If no columns are visible, show all by default
    if (visibleColumns.length === 0) {
      return currentFile.columns
    }
    
    const orderedVisible = getOrderedVisibleColumns()
    return currentFile.columns.filter(col => orderedVisible.includes(col.name))
  }

  // Initialize dataStore when currentFile changes
  useEffect(() => {
    if (currentFile) {
      // Create a mock DataChunk to initialize column state
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

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    handleGlobalSearchResults: (results: SearchResponse | null) => {
      setSearchResults(results)
      
      if (results && results.matching_rows.length > 0) {
        const firstMatchPage = Math.floor(results.matching_rows[0] / pageSize) + 1
        loadData(firstMatchPage)
      } else {
        setHighlightRows(new Set())
      }
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
      // Combine regular filters with search-based filtering
      const allMatchingRows = await getFilteredRowIndices()
      
      const filterRequest: FilterRequest | undefined = filters.size > 0 ? {
        groups: [
          {
            rules: Array.from(filters.values()),
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
      
      // If we have search results, filter the returned data
      if (allMatchingRows && allMatchingRows.length > 0) {
        const pageStartIndex = (targetPage - 1) * pageSize
        const pageEndIndex = pageStartIndex + pageSize
        
        // Filter data based on search results
        const filteredData = result.data.filter((_, index) => {
          const globalRowIndex = pageStartIndex + index
          return allMatchingRows.includes(globalRowIndex)
        })
        
        result.data = filteredData
        
        // Update highlight rows
        const highlightedInPage = new Set<number>()
        allMatchingRows.forEach(rowIndex => {
          if (rowIndex >= pageStartIndex && rowIndex < pageEndIndex) {
            const localIndex = result.data.findIndex((_, idx) => pageStartIndex + idx === rowIndex)
            if (localIndex !== -1) {
              highlightedInPage.add(localIndex)
            }
          }
        })
        setHighlightRows(highlightedInPage)
      } else {
        setHighlightRows(new Set())
      }
      
      setData(result)
      setCurrentData(result)  // Update dataStore with actual data
      setCurrentPage(result.page)
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load data'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredRowIndices = async (): Promise<number[] | null> => {
    if (!currentFile) return null
    
    const searchQueries = Array.from(columnSearches.entries()).filter(([_, query]) => query.trim())
    if (searchQueries.length === 0 && !searchResults) return null
    
    let allMatches: number[] = []
    
    // Add global search results
    if (searchResults) {
      allMatches = [...searchResults.matching_rows]
    }
    
    // Add column search results
    for (const [column, query] of searchQueries) {
      try {
        const result = await apiService.search({
          file_id: currentFile.id,
          query: query.trim(),
          column,
          limit: 10000
        })
        
        if (allMatches.length === 0) {
          allMatches = result.matching_rows
        } else {
          // Intersect with existing matches
          allMatches = allMatches.filter(row => result.matching_rows.includes(row))
        }
      } catch (error) {
        console.error(`Column search failed for ${column}:`, error)
      }
    }
    
    return allMatches.length > 0 ? allMatches : null
  }

  // Auto-reload when dependencies change
  useEffect(() => {
    if (currentFile) {
      loadData(1)
    }
  }, [sortRules, filters, columnSearches])

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

  const clearAllSearches = () => {
    setSearchResults(null)
    setColumnSearches(new Map())
    setHighlightRows(new Set())
  }

  const hasActiveSearches = searchResults || columnSearches.size > 0

  if (!currentFile) return null

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Toolbar */}
      <div className="border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {currentFile.filename} • {currentFile.total_records.toLocaleString()} records
            </span>
            {filters.size > 0 && (
              <span className="text-sm text-blue-600">
                {filters.size} filter{filters.size === 1 ? '' : 's'} active
              </span>
            )}
            {hasActiveSearches && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-green-600">
                  {searchResults ? `${searchResults.total_matches} global matches` : ''}
                  {columnSearches.size > 0 ? ` • ${columnSearches.size} column search${columnSearches.size === 1 ? '' : 'es'}` : ''}
                </span>
                <button
                  onClick={clearAllSearches}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Column Selector */}
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
            
            {data && (
              <>
                <span className="text-sm text-gray-600">
                  Page {data.page} of {data.total_pages} ({data.total_records.toLocaleString()} total)
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!data.has_prev || loading}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!data.has_next || loading}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 m-4">
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading data...</span>
          </div>
        ) : data ? (
          <table className="w-full">
            <thead className="sticky top-0 bg-gray-50">
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
          <div className="flex items-center justify-center h-32">
            <span className="text-gray-500">No data available</span>
          </div>
        )}
      </div>
    </div>
  )
})

DataGrid.displayName = 'DataGrid'

export default DataGrid
