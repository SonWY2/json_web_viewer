import { create } from 'zustand'
import { TaskInfo, ColumnAnalysis } from '../types'

interface AnalysisStore {
  // Column analyses
  columnAnalyses: Map<string, ColumnAnalysis>
  analysisLoading: Map<string, boolean>
  analysisErrors: Map<string, string>
  
  // Active tasks
  activeTasks: Map<string, TaskInfo>
  
  // UI state
  selectedColumn: string | null
  showAnalysisPanel: boolean
  
  // Actions
  setColumnAnalysis: (column: string, analysis: ColumnAnalysis) => void
  setAnalysisLoading: (column: string, loading: boolean) => void
  setAnalysisError: (column: string, error: string | null) => void
  clearColumnAnalysis: (column: string) => void
  
  addActiveTask: (taskId: string, task: TaskInfo) => void
  updateActiveTask: (taskId: string, task: TaskInfo) => void
  removeActiveTask: (taskId: string) => void
  
  setSelectedColumn: (column: string | null) => void
  setShowAnalysisPanel: (show: boolean) => void
  
  // Computed
  getColumnAnalysis: (column: string) => ColumnAnalysis | null
  isColumnLoading: (column: string) => boolean
  getColumnError: (column: string) => string | null
  getActiveTasksArray: () => TaskInfo[]
}

export const useAnalysisStore = create<AnalysisStore>((set, get) => ({
  columnAnalyses: new Map(),
  analysisLoading: new Map(),
  analysisErrors: new Map(),
  activeTasks: new Map(),
  selectedColumn: null,
  showAnalysisPanel: false,
  
  setColumnAnalysis: (column, analysis) => {
    console.log(`[AnalysisStore] Setting analysis for column: ${column}`)
    console.log(`[AnalysisStore] Analysis data:`, analysis)
    
    set((state) => {
      const newAnalyses = new Map(state.columnAnalyses)
      newAnalyses.set(column, analysis)
      
      // Clear loading and error state
      const newLoading = new Map(state.analysisLoading)
      const newErrors = new Map(state.analysisErrors)
      newLoading.delete(column)
      newErrors.delete(column)
      
      console.log(`[AnalysisStore] Total analyses stored: ${newAnalyses.size}`)
      
      return { 
        columnAnalyses: newAnalyses,
        analysisLoading: newLoading,
        analysisErrors: newErrors
      }
    })
  },
  
  setAnalysisLoading: (column, loading) => set((state) => {
    console.log(`[AnalysisStore] Setting loading for column ${column}: ${loading}`)
    
    const newLoading = new Map(state.analysisLoading)
    if (loading) {
      newLoading.set(column, true)
    } else {
      newLoading.delete(column)
    }
    return { analysisLoading: newLoading }
  }),
  
  setAnalysisError: (column, error) => set((state) => {
    console.log(`[AnalysisStore] Setting error for column ${column}: ${error}`)
    
    const newErrors = new Map(state.analysisErrors)
    if (error) {
      newErrors.set(column, error)
    } else {
      newErrors.delete(column)
    }
    
    // Clear loading state
    const newLoading = new Map(state.analysisLoading)
    newLoading.delete(column)
    
    return { 
      analysisErrors: newErrors,
      analysisLoading: newLoading
    }
  }),
  
  clearColumnAnalysis: (column) => set((state) => {
    console.log(`[AnalysisStore] Clearing analysis for column: ${column}`)
    
    const newAnalyses = new Map(state.columnAnalyses)
    const newLoading = new Map(state.analysisLoading)
    const newErrors = new Map(state.analysisErrors)
    
    newAnalyses.delete(column)
    newLoading.delete(column)
    newErrors.delete(column)
    
    return {
      columnAnalyses: newAnalyses,
      analysisLoading: newLoading,
      analysisErrors: newErrors
    }
  }),
  
  addActiveTask: (taskId, task) => {
    console.log(`[AnalysisStore] Adding active task: ${taskId} - ${task.name}`)
    
    set((state) => {
      const newTasks = new Map(state.activeTasks)
      newTasks.set(taskId, task)
      console.log(`[AnalysisStore] Total active tasks: ${newTasks.size}`)
      return { activeTasks: newTasks }
    })
  },
  
  updateActiveTask: (taskId, task) => set((state) => {
    const newTasks = new Map(state.activeTasks)
    newTasks.set(taskId, task)
    return { activeTasks: newTasks }
  }),
  
  removeActiveTask: (taskId) => {
    console.log(`[AnalysisStore] Removing active task: ${taskId}`)
    
    set((state) => {
      const newTasks = new Map(state.activeTasks)
      newTasks.delete(taskId)
      console.log(`[AnalysisStore] Remaining active tasks: ${newTasks.size}`)
      return { activeTasks: newTasks }
    })
  },
  
  setSelectedColumn: (column) => {
    console.log(`[AnalysisStore] Setting selected column: ${column}`)
    set({ selectedColumn: column })
  },
  
  setShowAnalysisPanel: (show) => set({ showAnalysisPanel: show }),
  
  // Computed
  getColumnAnalysis: (column) => {
    const analysis = get().columnAnalyses.get(column) || null
    console.log(`[AnalysisStore] Getting analysis for ${column}:`, analysis ? 'found' : 'not found')
    return analysis
  },
  
  isColumnLoading: (column) => get().analysisLoading.get(column) || false,
  getColumnError: (column) => get().analysisErrors.get(column) || null,
  getActiveTasksArray: () => Array.from(get().activeTasks.values())
}))
