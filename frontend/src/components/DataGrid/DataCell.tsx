import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Eye, Copy, MessageSquare } from 'lucide-react'
import ChatView, { Message } from '../Chat/ChatView'

const parseConversation = (value: any): Message[] | null => {
  // 1. Try parsing as a JSON array of messages
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed) && parsed.length > 0 && 'from' in parsed[0] && 'value' in parsed[0]) {
        return parsed.map((item: any) => ({
          role: item.from === 'human' ? 'user' : item.from, // Map 'human' to 'user'
          content: item.value
        }));
      }
    } catch (e) {
      // Not a valid JSON, proceed to check for ChatML format
    }
  }

  // 2. Try parsing as ChatML string format
  if (typeof value === 'string' && value.includes('<|im_start|>') && value.includes('<|im_end|>')) {
    try {
      const messages: Message[] = [];
      const regex = /<\|im_start\|>\s*(\w+)\s*\n?([\s\S]*?)<\|im_end\|>/g;
      let match;
      while ((match = regex.exec(value)) !== null) {
        messages.push({
          role: match[1],
          content: match[2].trim(),
        });
      }
      if (messages.length > 0) {
        return messages;
      }
    } catch (error) {
      console.error("Failed to parse ChatML content:", error);
      return null;
    }
  }

  return null;
};

interface DataCellProps {
  value: any
  column: string
  rowIndex: number
}

const DataCell: React.FC<DataCellProps> = ({ value, column, rowIndex }) => {
  const [showModal, setShowModal] = useState(false)
  const [viewMode, setViewMode] = useState<'raw' | 'chat'>('raw')

  const conversationMessages = parseConversation(value);

  useEffect(() => {
    if (showModal) {
      setViewMode(conversationMessages ? 'chat' : 'raw');
    }
  }, [showModal, conversationMessages]);


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

  const handleOpenModal = (defaultView: 'raw' | 'chat' = 'raw') => {
    setViewMode(defaultView);
    setShowModal(true);
  };

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
        className="px-2 py-1 text-sm text-gray-900 border-b border-gray-200 group relative"
        style={{ 
          overflow: 'hidden'
        }}
      >
        <div 
          className="w-full h-full overflow-hidden"
        >
          {displayValue ? (
            <div 
              className="text-xs leading-relaxed overflow-hidden p-1 rounded whitespace-pre-line"
              style={{ 
                minHeight: '20px',
                wordBreak: 'break-word'
              }}
            >
              {isLongContent ? (
                <span 
                  className="rounded block overflow-hidden text-ellipsis p-1 whitespace-pre-line"
                  title={displayValue}
                >
                  {truncatedValue}
                </span>
              ) : (
                <span 
                  className="rounded block overflow-hidden p-1 whitespace-pre-line"
                >
                  {displayValue}
                </span>
              )}
            </div>
          ) : (
            <div 
              className="overflow-hidden p-1 rounded"
              style={{ 
                minHeight: '20px'
              }}
            >
              <span className="text-gray-400 italic text-xs block rounded overflow-hidden p-1 whitespace-pre-line">
                null
              </span>
            </div>
          )}
          
          <div className="absolute top-1 right-1 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {conversationMessages && (
              <button
                onClick={() => handleOpenModal('chat')}
                className="p-0.5 text-gray-400 hover:text-blue-600"
                title="View as Conversation"
              >
                <MessageSquare className="w-3 h-3" />
              </button>
            )}
            {(isLongContent || isComplexObject) && !conversationMessages && (
              <button
                onClick={() => handleOpenModal('raw')}
                className="p-0.5 text-gray-400 hover:text-blue-600"
                title="View full content"
              >
                <Eye className="w-3 h-3" />
              </button>
            )}
          </div>
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
            
            <div className="p-2 border-b border-gray-200">
              {conversationMessages && (
                <div className="flex space-x-1">
                  <button
                    onClick={() => setViewMode('chat')}
                    className={`px-3 py-1 text-sm rounded-md ${viewMode === 'chat' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
                  >
                    <MessageSquare className="w-4 h-4 mr-2 inline-block" />
                    Chat View
                  </button>
                  <button
                    onClick={() => setViewMode('raw')}
                    className={`px-3 py-1 text-sm rounded-md ${viewMode === 'raw' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
                  >
                    Raw Text
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-auto">
              {viewMode === 'chat' && conversationMessages ? (
                <ChatView messages={conversationMessages} />
              ) : (
                <div className="p-4">
                  {isComplexObject ? (
                    <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto font-mono">
                      {displayValue}
                    </pre>
                  ) : (
                    <div className="prose max-w-none">
                      {displayValue.includes('#') || displayValue.includes('```') ? (
                        <div className="space-y-4">
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="text-sm text-blue-800">
                              This content may contain Markdown.
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
