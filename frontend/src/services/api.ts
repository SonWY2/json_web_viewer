import { FileMetadata, DataRequest, DataChunk, SearchRequest, SearchResponse, TaskInfo, DirectoryListing } from '../types'

const API_BASE = '/api/v1'

class ApiService {
  // File operations
  async uploadFile(file: File): Promise<FileMetadata> {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await fetch(`${API_BASE}/files/upload`, {
      method: 'POST',
      body: formData
    })
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`)
    }
    
    return response.json()
  }

  async loadFromPath(filePath: string): Promise<FileMetadata> {
    const formData = new FormData()
    const response = await fetch(`${API_BASE}/files/load-path`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: filePath })
    })
    
    if (!response.ok) {
      throw new Error(`Failed to load file: ${response.statusText}`)
    }
    
    return response.json()
  }

  async getFileInfo(fileId: string): Promise<FileMetadata> {
    const response = await fetch(`${API_BASE}/files/${fileId}`)
    if (!response.ok) {
      throw new Error(`Failed to get file info: ${response.statusText}`)
    }
    return response.json()
  }

  async listFiles(): Promise<FileMetadata[]> {
    const response = await fetch(`${API_BASE}/files/`)
    if (!response.ok) {
      throw new Error(`Failed to list files: ${response.statusText}`)
    }
    return response.json()
  }

  // Filesystem operations
  async listDirectory(path?: string): Promise<DirectoryListing> {
    const url = path ? `${API_BASE}/filesystem/?path=${encodeURIComponent(path)}` : `${API_BASE}/filesystem/`
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Failed to list directory: ${response.statusText}`)
    }
    
    return response.json()
  }

  async getDefaultPath(): Promise<string> {
    const response = await fetch(`${API_BASE}/filesystem/default-path`)
    if (!response.ok) {
      throw new Error(`Failed to get default path: ${response.statusText}`)
    }
    const data = await response.json()
    return data.path
  }

  // Data operations
  async getData(request: DataRequest): Promise<DataChunk> {
    const response = await fetch(`${API_BASE}/data/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    })
    
    if (!response.ok) {
      throw new Error(`Failed to get data: ${response.statusText}`)
    }
    
    return response.json()
  }

  // Search operations
  async search(request: SearchRequest): Promise<SearchResponse> {
    const response = await fetch(`${API_BASE}/search/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    })
    
    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`)
    }
    
    return response.json()
  }

  async getSearchSuggestions(fileId: string, column: string, prefix: string): Promise<string[]> {
    const response = await fetch(`${API_BASE}/search/suggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_id: fileId, column, prefix })
    })
    
    if (!response.ok) {
      throw new Error(`Failed to get suggestions: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.suggestions
  }

  // Analysis operations
  async analyzeColumn(fileId: string, column: string): Promise<{status: string, task_id?: string, result?: any}> {
    const response = await fetch(`${API_BASE}/analysis/column`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_id: fileId, column })
    })
    
    if (!response.ok) {
      throw new Error(`Analysis failed: ${response.statusText}`)
    }
    
    return response.json()
  }

  async getColumnAnalysis(fileId: string, column: string): Promise<any> {
    const response = await fetch(`${API_BASE}/analysis/column/${fileId}/${column}`)
    if (!response.ok) {
      throw new Error(`Failed to get analysis: ${response.statusText}`)
    }
    return response.json()
  }

  async getDatasetOverview(fileId: string): Promise<any> {
    const response = await fetch(`${API_BASE}/analysis/dataset-overview/${fileId}`)
    if (!response.ok) {
      throw new Error(`Failed to get dataset overview: ${response.statusText}`)
    }
    return response.json()
  }

  // Task operations
  async getTaskStatus(taskId: string): Promise<TaskInfo> {
    const response = await fetch(`${API_BASE}/tasks/${taskId}`)
    if (!response.ok) {
      throw new Error(`Failed to get task status: ${response.statusText}`)
    }
    return response.json()
  }

  async listTasks(): Promise<Record<string, TaskInfo>> {
    const response = await fetch(`${API_BASE}/tasks/`)
    if (!response.ok) {
      throw new Error(`Failed to list tasks: ${response.statusText}`)
    }
    return response.json()
  }

  // Export operations
  async exportData(dataRequest: DataRequest, format: string, includeStats: boolean = false): Promise<Blob> {
    const response = await fetch(`${API_BASE}/export/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data_request: dataRequest,
        format,
        include_stats: includeStats
      })
    })
    
    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`)
    }
    
    return response.blob()
  }
}

export const apiService = new ApiService()
