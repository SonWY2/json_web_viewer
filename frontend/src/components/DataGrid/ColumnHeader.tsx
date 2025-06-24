import React, { useState } from 'react'
import { ChevronUp, ChevronDown, BarChart3 } from 'lucide-react'
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
}

const ColumnHeader: React.FC<ColumnHeaderProps> = ({
  column,
  dataType,
  sampleValues,
  sortOrder,
  hasFilter,
  onSort,
  onFilter,
  onAnalyze
}) => {
  const [showTooltip, setShowTooltip] = useState(false)

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

  return (
    <th className="group relative bg-gray-50 border-b border-gray-200">
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <button
            onClick={handleSort}
            className="flex items-center space-x-1 text-left hover:text-blue-600 min-w-0 flex-1"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <span className="text-xs font-medium text-gray-700 uppercase tracking-wider truncate">
              {column}
            </span>
            <div className="flex flex-col">
              <ChevronUp 
                className={`w-3 h-3 ${sortOrder === SortOrder.ASC ? 'text-blue-600' : 'text-gray-300'}`} 
              />
              <ChevronDown 
                className={`w-3 h-3 -mt-1 ${sortOrder === SortOrder.DESC ? 'text-blue-600' : 'text-gray-300'}`} 
              />
            </div>
          </button>
        </div>

        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <FilterDropdown
            column={column}
            values={sampleValues}
            onFilter={handleFilter}
            isActive={hasFilter}
          />
          
          {onAnalyze && (
            <button
              onClick={handleAnalyze}
              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600"
              title="Analyze column"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute top-full left-0 mt-1 bg-black text-white text-xs rounded px-2 py-1 z-50 whitespace-nowrap">
          <div>{column}</div>
          <div className="text-gray-300">Type: {dataType}</div>
          <div className="text-gray-300">Click to sort</div>
        </div>
      )}

      {/* Filter indicator */}
      {hasFilter && (
        <div className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full"></div>
      )}
    </th>
  )
}

export default ColumnHeader
