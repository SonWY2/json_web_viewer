import React, { useState } from 'react'
import { Search, X } from 'lucide-react'
import { useFileStore } from '../../stores/fileStore'
import { apiService } from '../../services/api'
import { SearchResponse } from '../../types'

interface GlobalSearchProps {
  onSearchResults?: (results: SearchResponse) => void
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ onSearchResults }) => {
  const { currentFile } = useFileStore()
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<SearchResponse | null>(null)

  const handleSearch = async (searchQuery: string) => {
    if (!currentFile || !searchQuery.trim()) return

    setIsSearching(true)
    try {
      const searchResults = await apiService.search({
        file_id: currentFile.id,
        query: searchQuery.trim(),
        limit: 1000
      })
      
      setResults(searchResults)
      onSearchResults?.(searchResults)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch(query)
  }

  const clearSearch = () => {
    setQuery('')
    setResults(null)
    onSearchResults?.(null as any)
  }

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search all data..."
          className="pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
          disabled={!currentFile || isSearching}
        />
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      {results && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
          <div className="p-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">
                {results.total_matches} matches found
              </span>
              <span className="text-xs text-gray-500">
                {results.execution_time_ms.toFixed(1)}ms
              </span>
            </div>
          </div>
          <div className="p-3">
            <p className="text-sm text-gray-600">
              Found matches in {results.matching_rows.length} rows
            </p>
          </div>
        </div>
      )}

      {isSearching && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
          <div className="p-3 text-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Searching...</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default GlobalSearch
