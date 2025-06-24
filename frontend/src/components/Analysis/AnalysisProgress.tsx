import React, { useState, useEffect } from 'react'
import { BarChart3, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { apiService } from '../../services/api'
import { TaskInfo, TaskStatus, ColumnAnalysis } from '../../types'

interface AnalysisProgressProps {
  taskId: string
  onComplete?: (result: any) => void
  onError?: (error: string) => void
}

const AnalysisProgress: React.FC<AnalysisProgressProps> = ({ taskId, onComplete, onError }) => {
  const [task, setTask] = useState<TaskInfo | null>(null)
  const [polling, setPolling] = useState(true)

  useEffect(() => {
    let interval: NodeJS.Timeout

    const pollTaskStatus = async () => {
      try {
        const taskInfo = await apiService.getTaskStatus(taskId)
        setTask(taskInfo)

        if (taskInfo.status === TaskStatus.COMPLETED) {
          setPolling(false)
          onComplete?.(taskInfo.result)
        } else if (taskInfo.status === TaskStatus.FAILED) {
          setPolling(false)
          onError?.(taskInfo.error || 'Analysis failed')
        } else if (taskInfo.status === TaskStatus.CANCELLED) {
          setPolling(false)
        }
      } catch (error) {
        console.error('Failed to get task status:', error)
        setPolling(false)
        onError?.('Failed to get analysis status')
      }
    }

    if (polling) {
      pollTaskStatus() // Initial call
      interval = setInterval(pollTaskStatus, 1000) // Poll every second
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [taskId, polling, onComplete, onError])

  if (!task) {
    return (
      <div className="flex items-center space-x-2 text-gray-600">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-sm">Starting analysis...</span>
      </div>
    )
  }

  const getStatusIcon = () => {
    switch (task.status) {
      case TaskStatus.PENDING:
        return <Clock className="w-4 h-4 text-yellow-500" />
      case TaskStatus.RUNNING:
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
      case TaskStatus.COMPLETED:
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case TaskStatus.FAILED:
        return <XCircle className="w-4 h-4 text-red-500" />
      case TaskStatus.CANCELLED:
        return <AlertCircle className="w-4 h-4 text-gray-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusText = () => {
    switch (task.status) {
      case TaskStatus.PENDING:
        return 'Waiting to start...'
      case TaskStatus.RUNNING:
        return `Analyzing... ${task.progress.toFixed(1)}%`
      case TaskStatus.COMPLETED:
        return 'Analysis completed!'
      case TaskStatus.FAILED:
        return `Failed: ${task.error}`
      case TaskStatus.CANCELLED:
        return 'Analysis cancelled'
      default:
        return 'Unknown status'
    }
  }

  return (
    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
      {getStatusIcon()}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900">{task.name}</span>
          <span className="text-xs text-gray-500">
            {task.status === TaskStatus.RUNNING && `${task.progress.toFixed(1)}%`}
          </span>
        </div>
        <div className="text-xs text-gray-600 mt-1">{getStatusText()}</div>
        
        {task.status === TaskStatus.RUNNING && (
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${task.progress}%` }}
            ></div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AnalysisProgress
