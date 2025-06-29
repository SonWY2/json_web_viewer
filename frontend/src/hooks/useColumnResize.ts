import { useCallback, useRef, useState } from 'react'
import { useDataStore } from '../stores/dataStore'

export interface UseColumnResizeProps {
  columnId: string
  initialWidth?: number
  minWidth?: number
  maxWidth?: number
}

export interface UseColumnResizeReturn {
  width: number
  isResizing: boolean
  resizeHandleProps: {
    onMouseDown: (e: React.MouseEvent) => void
    className: string
  }
}

export const useColumnResize = ({
  columnId,
  initialWidth = 80,
  minWidth = 40,
  maxWidth = 250
}: UseColumnResizeProps): UseColumnResizeReturn => {
  const { columnWidths, setColumnWidth } = useDataStore()
  const [isResizing, setIsResizing] = useState(false)
  const startXRef = useRef<number>(0)
  const startWidthRef = useRef<number>(0)
  const rafRef = useRef<number>()

  const width = columnWidths[columnId] ?? initialWidth

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setIsResizing(true)
    startXRef.current = e.clientX
    startWidthRef.current = width

    const handleMouseMove = (moveEvent: MouseEvent) => {
      // Use requestAnimationFrame for smoother resizing
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
      
      rafRef.current = requestAnimationFrame(() => {
        const deltaX = moveEvent.clientX - startXRef.current
        const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidthRef.current + deltaX))
        setColumnWidth(columnId, newWidth)
      })
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [columnId, width, minWidth, maxWidth, setColumnWidth])

  return {
    width,
    isResizing,
    resizeHandleProps: {
      onMouseDown: handleMouseDown,
      className: `column-resize-handle ${
        isResizing ? 'resizing' : ''
      }`
    }
  }
}
