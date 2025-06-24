import React, { useState, useEffect } from 'react'
import { Folder, File, ChevronRight, Home, ArrowUp, AlertCircle } from 'lucide-react'
import { apiService } from '../../services/api'
import { useFileStore } from '../../stores/fileStore'
import { DirectoryListing, FileSystemItem } from '../../types'

const FileExplorer: React.FC = () => {
  const [currentListing, setCurrentListing] = useState<DirectoryListing | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { setCurrentFile, setLoading: setFileLoading } = useFileStore()

  useEffect(() => {
    loadDefaultDirectory()
  }, [])

  const loadDefaultDirectory = async () => {
    setLoading(true)
    setError(null)
    try {
      const listing = await apiService.listDirectory()
      setCurrentListing(listing)
    } catch (err: any) {
      console.error('Failed to load directory:', err)
      setError(err.message || 'Failed to load directory')
    } finally {
      setLoading(false)
    }
  }

  const navigateToDirectory = async (path: string) => {
    setLoading(true)
    setError(null)
    try {
      const listing = await apiService.listDirectory(path)
      setCurrentListing(listing)
    } catch (err: any) {
      console.error('Failed to navigate to directory:', err)
      setError(err.message || 'Failed to access directory')
    } finally {
      setLoading(false)
    }
  }

  const handleItemClick = async (item: FileSystemItem) => {
    if (item.is_directory) {
      navigateToDirectory(item.path)
    } else if (item.extension === '.jsonl' || item.extension === '.json') {
      setFileLoading(true)
      try {
        const fileData = await apiService.loadFromPath(item.path)
        setCurrentFile(fileData)
      } catch (err: any) {
        console.error('Failed to load file:', err)
        setError(err.message || 'Failed to load file')
      } finally {
        setFileLoading(false)
      }
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  if (loading && !currentListing) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-sm text-gray-600 mt-2">Loading...</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          <button
            onClick={loadDefaultDirectory}
            className="p-1 hover:bg-gray-200 rounded"
            title="Home"
            disabled={loading}
          >
            <Home className="w-4 h-4 text-gray-600" />
          </button>
          {currentListing?.parent_path && (
            <button
              onClick={() => navigateToDirectory(currentListing.parent_path!)}
              className="p-1 hover:bg-gray-200 rounded"
              title="Up"
              disabled={loading}
            >
              <ArrowUp className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </div>
        <div className="text-xs text-gray-500 mt-1 truncate" title={currentListing?.current_path}>
          {currentListing?.current_path || 'Loading...'}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border-b border-red-200">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={loadDefaultDirectory}
                className="text-xs text-red-600 hover:text-red-800 underline mt-1"
              >
                Try default directory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : currentListing?.items.map((item, index) => (
          <div
            key={index}
            onClick={() => handleItemClick(item)}
            className="flex items-center space-x-2 p-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
          >
            <div className="flex-shrink-0">
              {item.is_directory ? (
                <Folder className="w-4 h-4 text-blue-500" />
              ) : (
                <File className={`w-4 h-4 ${
                  item.extension === '.jsonl' || item.extension === '.json' 
                    ? 'text-green-600' 
                    : 'text-gray-400'
                }`} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm truncate" title={item.name}>
                {item.name}
              </div>
              {!item.is_directory && (
                <div className="text-xs text-gray-500">
                  {formatFileSize(item.size)}
                </div>
              )}
            </div>
            {item.is_directory && (
              <ChevronRight className="w-3 h-3 text-gray-400" />
            )}
          </div>
        ))}
        
        {currentListing && currentListing.items.length === 0 && !loading && (
          <div className="p-4 text-center text-gray-500 text-sm">
            No JSONL files found in this directory
          </div>
        )}
      </div>
    </div>
  )
}

export default FileExplorer
