import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Database, TrendingUp, BarChart, PieChart } from 'lucide-react'
import { DatasetOverview } from '../../types'
import { apiService } from '../../services/api'
import { useFileStore } from '../../stores/fileStore'

interface DatasetOverviewModalProps {
  isOpen: boolean
  onClose: () => void
}

const DatasetOverviewModal: React.FC<DatasetOverviewModalProps> = ({ isOpen, onClose }) => {
  const { currentFile } = useFileStore()
  const [overview, setOverview] = useState<DatasetOverview | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && currentFile) {
      loadOverview()
    }
  }, [isOpen, currentFile])

  const loadOverview = async () => {
    if (!currentFile) return
    
    setLoading(true)
    setError(null)
    
    try {
      const data = await apiService.getDatasetOverview(currentFile.id)
      setOverview(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load overview')
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 B'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatPercentage = (value: number) => {
    return (value * 100).toFixed(1) + '%'
  }

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl max-h-[90vh] w-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <Database className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Dataset Overview</h2>
              <p className="text-sm text-gray-600">{currentFile?.filename}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Analyzing dataset...</span>
            </div>
          ) : error ? (
            <div className="text-center text-red-600 p-8">
              <p>Error loading overview: {error}</p>
              <button 
                onClick={loadOverview}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : overview ? (
            <div className="space-y-8">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Database className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-600">Records</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600 mt-2">
                    {overview.basic_info.total_records.toLocaleString()}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <BarChart className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-600">Columns</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600 mt-2">
                    {overview.basic_info.total_columns}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-gray-600">File Size</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-600 mt-2">
                    {formatFileSize(overview.basic_info.file_size)}
                  </p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <PieChart className="w-5 h-5 text-orange-600" />
                    <span className="text-sm font-medium text-gray-600">Completeness</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-600 mt-2">
                    {formatPercentage(overview.data_quality.completeness_score)}
                  </p>
                </div>
              </div>

              {/* Data Quality */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Quality</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Missing Values</span>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatPercentage(overview.data_quality.total_null_ratio)}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Empty Rows</span>
                    <p className="text-lg font-semibold text-gray-900">
                      {overview.data_quality.empty_rows.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Empty Columns</span>
                    <p className="text-lg font-semibold text-gray-900">
                      {overview.data_quality.empty_columns}
                    </p>
                  </div>
                </div>
              </div>

              {/* Column Statistics */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Column Statistics</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Column
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Missing
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unique
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Top Values
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {overview.column_stats.map((col, index) => (
                        <tr key={col.name} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {col.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {col.data_type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {col.null_count.toLocaleString()} ({formatPercentage(col.null_ratio)})
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {col.unique_count.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            <div className="space-y-1">
                              {col.top_values.slice(0, 3).map((item, i) => (
                                <div key={i} className="text-xs">
                                  <span className="font-mono bg-gray-100 px-1 rounded">
                                    {item.value.length > 20 ? item.value.substring(0, 20) + '...' : item.value}
                                  </span>
                                  <span className="text-gray-500 ml-1">({item.count})</span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  )
}

export default DatasetOverviewModal
