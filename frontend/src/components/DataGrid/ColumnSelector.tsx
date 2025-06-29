import React, { useState } from 'react'
import { Settings, Eye, EyeOff, Move, ChevronDown, Ruler } from 'lucide-react'
import { ColumnInfo } from '../../types'
import { useDataStore } from '../../stores/dataStore'

interface ColumnSelectorProps {
  columns: ColumnInfo[]
  visibleColumns: string[]
  onVisibilityChange: (columnName: string, visible: boolean) => void
  onOrderChange: (columnNames: string[]) => void
  onSelectAll: () => void
  onSelectNone: () => void
  onResetWidths?: () => void
}

const ColumnSelector: React.FC<ColumnSelectorProps> = ({
  columns,
  visibleColumns,
  onVisibilityChange,
  onOrderChange,
  onSelectAll,
  onSelectNone,
  onResetWidths
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const { columnWidths } = useDataStore()

  const handleDragStart = (e: React.DragEvent, columnName: string) => {
    setDraggedItem(columnName)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetColumnName: string) => {
    e.preventDefault()
    if (!draggedItem || draggedItem === targetColumnName) return

    const currentOrder = columns.map(col => col.name)
    const draggedIndex = currentOrder.indexOf(draggedItem)
    const targetIndex = currentOrder.indexOf(targetColumnName)

    const newOrder = [...currentOrder]
    newOrder.splice(draggedIndex, 1)
    newOrder.splice(targetIndex, 0, draggedItem)

    onOrderChange(newOrder)
    setDraggedItem(null)
  }

  const visibleCount = visibleColumns.length
  const totalCount = columns.length

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <Settings className="w-4 h-4 text-gray-600" />
        <span className="text-sm text-gray-700">
          Columns ({visibleCount}/{totalCount})
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${
          isOpen ? 'rotate-180' : ''
        }`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {/* Header */}
          <div className="p-3 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-900">Column Visibility</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={onSelectAll}
                className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
              >
                Show All
              </button>
              <button
                onClick={onSelectNone}
                className="px-2 py-1 text-xs bg-gray-50 text-gray-600 rounded hover:bg-gray-100"
              >
                Hide All
              </button>
              {onResetWidths && (
                <button
                  onClick={onResetWidths}
                  className="px-2 py-1 text-xs bg-green-50 text-green-600 rounded hover:bg-green-100"
                  title="Reset all column widths to default"
                >
                  Reset Widths
                </button>
              )}
            </div>
          </div>

          {/* Column List */}
          <div className="max-h-96 overflow-y-auto">
            {columns.map((column, index) => {
            const isVisible = visibleColumns.includes(column.name)
            const currentWidth = columnWidths[column.name] || 200
            
            return (
            <div
            key={column.name}
            draggable
            onDragStart={(e) => handleDragStart(e, column.name)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.name)}
            className={`flex items-center space-x-3 p-3 border-b border-gray-100 cursor-move hover:bg-gray-50 ${
            draggedItem === column.name ? 'opacity-50' : ''
            }`}
            >
            <Move className="w-4 h-4 text-gray-400 flex-shrink-0" />
            
            <label className="flex items-center space-x-2 flex-1 cursor-pointer">
            <input
            type="checkbox"
            checked={isVisible}
            onChange={(e) => onVisibilityChange(column.name, e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {isVisible ? (
                <Eye className="w-4 h-4 text-green-500" />
                ) : (
                <EyeOff className="w-4 h-4 text-gray-400" />
                )}
                <span className="text-sm font-medium text-gray-900 truncate">
                {column.name}
                </span>
              </div>
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <Ruler className="w-3 h-3" />
                <span>{currentWidth}px</span>
              </div>
            </div>
            <div className="text-xs text-gray-500">
            {column.data_type} • {column.sample_values?.length || 0} samples
              {column.unique_count && ` • ${column.unique_count} unique`}
              </div>
              </div>
              </label>
              </div>
              )
          })}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <div className="text-xs text-gray-600">
              Drag to reorder • {visibleCount} of {totalCount} columns visible
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ColumnSelector
