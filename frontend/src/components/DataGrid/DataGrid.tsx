import React, { useState, useEffect } from 'react'
import { useFileStore } from '../../stores/fileStore'
import { apiService } from '../../services/api'
import { DataRequest, DataChunk, SortOrder, FilterRule, FilterRequest, FilterGroup, LogicalOperator } from '../../types'
import ColumnHeader from './ColumnHeader'
import DataCell from './DataCell'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const DataGrid: React.FC = () => {
  const { currentFile } = useFileStore()
  const [data, setData] = useState<DataChunk | null>(null)
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(50)
  const [sortRules, setSortRules] = useState<Array<{column: string, order: SortOrder}>>([])
  const [filters, setFilters] = useState<Map<string, FilterRule>>(new Map())

  useEffect(() => {
    if (currentFile) {
      loadData(1)
    }
  }, [currentFile])

  const loadData = async (page: number) => {
    if (!currentFile) return

    setLoading(true)
    try {
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
        page,
        page_size: pageSize,
        sort: sortRules,
        filters: filterRequest
      }

      const result = await apiService.getData(request)
      setData(result)
      setCurrentPage(result.page)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (column: string, order: SortOrder) => {
    setSortRules([{ column, order }])
    loadData(1)
  }

  const handleFilter = (column: string, rule: FilterRule | null) => {
    const newFilters = new Map(filters)
    
    if (rule) {
      newFilters.set(column, rule)
    } else {
      newFilters.delete(column)
    }
    
    setFilters(newFilters)
    loadData(1)
  }

  const handleAnalyze = async (column: string) => {
    if (!currentFile) return
    
    try {
      const result = await apiService.analyzeColumn(currentFile.id, column)
      console.log('Analysis started:', result)
    } catch (error) {
      console.error('Analysis failed:', error)
    }
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && data && page <= data.total_pages) {
      loadData(page)
    }
  }

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
          </div>
          
          {data && (
            <div className="flex items-center space-x-4">
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
            </div>
          )}
        </div>
      </div>

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
                {currentFile.columns.map((column) => (
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
                  />
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.data.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50 group">
                  {currentFile.columns.map((column) => (
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
          <div className="flex items-center justify-center h-32">
            <span className="text-gray-500">No data available</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default DataGrid
