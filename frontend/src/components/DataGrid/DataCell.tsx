import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Eye, Copy, ExternalLink } from 'lucide-react'

interface DataCellProps {
  value: any
  column: string
  rowIndex: number
  maxWidth?: number
  width?: number
}

const DataCell: React.FC<DataCellProps> = ({ value, column, rowIndex, maxWidth = 200, width = 200 }) => {
  const [showModal, setShowModal] = useState(false)

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showModal) {
        setShowModal(false)
      }
    }

    if (showModal) {
      document.addEventListener('keydown', handleKeyDown)
      // body 스크롤 방지 제거 - 테이블 레이아웃 변경 방지
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      // body 스크롤 복원 제거
    }
  }, [showModal])

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

  const handleCellClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('Cell clicked:', rowIndex, column) // 디버깅용
    setShowModal(true)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayValue)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  return (
    <>
      <td 
        className="px-0 py-1 text-sm text-gray-900 border-b border-gray-200 group relative"
        style={{ 
          width: `${width}px`,
          maxWidth: `${width}px`,
          minWidth: `${width}px`,
          boxSizing: 'border-box'
        }}
      >
        <div 
          className="w-full h-full"
          style={{
            width: `${width}px`,
            maxWidth: `${width}px`,
            minWidth: `${width}px`,
            boxSizing: 'border-box',
            overflow: 'hidden'
          }}
        >
          {displayValue ? (
            <div 
              className="text-xs leading-relaxed"
              style={{ 
                minHeight: '20px', 
                width: `${width - 4}px`, // padding 2px * 2 = 4px 제외
                maxWidth: `${width - 4}px`,
                minWidth: `${width - 4}px`,
                wordBreak: 'break-all',
                padding: '2px',
                boxSizing: 'border-box',
                overflow: 'hidden'
              }}
            >
              {isLongContent ? (
                <span 
                  className="cursor-pointer hover:bg-yellow-50 rounded block"
                  onClick={handleCellClick}
                  title="Click to view full content"
                  style={{ 
                    width: '100%',
                    display: 'block',
                    overflow: 'hidden'
                  }}
                >
                  {truncatedValue}
                </span>
              ) : (
                <span 
                  className="cursor-pointer hover:bg-yellow-50 rounded block"
                  onClick={handleCellClick}
                  title="Click to view content"
                  style={{ 
                    width: '100%',
                    display: 'block',
                    overflow: 'hidden'
                  }}
                >
                  {displayValue}
                </span>
              )}
            </div>
          ) : (
            <div 
              style={{ 
                width: `${width}px`, // padding 2px * 2 = 4px 제외
                maxWidth: `${width}px`,
                minWidth: `${width}px`,
                minHeight: '20px',
                padding: '0px',
                boxSizing: 'border-box',
                overflow: 'hidden'
              }}
            >
              <span 
                className="text-gray-400 italic text-xs block cursor-pointer hover:bg-yellow-50 rounded"
                onClick={handleCellClick}
                title="Click to view content"
                style={{
                  width: '100%',
                  overflow: 'hidden'
                }}
              >
                null
              </span>
            </div>
          )}
          
          {(isLongContent || isComplexObject) && (
            <button
              onClick={handleCellClick}
              className="absolute top-1 right-1 p-0.5 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
              title="View full content"
            >
              <Eye className="w-2 h-2" />
            </button>
          )}
        </div>
      </td>

      {/* Enhanced Detail Modal - Portal을 사용해서 body에 렌더링 */}
      {showModal && createPortal(
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            // 배경 클릭시 모달 닫기 (모달 내용 클릭은 제외)
            if (e.target === e.currentTarget) {
              setShowModal(false)
            }
          }}
        >
          <div 
            className="bg-white rounded-lg max-w-6xl max-h-[90vh] w-full m-4 flex flex-col"
            onClick={(e) => e.stopPropagation()} // 모달 내용 클릭시 이벤트 버블링 방지
          >
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
        </div>,
        document.body
      )}
    </>
  )
}

export default DataCell
