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
  width?: number
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
  onColumnSearch,
  width
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

  const getTypeAbbreviation = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'string': 'STR',
      'text': 'TXT', 
      'integer': 'INT',
      'number': 'NUM',
      'float': 'FLT',
      'boolean': 'BOL',
      'object': 'OBJ',
      'array': 'ARR',
      'date': 'DAT',
      'datetime': 'DTM'
    }
    return typeMap[type.toLowerCase()] || type.slice(0, 3).toUpperCase()
  }

  return (
    <div 
      className="px-2 py-1 h-full pr-2 w-full"
    >
        {/* Header content - 완전히 독립적인 영역 */}
        <div className="relative">
          {/* Top row: Column name, type, sort */}
          <div className="flex items-center justify-between mb-1">
            <button
              onClick={handleSort}
              className="flex items-center justify-between text-left hover:text-blue-600 group cursor-pointer flex-1 w-full"
              title={`Click to sort ${column} (${dataType})`}
            >
              {/* Group for column name and type */}
              <div className="flex items-center flex-1 min-w-0">
                <span 
                  className="text-xs font-medium text-gray-700 uppercase tracking-wider truncate"
                  style={{
                    flexGrow: 1,
                    marginRight: '2px',
                    minWidth: '0'
                  }}
                >
                  {column}
                </span>
                <span className="text-xs px-1 py-0.5 bg-gray-200 text-gray-600 rounded font-mono opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  {getTypeAbbreviation(dataType)}
                </span>
              </div>

              {/* Sort icon on the right */}
              <div className="flex-shrink-0">
                {getSortIcon()}
              </div>
            </button>
          </div>
          
          {/* Bottom row: Action buttons and status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-0.5">
              <FilterDropdown
                column={column}
                values={sampleValues}
                onFilter={handleFilter}
                isActive={hasFilter}
              />
              
              <button
                onClick={() => setShowColumnSearch(!showColumnSearch)}
                className={`p-0.5 rounded hover:bg-gray-100 transition-colors cursor-pointer ${showColumnSearch ? 'text-blue-600 bg-blue-50' : 'text-gray-500'}`}
                title="Search in this column"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <Search className="w-3 h-3" />
              </button>
              
              {onAnalyze && (
                <button
                  onClick={handleAnalyze}
                  className="p-0.5 rounded hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors cursor-pointer"
                  title="Analyze this column"
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <BarChart3 className="w-3 h-3" />
                </button>
              )}
            </div>
            
            {/* Status indicators */}
            <div className="flex items-center">
              {hasFilter && (
                <span className="text-xs px-0.5 py-0.5 bg-blue-100 text-blue-700 rounded font-medium" title="Filtered">
                  F
                </span>
              )}
              {sortOrder && (
                <span className="text-xs px-0.5 py-0.5 bg-green-100 text-green-700 rounded font-medium" title={`Sorted ${sortOrder === SortOrder.ASC ? 'Ascending' : 'Descending'}`}>
                  {sortOrder === SortOrder.ASC ? '↑' : '↓'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Column Search Input */}
        {showColumnSearch && (
          <div className="mt-2 relative">
            <form onSubmit={handleColumnSearch}>
              <div className="relative">
                <input
                  type="text"
                  value={columnSearchQuery}
                  onChange={(e) => setColumnSearchQuery(e.target.value)}
                  placeholder={`Search in ${column}...`}
                  className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 p-0.5 text-gray-400 hover:text-blue-600"
                  onMouseDown={(e) => e.stopPropagation()}
                  style={{
                    cursor: 'pointer !important'
                  }}
                >
                  <Search className="w-3 h-3" />
                </button>
              </div>
            </form>
          </div>
        )}
    </div>
  )
}

export default ColumnHeader
