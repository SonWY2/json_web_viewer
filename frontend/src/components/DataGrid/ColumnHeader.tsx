import React, { useState } from 'react'
import { ChevronUp, ChevronDown, BarChart3, Filter, Search } from 'lucide-react'
import { SortOrder, FilterRule } from '../../types'
import FilterDropdown from '../Filters/FilterDropdown'

interface ColumnHeaderProps {
  column: string
  dataType: string
  sampleValues: string[]
  sortOrder?: SortOrder
  hasFilter: boolean
  onSort: (column: string, order: SortOrder) => void
  onFilter: (column: string, rule: FilterRule | null) => void
  onAnalyze?: (column: string) => void
  onColumnSearch?: (column: string, query: string) => void
}

const ColumnHeader: React.FC<ColumnHeaderProps> = ({
  column,
  dataType,
  sampleValues,
  sortOrder,
  hasFilter,
  onSort,
  onFilter,
  onAnalyze,
  onColumnSearch
}) => {
  const [showColumnSearch, setShowColumnSearch] = useState(false)
  const [columnSearchQuery, setColumnSearchQuery] = useState('')

  const handleSort = () => {
    const newOrder = sortOrder === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC
    onSort(column, newOrder)
  }

  const handleFilter = (rule: FilterRule | null) => {
    onFilter(column, rule)
  }

  const handleAnalyze = () => {
    onAnalyze?.(column)
  }

  const handleColumnSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (columnSearchQuery.trim()) {
      onColumnSearch?.(column, columnSearchQuery.trim())
    }
  }

  const getSortIcon = () => {
    if (sortOrder === SortOrder.ASC) return <ChevronUp className="w-4 h-4 text-blue-600" />
    if (sortOrder === SortOrder.DESC) return <ChevronDown className="w-4 h-4 text-blue-600" />
    return <div className="w-4 h-4 flex flex-col">
      <ChevronUp className="w-4 h-2 text-gray-300" />
      <ChevronDown className="w-4 h-2 text-gray-300 -mt-1" />
    </div>
  }

  return (
    <th className="bg-gray-50 border-b border-gray-200 relative">
      <div className="p-3 space-y-2">
        {/* Column Name and Sort */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleSort}
            className="flex items-center space-x-2 text-left hover:text-blue-600 flex-1 min-w-0"
            title="Click to sort"
          >
            <span className="text-xs font-medium text-gray-700 uppercase tracking-wider truncate">
              {column}
            </span>
            {getSortIcon()}
          </button>
        </div>

        {/* Data Type */}
        <div className="text-xs text-gray-500 mb-2">
          {dataType}
        </div>

        {/* Action Buttons - Always Visible */}
        <div className="flex items-center space-x-1">
          <FilterDropdown
            column={column}
            values={sampleValues}
            onFilter={handleFilter}
            isActive={hasFilter}
          />
          
          <button
            onClick={() => setShowColumnSearch(!showColumnSearch)}
            className={`p-1 rounded hover:bg-gray-100 ${showColumnSearch ? 'text-blue-600 bg-blue-50' : 'text-gray-500'}`}
            title="Search in this column"
          >
            <Search className="w-4 h-4" />
          </button>
          
          {onAnalyze && (
            <button
              onClick={handleAnalyze}
              className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-blue-600"
              title="Analyze this column"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Column Search Input */}
        {showColumnSearch && (
          <form onSubmit={handleColumnSearch} className="mt-2">
            <div className="relative">
              <input
                type="text"
                value={columnSearchQuery}
                onChange={(e) => setColumnSearchQuery(e.target.value)}
                placeholder={`Search in ${column}...`}
                className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
              <button
                type="submit"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 p-0.5 text-gray-400 hover:text-blue-600"
              >
                <Search className="w-3 h-3" />
              </button>
            </div>
          </form>
        )}

        {/* Active Indicators */}
        <div className="flex items-center space-x-1">
          {hasFilter && (
            <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
              Filtered
            </span>
          )}
          {sortOrder && (
            <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
              Sorted {sortOrder === SortOrder.ASC ? '↑' : '↓'}
            </span>
          )}
        </div>
      </div>
    </th>
  )
}

export default ColumnHeader
