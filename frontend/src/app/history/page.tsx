'use client'

import React, { useEffect, useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import HistoryTable from '@/components/HistoryTable'
import { Analysis } from '@/types'
import { apiService } from '@/services/apiService'
import { deleteAnalysisById } from '@/services/mockDataService'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import toast from 'react-hot-toast'
import { Activity, History, Filter, ArrowUpDown } from 'lucide-react'

export default function HistoryPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'date' | 'result' | 'quality'>('date')
  const [filterType, setFilterType] = useState<'ALL' | 'ECG' | 'PPG'>('ALL')

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      setIsLoading(true)
      const res = await apiService.getHistory()
      setAnalyses(res.data || [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to load analysis history.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    await apiService.deleteAnalysis(id)
    setAnalyses((prev) => prev.filter((a) => a.id !== id))
    toast.success('Analysis record deleted permanently.')
  }

  // Filter & Sort Logic
  const getFilteredAndSorted = () => {
    let list = [...analyses]
    if (filterType !== 'ALL') {
      list = list.filter((a) => a.fileType === filterType)
    }

    if (sortBy === 'date') {
      list.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
    } else if (sortBy === 'result') {
      list.sort((a, b) => a.aiPrediction.class.localeCompare(b.aiPrediction.class))
    } else if (sortBy === 'quality') {
      list.sort((a, b) => b.signalQuality.score - a.signalQuality.score)
    }

    return list
  }

  const filteredAnalyses = getFilteredAndSorted()

  // Chart trend data (chronological)
  const trendChartData = [...analyses]
    .sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime())
    .map((item) => ({
      date: new Date(item.uploadedAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      heartRate: item.heartRate.average,
      confidence: Math.round(item.aiPrediction.confidence * 100),
      quality: item.signalQuality.score,
    }))

  return (
    <ProtectedRoute>
      <div className="container-main">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <History className="w-7 h-7 text-blue-600" />
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Analysis History & Health Trends
            </h1>
          </div>
          <p className="text-slate-600 text-sm">
            View historical ECG/PPG recordings, track long-term heart rate variations, and compare model confidence over time.
          </p>
        </div>

        {/* Historical Trend Chart */}
        {trendChartData.length > 1 && (
          <div className="card mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  Heart Rate (BPM) & Confidence Trend
                </h3>
                <p className="text-xs text-slate-500">Historical trend lines across all analyzed sessions</p>
              </div>
            </div>

            <div className="w-full h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" stroke="#2563eb" domain={[40, 150]} />
                  <YAxis yAxisId="right" orientation="right" stroke="#10b981" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="heartRate"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    name="Heart Rate (BPM)"
                    dot={{ r: 4 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="confidence"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="AI Confidence (%)"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Filters and Search Bar */}
        <div className="card mb-6 p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            {/* Filter Buttons */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-500 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Filter Type:
              </span>
              {(['ALL', 'ECG', 'PPG'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                    filterType === type
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Sort Select */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="font-semibold text-slate-500 flex items-center gap-1 shrink-0">
                <ArrowUpDown className="w-3.5 h-3.5" /> Sort By:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="input-field py-1 text-xs"
              >
                <option value="date">Date (Newest First)</option>
                <option value="result">AI Prediction Class</option>
                <option value="quality">Signal Quality Score</option>
              </select>
            </div>
          </div>
        </div>

        {/* History Table */}
        {isLoading ? (
          <div className="text-center py-16 card">
            <p className="text-slate-500 text-sm">Loading history records...</p>
          </div>
        ) : (
          <HistoryTable analyses={filteredAnalyses} onDelete={handleDelete} />
        )}
      </div>
    </ProtectedRoute>
  )
}
