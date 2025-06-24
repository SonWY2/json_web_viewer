import React, { useCallback } from 'react'
import { Upload, FileText } from 'lucide-react'
import { useFileStore } from '../../stores/fileStore'

const FileUpload: React.FC = () => {
  const { setCurrentFile, setLoading, setError } = useFileStore()

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.name.endsWith('.jsonl')) {
      setError('Please upload a JSONL file')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/v1/files/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const fileInfo = await response.json()
      setCurrentFile(fileInfo)
    } catch (error) {
      setError('Failed to upload file')
    } finally {
      setLoading(false)
    }
  }, [setCurrentFile, setLoading, setError])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }, [handleFileUpload])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
  }, [handleFileUpload])

  return (
    <div className="max-w-md mx-auto">
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <div className="flex flex-col items-center space-y-4">
          <div className="p-4 bg-blue-50 rounded-full">
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900">Upload JSONL File</h3>
            <p className="text-sm text-gray-500 mt-1">
              Drop your file here or click to browse
            </p>
          </div>

          <label className="cursor-pointer">
            <input
              type="file"
              accept=".jsonl"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Upload className="w-4 h-4" />
              <span>Choose File</span>
            </div>
          </label>
        </div>
      </div>
    </div>
  )
}

export default FileUpload
