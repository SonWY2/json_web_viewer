import React from 'react'

interface ResizeHandleProps {
  column: string
  isResizing: boolean
  resizeHandleProps: {
    onMouseDown: (e: React.MouseEvent) => void
  }
}

const ResizeHandle: React.FC<ResizeHandleProps> = ({
  column,
  isResizing,
  resizeHandleProps,
}) => {
  return (
    <div
      {...resizeHandleProps}
      className={`h-full cursor-col-resize hover:bg-blue-300 active:bg-blue-400 transition-colors duration-150 column-resize-handle ${
        isResizing ? 'resizing' : ''
      }`}
      style={{
        width: '8px',
        minWidth: '8px',
        background: isResizing ? '#3b82f6' : 'rgba(59, 130, 246, 0.1)',
        borderLeft: isResizing
          ? '2px solid #1d4ed8'
          : '1px solid rgba(59, 130, 246, 0.3)',
        transition: 'all 0.15s ease',
      }}
      title={`Resize ${column} column`}
      onClick={(e) => {
        e.stopPropagation()
      }}
    />
  )
}

export default ResizeHandle
