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
  
  // Computed
  hasFilters: () => boolean
  hasSearch: () => boolean
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
  
  setCurrentData: (data) => set({ currentData: data }),
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
  
  hasFilters: () => get().filters.size > 0,
  hasSearch: () => get().searchResults !== null
}))
