import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ColumnAnalysis } from '../../types'

interface AnalysisResultsProps {
  analysis: ColumnAnalysis
}

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ analysis }) => {
  const renderNumericStats = () => {
    if (!analysis.numeric_stats) return null

    const stats = analysis.numeric_stats
    const histogramData = stats.histogram?.map((bin, index) => ({
      name: `Bin ${index + 1}`,
      range: bin.range,
      count: bin.count,
      percentage: bin.percentage
    })) || []

    return (
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Statistics</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-xs text-gray-600">Min</div>
              <div className="text-sm font-medium">{stats.min.toFixed(2)}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-xs text-gray-600">Max</div>
              <div className="text-sm font-medium">{stats.max.toFixed(2)}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-xs text-gray-600">Mean</div>
              <div className="text-sm font-medium">{stats.mean.toFixed(2)}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-xs text-gray-600">Median</div>
              <div className="text-sm font-medium">{stats.median.toFixed(2)}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-xs text-gray-600">Std Dev</div>
              <div className="text-sm font-medium">{stats.std_dev.toFixed(2)}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-xs text-gray-600">Q1</div>
              <div className="text-sm font-medium">{stats.q1.toFixed(2)}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-xs text-gray-600">Q3</div>
              <div className="text-sm font-medium">{stats.q3.toFixed(2)}</div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-xs text-gray-600">95th %ile</div>
              <div className="text-sm font-medium">{stats.percentile_95.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {histogramData.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Distribution</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={histogramData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [value, name === 'count' ? 'Count' : name]}
                    labelFormatter={(label, payload) => {
                      const item = payload?.[0]?.payload
                      return item ? `Range: ${item.range}` : label
                    }}
                  />
                  <Bar dataKey="count" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderTextStats = () => {
    if (!analysis.length_stats) return null

    const stats = analysis.length_stats

    return (
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Text Statistics</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-xs text-gray-600">Min Length</div>
            <div className="text-sm font-medium">{stats.min}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-xs text-gray-600">Max Length</div>
            <div className="text-sm font-medium">{stats.max}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-xs text-gray-600">Avg Length</div>
            <div className="text-sm font-medium">{stats.mean.toFixed(1)}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-xs text-gray-600">Median Length</div>
            <div className="text-sm font-medium">{stats.median.toFixed(1)}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-xs text-gray-600">Std Dev</div>
            <div className="text-sm font-medium">{stats.std_dev.toFixed(1)}</div>
          </div>
        </div>

        {analysis.most_common_words && (
          <div className="mt-4">
            <h5 className="text-sm font-medium text-gray-900 mb-2">Most Common Words</h5>
            <div className="space-y-1">
              {analysis.most_common_words.slice(0, 10).map(([word, count], index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span className="text-gray-700">{word}</span>
                  <span className="text-gray-500">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-medium text-gray-900">{analysis.column}</h3>
        <p className="text-sm text-gray-600 mt-1">
          {analysis.data_type} • {analysis.non_null_count.toLocaleString()} values • 
          {analysis.null_percentage.toFixed(1)}% null
        </p>
      </div>

      {/* Basic Info */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Overview</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-3 rounded">
            <div className="text-xs text-blue-600">Total Records</div>
            <div className="text-sm font-medium text-blue-900">
              {analysis.total_records.toLocaleString()}
            </div>
          </div>
          <div className="bg-green-50 p-3 rounded">
            <div className="text-xs text-green-600">Non-null</div>
            <div className="text-sm font-medium text-green-900">
              {analysis.non_null_count.toLocaleString()}
            </div>
          </div>
          <div className="bg-purple-50 p-3 rounded">
            <div className="text-xs text-purple-600">Unique Values</div>
            <div className="text-sm font-medium text-purple-900">
              {analysis.unique_count.toLocaleString()}
            </div>
          </div>
          <div className="bg-orange-50 p-3 rounded">
            <div className="text-xs text-orange-600">Uniqueness</div>
            <div className="text-sm font-medium text-orange-900">
              {analysis.unique_percentage.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Type-specific stats */}
      {analysis.data_type === 'number' && renderNumericStats()}
      {analysis.data_type === 'string' && renderTextStats()}

      {/* Most Common Values */}
      {analysis.most_common_values && analysis.most_common_values.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Most Common Values</h4>
          <div className="space-y-2">
            {analysis.most_common_values.slice(0, 10).map(([value, count], index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-700 truncate flex-1 mr-4">
                  {value || '(empty)'}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">{count}</span>
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(count / analysis.most_common_values[0][1]) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default AnalysisResults
