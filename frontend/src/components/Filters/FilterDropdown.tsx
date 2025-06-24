import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Filter, X } from 'lucide-react'
import { FilterOperator, FilterRule } from '../../types'

interface FilterDropdownProps {
  column: string
  values: string[]
  onFilter: (rule: FilterRule | null) => void
  isActive?: boolean
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({ 
  column, 
  values, 
  onFilter, 
  isActive = false 
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [operator, setOperator] = useState<FilterOperator>(FilterOperator.CONTAINS)
  const [filterValue, setFilterValue] = useState('')
  const [selectedValues, setSelectedValues] = useState<string[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const operators = [
    { value: FilterOperator.CONTAINS, label: 'Contains' },
    { value: FilterOperator.EQUALS, label: 'Equals' },
    { value: FilterOperator.NOT_EQUALS, label: 'Not equals' },
    { value: FilterOperator.STARTS_WITH, label: 'Starts with' },
    { value: FilterOperator.ENDS_WITH, label: 'Ends with' },
    { value: FilterOperator.IS_NULL, label: 'Is empty' },
    { value: FilterOperator.IS_NOT_NULL, label: 'Is not empty' },
  ]

  const applyFilter = () => {
    let rule: FilterRule | null = null

    if (operator === FilterOperator.IN && selectedValues.length > 0) {
      rule = {
        column,
        operator: FilterOperator.IN,
        value: selectedValues
      }
    } else if (operator === FilterOperator.IS_NULL || operator === FilterOperator.IS_NOT_NULL) {
      rule = {
        column,
        operator
      }
    } else if (filterValue.trim()) {
      rule = {
        column,
        operator,
        value: filterValue.trim()
      }
    }

    onFilter(rule)
    setIsOpen(false)
  }

  const clearFilter = () => {
    setFilterValue('')
    setSelectedValues([])
    onFilter(null)
    setIsOpen(false)
  }

  const toggleValue = (value: string) => {
    setSelectedValues(prev => 
      prev.includes(value) 
        ? prev.filter(v => v !== value)
        : [...prev, value]
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-1 rounded hover:bg-gray-100 ${
          isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-400'
        }`}
      >
        <Filter className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4 space-y-4">
            {/* Operator Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter type
              </label>
              <select
                value={operator}
                onChange={(e) => setOperator(e.target.value as FilterOperator)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                {operators.map(op => (
                  <option key={op.value} value={op.value}>{op.label}</option>
                ))}
                <option value={FilterOperator.IN}>Select values</option>
              </select>
            </div>

            {/* Value Input */}
            {operator !== FilterOperator.IS_NULL && 
             operator !== FilterOperator.IS_NOT_NULL && 
             operator !== FilterOperator.IN && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Value
                </label>
                <input
                  type="text"
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  placeholder="Enter filter value..."
                />
              </div>
            )}

            {/* Value Selection */}
            {operator === FilterOperator.IN && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select values ({selectedValues.length} selected)
                </label>
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded">
                  {values.slice(0, 100).map((value, index) => (
                    <label key={index} className="flex items-center p-2 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedValues.includes(value)}
                        onChange={() => toggleValue(value)}
                        className="mr-2"
                      />
                      <span className="text-sm truncate">{value || '(empty)'}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-2">
              <button
                onClick={applyFilter}
                className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
              >
                Apply
              </button>
              <button
                onClick={clearFilter}
                className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FilterDropdown
