import { useState, useEffect, useCallback } from 'react'
import { apiService } from '../services/api'
import { useFileStore } from '../stores/fileStore'
import { useDataStore } from '../stores/dataStore'
import { DataRequest, FilterRequest, LogicalOperator } from '../types'

export const useDataGrid = () => {
  const { currentFile } = useFileStore()
  const {
    currentData,
    loading,
    error,
    currentPage,
    pageSize,
    sortRules,
    filters,
    searchResults,
    setCurrentData,
    setLoading,
    setError,
    setCurrentPage,
    hasFilters,
    hasSearch
  } = useDataStore()

  const loadData = useCallback(async (page?: number) => {
    if (!currentFile) return

    const targetPage = page || currentPage
    setLoading(true)
    setError(null)

    try {
      const filterRequest: FilterRequest | undefined = filters.size > 0 ? {
        groups: [
          {
            rules: Array.from(filters.values()),
            logical_operator: LogicalOperator.AND
          }
        ],
        global_operator: LogicalOperator.AND
      } : undefined

      const request: DataRequest = {
        file_id: currentFile.id,
        page: targetPage,
        page_size: pageSize,
        sort: sortRules,
        filters: filterRequest
      }

      const result = await apiService.getData(request)
      setCurrentData(result)
      setCurrentPage(result.page)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load data'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [currentFile, currentPage, pageSize, sortRules, filters, setCurrentData, setLoading, setError, setCurrentPage])

  // Auto-reload when dependencies change
  useEffect(() => {
    if (currentFile) {
      loadData(1) // Reset to page 1 when filters/sort change
    }
  }, [currentFile, sortRules, filters])

  const nextPage = useCallback(() => {
    if (currentData && currentData.has_next) {
      loadData(currentPage + 1)
    }
  }, [currentData, currentPage, loadData])

  const prevPage = useCallback(() => {
    if (currentData && currentData.has_prev) {
      loadData(currentPage - 1)
    }
  }, [currentData, currentPage, loadData])

  const goToPage = useCallback((page: number) => {
    if (currentData && page >= 1 && page <= currentData.total_pages) {
      loadData(page)
    }
  }, [currentData, loadData])

  const refresh = useCallback(() => {
    loadData(currentPage)
  }, [loadData, currentPage])

  return {
    // State
    data: currentData,
    loading,
    error,
    currentPage,
    pageSize,
    totalPages: currentData?.total_pages || 0,
    totalRecords: currentData?.total_records || 0,
    hasNextPage: currentData?.has_next || false,
    hasPrevPage: currentData?.has_prev || false,
    hasFilters: hasFilters(),
    hasSearch: hasSearch(),
    
    // Actions
    loadData,
    nextPage,
    prevPage,
    goToPage,
    refresh
  }
}
