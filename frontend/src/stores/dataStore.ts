import { create } from 'zustand'
import { DataChunk, DataRequest, SortRule, FilterRule } from '../types'

interface DataStore {
  currentData: DataChunk | null
  loading: boolean
  error: string | null
  currentPage: number
  pageSize: number
  sortRules: SortRule[]
  filters: Map<string, FilterRule>
  searchResults: number[] | null
  
  // Column visibility
  visibleColumns: string[]
  columnOrder: string[]
  columnWidths: Record<string, number>  // Added: track column widths
  
  // Actions
  setCurrentData: (data: DataChunk | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setCurrentPage: (page: number) => void
  setPageSize: (size: number) => void
  setSortRules: (rules: SortRule[]) => void
  setFilter: (column: string, rule: FilterRule | null) => void
  clearFilters: () => void
  setSearchResults: (results: number[] | null) => void
  
  // Column actions
  setVisibleColumns: (columnIds: string[]) => void
  setColumnOrder: (columnIds: string[]) => void
  setColumnWidth: (columnId: string, width: number) => void  // Added
  resetColumnWidths: () => void  // Added
  toggleColumnVisibility: (columnId: string) => void
  showAllColumns: () => void
  hideAllColumns: () => void
  
  // Computed
  hasFilters: () => boolean
  hasSearch: () => boolean
  getOrderedVisibleColumns: () => string[]
}

export const useDataStore = create<DataStore>((set, get) => ({
  currentData: null,
  loading: false,
  error: null,
  currentPage: 1,
  pageSize: 50,
  sortRules: [],
  filters: new Map(),
  searchResults: null,
  visibleColumns: [],
  columnOrder: [],
  columnWidths: {},  // Added
  
  setCurrentData: (data) => {
    set((state) => {
      const newState: any = { currentData: data }
      
      // Initialize column visibility if first time loading data with columns
      if (data && data.schema) {
        const columnIds = data.schema.map(col => col.name)
        
        // Always initialize with all columns visible on first load
        if (state.visibleColumns.length === 0 || 
            !columnIds.every(id => state.columnOrder.includes(id))) {
          newState.visibleColumns = columnIds
          newState.columnOrder = columnIds
          
          // Initialize default column widths
          const defaultWidths = Object.fromEntries(
            columnIds.map(id => [id, state.columnWidths[id] || 80])
          )
          newState.columnWidths = { ...defaultWidths, ...state.columnWidths }
        }
      }
      
      return newState
    })
  },
  
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setPageSize: (size) => set({ pageSize: size }),
  setSortRules: (rules) => set({ sortRules: rules }),
  
  setFilter: (column, rule) => set((state) => {
    const newFilters = new Map(state.filters)
    if (rule) {
      newFilters.set(column, rule)
    } else {
      newFilters.delete(column)
    }
    return { filters: newFilters }
  }),
  
  clearFilters: () => set({ filters: new Map() }),
  setSearchResults: (results) => set({ searchResults: results }),
  
  // Column visibility actions
  setVisibleColumns: (columnIds) => set({ visibleColumns: columnIds }),
  
  setColumnOrder: (columnIds) => set({ columnOrder: columnIds }),
  
  setColumnWidth: (columnId, width) => set((state) => ({
    columnWidths: { ...state.columnWidths, [columnId]: Math.max(40, Math.min(250, width)) }
  })),
  
  resetColumnWidths: () => set((state) => {
    if (state.currentData?.schema) {
      const defaultWidths = Object.fromEntries(
        state.currentData.schema.map(col => [col.name, 80])
      )
      return { columnWidths: defaultWidths }
    }
    return { columnWidths: {} }
  }),
  
  toggleColumnVisibility: (columnId) => set((state) => {
    const isVisible = state.visibleColumns.includes(columnId)
    if (isVisible) {
      return {
        visibleColumns: state.visibleColumns.filter(id => id !== columnId)
      }
    } else {
      return {
        visibleColumns: [...state.visibleColumns, columnId]
      }
    }
  }),
  
  showAllColumns: () => set((state) => {
    if (state.currentData?.schema) {
      const allColumnIds = state.currentData.schema.map(col => col.name)
      const defaultWidths = Object.fromEntries(
        allColumnIds.map(id => [id, state.columnWidths[id] || 80])
      )
      return { 
        visibleColumns: [...allColumnIds],
        columnOrder: state.columnOrder.length === 0 ? [...allColumnIds] : state.columnOrder,
        columnWidths: { ...defaultWidths, ...state.columnWidths }
      }
    }
    return {}
  }),
  
  hideAllColumns: () => set({ visibleColumns: [] }),
  
  // Computed
  hasFilters: () => get().filters.size > 0,
  hasSearch: () => get().searchResults !== null,
  
  getOrderedVisibleColumns: () => {
    const { visibleColumns, columnOrder } = get()
    return columnOrder.filter(colId => visibleColumns.includes(colId))
  }
}))
