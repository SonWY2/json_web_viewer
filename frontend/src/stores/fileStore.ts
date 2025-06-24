import { create } from 'zustand'

interface FileInfo {
  id: string
  filename: string
  size: number
  total_records: number
  columns: string[]
  sample_data: any[]
}

interface FileStore {
  currentFile: FileInfo | null
  isLoading: boolean
  error: string | null
  setCurrentFile: (file: FileInfo | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useFileStore = create<FileStore>((set) => ({
  currentFile: null,
  isLoading: false,
  error: null,
  setCurrentFile: (file) => set({ currentFile: file }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error })
}))
