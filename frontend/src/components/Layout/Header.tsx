import React, { useState } from 'react'
import { File, Search, Download } from 'lucide-react'
import GlobalSearch from '../Search/GlobalSearch'
import { SearchResponse } from '../../types'

const Header: React.FC = () => {
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null)

  const handleSearchResults = (results: SearchResponse) => {
    setSearchResults(results)
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-2">
            <File className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-semibold text-gray-900">JSONL Viewer</h1>
          </div>
          
          <div className="w-96">
            <GlobalSearch onSearchResults={handleSearchResults} />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {searchResults && (
            <div className="text-sm text-gray-600">
              {searchResults.total_matches} matches in {searchResults.execution_time_ms.toFixed(1)}ms
            </div>
          )}
          
          <button className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
