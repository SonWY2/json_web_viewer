import React, { useState, useRef, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Header from './components/Layout/Header'
import DataGrid from './components/DataGrid/DataGrid'
import FileUpload from './components/FileLoader/FileUpload'
import FileExplorer from './components/FileExplorer/FileExplorer'
import ExportModal from './components/Export/ExportModal'
import AnalysisProgress from './components/Analysis/AnalysisProgress'
import AnalysisResults from './components/Analysis/AnalysisResults'
import { useFileStore } from './stores/fileStore'
import { useDataStore } from './stores/dataStore'
import { useAnalysisStore } from './stores/analysisStore'
import { SearchResponse, DataRequest, LogicalOperator } from './types'
import { Menu, X } from 'lucide-react'

const queryClient = new QueryClient()

function App() {
  const { currentFile } = useFileStore()
  const { filters, sortRules, currentPage, pageSize } = useDataStore()
  const { 
    selectedColumn, 
    getColumnAnalysis, 
    getActiveTasksArray,
    columnAnalyses,
    setSelectedColumn 
  } = useAnalysisStore()
  
  const [showExportModal, setShowExportModal] = useState(false)
  const [showFileExplorer, setShowFileExplorer] = useState(true)
  const dataGridRef = useRef<any>(null)

  const handleSearchResults = (results: SearchResponse | null) => {
    if (dataGridRef.current && dataGridRef.current.handleGlobalSearchResults) {
      dataGridRef.current.handleGlobalSearchResults(results)
    }
  }

  const getDataRequest = (): DataRequest => ({
    file_id: currentFile?.id || '',
    page: currentPage,
    page_size: pageSize,
    sort: sortRules,
    filters: filters.size > 0 ? {
      groups: [
        {
          rules: Array.from(filters.values()),
          logical_operator: LogicalOperator.AND
        }
      ],
      global_operator: LogicalOperator.AND
    } : undefined
  })

  const activeTasks = getActiveTasksArray()
  const selectedAnalysis = selectedColumn ? getColumnAnalysis(selectedColumn) : null
  const showAnalysisPanel = activeTasks.length > 0 || selectedAnalysis || columnAnalyses.size > 0

  return (
    <QueryClientProvider client={queryClient}>
      <div className="h-screen flex flex-col bg-gray-50">
        <Header onSearchResults={handleSearchResults} />
        
        <main className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - File Explorer */}
          {showFileExplorer && (
            <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
              <div className="p-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">File Explorer</h3>
                <button
                  onClick={() => setShowFileExplorer(false)}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <FileExplorer />
            </div>
          )}

          {/* Toggle button when sidebar is hidden */}
          {!showFileExplorer && (
            <button
              onClick={() => setShowFileExplorer(true)}
              className="fixed top-20 left-4 z-10 p-2 bg-white border border-gray-300 rounded-lg shadow-lg hover:bg-gray-50"
            >
              <Menu className="w-4 h-4 text-gray-600" />
            </button>
          )}

          {/* Main Content */}
          <div className="flex-1 flex">
            {currentFile ? (
              <>
                <div className="flex-1 flex flex-col min-h-0">
                  <DataGrid ref={dataGridRef} />
                </div>
                
                {/* Right Sidebar - Analysis */}
                {showAnalysisPanel && (
                  <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
                    <div className="p-4 border-b border-gray-200">
                      <h2 className="text-lg font-medium text-gray-900">Analysis</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        {activeTasks.length > 0 && `${activeTasks.length} active task${activeTasks.length === 1 ? '' : 's'}`}
                        {activeTasks.length > 0 && columnAnalyses.size > 0 && ' • '}
                        {columnAnalyses.size > 0 && `${columnAnalyses.size} result${columnAnalyses.size === 1 ? '' : 's'}`}
                      </p>
                    </div>
                    
                    <div className="p-4 space-y-4">
                      {/* Active Tasks */}
                      {activeTasks.map((task) => (
                        <AnalysisProgress
                          key={task.id}
                          taskId={task.id}
                          onComplete={(result) => {
                            console.log('Task completed in App:', result)
                          }}
                          onError={(error) => {
                            console.error('Task failed in App:', error)
                          }}
                        />
                      ))}
                      
                      {/* Analysis Results */}
                      {selectedAnalysis && (
                        <div className="border-t border-gray-200 pt-4">
                          <AnalysisResults analysis={selectedAnalysis} />
                        </div>
                      )}
                      
                      {/* Available Analyses */}
                      {!selectedAnalysis && columnAnalyses.size > 0 && (
                        <div className="border-t border-gray-200 pt-4">
                          <h3 className="text-sm font-medium text-gray-900 mb-3">Available Analyses</h3>
                          <div className="space-y-2">
                            {Array.from(columnAnalyses.entries()).map(([column, analysis]) => (
                              <button
                                key={column}
                                onClick={() => setSelectedColumn(column)}
                                className="w-full text-left p-2 text-sm bg-gray-50 hover:bg-gray-100 rounded border"
                              >
                                📊 {column} analysis
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <FileUpload />
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      Or browse files using the explorer on the left
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Export Modal */}
        {showExportModal && currentFile && (
          <ExportModal
            isOpen={showExportModal}
            onClose={() => setShowExportModal(false)}
            dataRequest={getDataRequest()}
            totalRecords={currentFile.total_records}
            filteredRecords={filters.size > 0 ? currentFile.total_records : undefined}
          />
        )}
      </div>
    </QueryClientProvider>
  )
}

export default App
