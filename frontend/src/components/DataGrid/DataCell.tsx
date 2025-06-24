import React, { useState } from 'react'
import { Eye, Copy, ExternalLink } from 'lucide-react'

interface DataCellProps {
  value: any
  column: string
  rowIndex: number
  maxWidth?: number
}

const DataCell: React.FC<DataCellProps> = ({ value, column, rowIndex, maxWidth = 300 }) => {
  const [showModal, setShowModal] = useState(false)

  const formatValue = (val: any): string => {
    if (val === null || val === undefined) return ''
    if (typeof val === 'object') return JSON.stringify(val)
    return String(val)
  }

  const displayValue = formatValue(value)
  const isLongContent = displayValue.length > 100
  const isComplexObject = typeof value === 'object' && value !== null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayValue)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  return (
    <>
      <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div 
            className="truncate flex-1"
            style={{ maxWidth: `${maxWidth}px` }}
            title={displayValue}
          >
            {displayValue || <span className="text-gray-400 italic">null</span>}
          </div>
          
          {(isLongContent || isComplexObject) && (
            <button
              onClick={() => setShowModal(true)}
              className="p-1 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
              title="View details"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
        </div>
      </td>

      {/* Detail Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[80vh] w-full m-4 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium">
                Cell Content: Row {rowIndex + 1}, Column "{column}"
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopy}
                  className="p-2 text-gray-400 hover:text-gray-600"
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
                <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto">
                  {JSON.stringify(value, null, 2)}
                </pre>
              ) : (
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap text-sm">{displayValue}</pre>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div>
                  <span className="font-medium">Length:</span> {displayValue.length} characters
                  {typeof value === 'string' && (
                    <>
                      <span className="mx-2">•</span>
                      <span className="font-medium">Words:</span> {displayValue.split(/\s+/).length}
                    </>
                  )}
                </div>
                <div>
                  <span className="font-medium">Type:</span> {typeof value}
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
