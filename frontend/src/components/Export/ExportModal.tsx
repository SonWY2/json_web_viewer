import React, { useState, useEffect } from 'react'
import { Download, X, FileText, Table, FileSpreadsheet } from 'lucide-react'
import { apiService } from '../../services/api'
import { DataRequest } from '../../types'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  dataRequest: DataRequest
  totalRecords: number
  filteredRecords?: number
}

const ExportModal: React.FC<ExportModalProps> = ({ 
  isOpen, 
  onClose, 
  dataRequest, 
  totalRecords, 
  filteredRecords 
}) => {
  const [format, setFormat] = useState('json')
  const [includeStats, setIncludeStats] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && !isExporting) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      // body 스크롤 방지 제거 - 테이블 레이아웃 변경 방지
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      // body 스크롤 복원 제거
    }
  }, [isOpen, isExporting, onClose])

  if (!isOpen) return null

  const formatOptions = [
    { value: 'json', label: 'JSON', icon: FileText, description: 'JavaScript Object Notation' },
    { value: 'jsonl', label: 'JSONL', icon: FileText, description: 'JSON Lines format' },
    { value: 'csv', label: 'CSV', icon: Table, description: 'Comma-separated values' },
    { value: 'excel', label: 'Excel', icon: FileSpreadsheet, description: 'Excel spreadsheet (.xlsx)' }
  ]

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const blob = await apiService.exportData(dataRequest, format, includeStats)
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      
      // Generate filename
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
      const extension = format === 'excel' ? 'xlsx' : format
      a.download = `export_${timestamp}.${extension}`
      
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      onClose()
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const getRecordCount = () => {
    return filteredRecords !== undefined ? filteredRecords : totalRecords
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => {
        // 배경 클릭시 모달 닫기 (내보내기 중이 아닐 때만)
        if (e.target === e.currentTarget && !isExporting) {
          onClose()
        }
      }}
    >
      <div 
        className="bg-white rounded-lg max-w-md w-full m-4"
        onClick={(e) => e.stopPropagation()} // 모달 내용 클릭시 이벤트 버블링 방지
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Export Data</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Data Selection Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Data Selection</h3>
            <div className="text-sm text-blue-700">
              <div>Records to export: <span className="font-medium">{getRecordCount().toLocaleString()}</span></div>
              {filteredRecords !== undefined && (
                <div className="text-xs text-blue-600 mt-1">
                  (Filtered from {totalRecords.toLocaleString()} total records)
                </div>
              )}
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Export Format</h3>
            <div className="space-y-2">
              {formatOptions.map((option) => {
                const Icon = option.icon
                return (
                  <label key={option.value} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="format"
                      value={option.value}
                      checked={format === option.value}
                      onChange={(e) => setFormat(e.target.value)}
                      className="mt-1"
                    />
                    <Icon className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">{option.label}</div>
                      <div className="text-xs text-gray-500">{option.description}</div>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Options */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Options</h3>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={includeStats}
                onChange={(e) => setIncludeStats(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Include column statistics</span>
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Add a summary sheet with column statistics (Excel format only)
            </p>
          </div>

          {/* File Size Estimate */}
          <div className="text-xs text-gray-500">
            <div>Estimated file size: ~{Math.ceil(getRecordCount() / 1000)}KB - {Math.ceil(getRecordCount() / 100)}KB</div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={isExporting}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Export</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ExportModal
