import React, { useRef, useState } from 'react'
import { useDataStore } from '../../stores/dataStore'

interface ResizeHandleProps {
  column: string
  width: number
  onWidthChange?: (width: number) => void
}

const ResizeHandle: React.FC<ResizeHandleProps> = ({ 
  column, 
  width: initialWidth,
  onWidthChange 
}) => {
  const { setColumnWidth } = useDataStore()
  const [isResizing, setIsResizing] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [dragStartWidth, setDragStartWidth] = useState(0)

  const handleMouseDown = (e: React.MouseEvent) => {
    console.log(`🚀 Starting resize for ${column}`)
    e.preventDefault()
    e.stopPropagation()
    
    setIsResizing(true)
    setDragStartX(e.clientX)
    setDragStartWidth(initialWidth)
    
    // 전역 이벤트 리스너 추가
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartX
      const newWidth = Math.max(50, Math.min(800, dragStartWidth + deltaX))
      
      console.log(`📏 Resizing ${column}: ${newWidth}px (delta: ${deltaX})`)
      
      // 즉시 업데이트
      setColumnWidth(column, newWidth)
      
      if (onWidthChange) {
        onWidthChange(newWidth)
      }
    }

    const handleMouseUp = () => {
      console.log(`✅ Resize complete for ${column}`)
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.body.classList.remove('resizing-active')
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.body.classList.add('resizing-active')
  }

  return (
    <div
      className={`h-full cursor-col-resize hover:bg-blue-300 active:bg-blue-400 transition-colors duration-150 column-resize-handle ${isResizing ? 'resizing' : ''}`}
      style={{
        width: '8px',
        minWidth: '8px',
        background: isResizing ? '#3b82f6' : 'rgba(59, 130, 246, 0.1)',
        borderLeft: isResizing ? '2px solid #1d4ed8' : '1px solid rgba(59, 130, 246, 0.3)',
        transition: 'all 0.15s ease'
      }}
      onMouseDown={handleMouseDown}
      title={`Resize ${column} column (${initialWidth}px) - Drag to resize`}
      onClick={(e) => {
        e.stopPropagation()
        console.log(`🎯 Resize handle clicked for ${column}`)
      }}
    />
  )
}

export default ResizeHandle
