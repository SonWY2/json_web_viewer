import React, { useState } from 'react'

const ResizeTest: React.FC = () => {
  const [width, setWidth] = useState(200)

  const handleMouseDown = (e: React.MouseEvent) => {
    const startX = e.clientX
    const startWidth = width

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX
      const newWidth = Math.max(100, startWidth + deltaX)
      setWidth(newWidth)
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Resize Test Component</h2>
      
      <div style={{ 
        display: 'flex', 
        border: '1px solid #ccc',
        height: '100px',
        position: 'relative'
      }}>
        <div style={{
          width: `${width}px`,
          background: '#f0f0f0',
          border: '1px solid #999',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}>
          Column ({width}px)
          
          <div
            style={{
              position: 'absolute',
              right: '-5px',
              top: 0,
              bottom: 0,
              width: '10px',
              background: 'red',
              cursor: 'col-resize',
              zIndex: 1000
            }}
            onMouseDown={handleMouseDown}
            title="Drag to resize"
          />
        </div>
        
        <div style={{
          flex: 1,
          background: '#e0e0e0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          Rest of the space
        </div>
      </div>
      
      <p>현재 너비: {width}px</p>
      <p>빨간색 핸들을 드래그해보세요!</p>
    </div>
  )
}

export default ResizeTest
