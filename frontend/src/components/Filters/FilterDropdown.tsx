import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Filter } from 'lucide-react'
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
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        const dropdownElement = document.getElementById(`filter-dropdown-${column}`)
        if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
          setIsOpen(false)
        }
      }
    }

    const handleScroll = () => {
      if (isOpen) {
        updatePosition()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('scroll', handleScroll, true)
    window.addEventListener('resize', handleScroll)
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', handleScroll)
    }
  }, [isOpen, column])

  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX
      })
    }
  }

  const handleToggle = () => {
    if (!isOpen) {
      updatePosition()
    }
    setIsOpen(!isOpen)
  }

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
      rule = { column, operator: FilterOperator.IN, value: selectedValues }
    } else if (operator === FilterOperator.IS_NULL || operator === FilterOperator.IS_NOT_NULL) {
      rule = { column, operator }
    } else if (filterValue.trim()) {
      rule = { column, operator, value: filterValue.trim() }
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

  const dropdownContent = isOpen ? (
    <div
      id={`filter-dropdown-${column}`}
      className="fixed w-80 bg-white border border-gray-300 rounded-lg shadow-2xl"
      style={{
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        zIndex: 10000
      }}
    >
      <div className="p-4 space-y-4">
        {/* Operator Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filter type
          </label>
          <select
            value={operator}
            onChange={(e) => setOperator(e.target.value as FilterOperator)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500"
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
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500"
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
            <div className="max-h-40 overflow-y-auto border border-gray-300 rounded bg-white">
              {values.slice(0, 100).map((value, index) => (
                <label 
                  key={index} 
                  className="flex items-center p-2 hover:bg-gray-50 cursor-pointer"
                >
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
        <div className="flex space-x-2 pt-2 border-t border-gray-200">
          <button
            onClick={applyFilter}
            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
          >
            Apply
          </button>
          <button
            onClick={clearFilter}
            className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 bg-white focus:ring-2 focus:ring-blue-500"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  ) : null

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className={`p-1 rounded hover:bg-gray-100 ${
          isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-400'
        }`}
      >
        <Filter className="w-4 h-4" />
      </button>

      {dropdownContent && createPortal(dropdownContent, document.body)}
    </>
  )
}

export default FilterDropdown
