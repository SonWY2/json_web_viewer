import React, { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Header from './components/Layout/Header'
import DataGrid from './components/DataGrid/DataGrid'
import FileUpload from './components/FileLoader/FileUpload'
import ExportModal from './components/Export/ExportModal'
import AnalysisProgress from './components/Analysis/AnalysisProgress'
import AnalysisResults from './components/Analysis/AnalysisResults'
import { useFileStore } from './stores/fileStore'
import { useDataStore } from './stores/dataStore'
import { useAnalysisStore } from './stores/analysisStore'
import { useDataGrid } from './hooks/useDataGrid'
import { DataRequest, LogicalOperator } from './types'

const queryClient = new QueryClient()

function App() {
  const { currentFile } = useFileStore()
  const { filters, sortRules, currentPage, pageSize } = useDataStore()
  const { selectedColumn, getColumnAnalysis, getActiveTasksArray } = useAnalysisStore()
  const { totalRecords } = useDataGrid()
  
  const [showExportModal, setShowExportModal] = useState(false)

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

  return (
    <QueryClientProvider client={queryClient}>
      <div className="h-screen flex flex-col bg-gray-50">
        <Header />
        
        <main className="flex-1 flex overflow-hidden">
          {currentFile ? (
            <>
              <div className="flex-1 flex flex-col">
                <DataGrid />
              </div>
              
              {/* Side Panel for Analysis */}
              {(activeTasks.length > 0 || selectedAnalysis) && (
                <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
                  <div className="p-4 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Analysis</h2>
                  </div>
                  
                  <div className="p-4 space-y-4">
                    {/* Active Tasks */}
                    {activeTasks.map((task) => (
                      <AnalysisProgress
                        key={task.id}
                        taskId={task.id}
                        onComplete={(result) => {
                          console.log('Analysis completed:', result)
                          // The AnalysisProgress component will handle updating the store
                        }}
                        onError={(error) => {
                          console.error('Analysis failed:', error)
                        }}
                      />
                    ))}
                    
                    {/* Analysis Results */}
                    {selectedAnalysis && (
                      <AnalysisResults analysis={selectedAnalysis} />
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <FileUpload />
            </div>
          )}
        </main>

        {/* Export Modal */}
        {showExportModal && currentFile && (
          <ExportModal
            isOpen={showExportModal}
            onClose={() => setShowExportModal(false)}
            dataRequest={getDataRequest()}
            totalRecords={totalRecords}
            filteredRecords={filters.size > 0 ? totalRecords : undefined}
          />
        )}
      </div>
    </QueryClientProvider>
  )
}

export default App
