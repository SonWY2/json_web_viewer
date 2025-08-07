import React from 'react'
import { File, Download, Database } from 'lucide-react'
import GlobalSearch from '../Search/GlobalSearch'
import { SearchResponse } from '../../types'

interface HeaderProps {
  onSearchResults?: (results: SearchResponse | null) => void
  onDatasetOverview?: () => void
}

const Header: React.FC<HeaderProps> = ({ onSearchResults, onDatasetOverview }) => {

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-2">
            <File className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-semibold text-gray-900">JSONL Viewer</h1>
          </div>
          
          <div className="w-96">
            <GlobalSearch onSearchResults={onSearchResults} />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={onDatasetOverview}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Database className="w-4 h-4" />
            <span>Dataset Overview</span>
          </button>
          
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
