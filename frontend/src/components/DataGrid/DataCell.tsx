import React, { useState } from 'react'
import { Eye, Copy, ExternalLink } from 'lucide-react'

interface DataCellProps {
  value: any
  column: string
  rowIndex: number
  maxWidth?: number
}

const DataCell: React.FC<DataCellProps> = ({ value, column, rowIndex, maxWidth = 200 }) => {
  const [showModal, setShowModal] = useState(false)

  const formatValue = (val: any): string => {
    if (val === null || val === undefined) return ''
    if (typeof val === 'object') return JSON.stringify(val, null, 2)
    return String(val)
  }

  const displayValue = formatValue(value)
  const isLongContent = displayValue.length > 50
  const isComplexObject = typeof value === 'object' && value !== null
  
  // 더 적극적인 truncation
  const truncatedValue = displayValue.length > 100 
    ? displayValue.substring(0, 100) + '...' 
    : displayValue

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayValue)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  return (
    <>
      <td className="px-3 py-2 text-sm text-gray-900 border-b border-gray-200 group relative">
        <div className="flex items-center space-x-2">
          <div 
            className="flex-1 overflow-hidden"
            style={{ maxWidth: `${maxWidth}px` }}
          >
            {displayValue ? (
              <div className="whitespace-pre-wrap break-words text-xs leading-relaxed">
                {isLongContent ? (
                  <span 
                    className="cursor-pointer hover:bg-yellow-50 p-1 rounded"
                    onClick={() => setShowModal(true)}
                    title="Click to view full content"
                  >
                    {truncatedValue}
                  </span>
                ) : (
                  displayValue
                )}
              </div>
            ) : (
              <span className="text-gray-400 italic text-xs">null</span>
            )}
          </div>
          
          {(isLongContent || isComplexObject) && (
            <button
              onClick={() => setShowModal(true)}
              className="p-1 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              title="View full content"
            >
              <Eye className="w-3 h-3" />
            </button>
          )}
        </div>
      </td>

      {/* Enhanced Detail Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-6xl max-h-[90vh] w-full m-4 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Row {rowIndex + 1}, Column "{column}"
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Type: {typeof value} • Length: {displayValue.length} characters
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopy}
                  className="p-2 text-gray-400 hover:text-gray-600 border border-gray-300 rounded-lg"
                  title="Copy content"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-4">
              {isComplexObject ? (
                <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto font-mono">
                  {displayValue}
                </pre>
              ) : (
                <div className="prose max-w-none">
                  {/* Check if it looks like markdown */}
                  {displayValue.includes('#') || displayValue.includes('```') ? (
                    <div className="space-y-4">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-blue-800">
                          This content appears to contain Markdown formatting.
                        </p>
                      </div>
                      <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded border">
                        {displayValue}
                      </pre>
                    </div>
                  ) : (
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                      {displayValue}
                    </pre>
                  )}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="space-x-4">
                  <span><strong>Length:</strong> {displayValue.length} characters</span>
                  {typeof value === 'string' && (
                    <>
                      <span><strong>Words:</strong> {displayValue.split(/\s+/).length}</span>
                      <span><strong>Lines:</strong> {displayValue.split('\n').length}</span>
                    </>
                  )}
                </div>
                <div>
                  <span><strong>Type:</strong> {typeof value}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default DataCell
