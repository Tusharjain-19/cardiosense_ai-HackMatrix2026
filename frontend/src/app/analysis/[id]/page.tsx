'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import WaveformChart from '@/components/WaveformChart'
import CardioAssistantChat from '@/components/CardioAssistantChat'
import { Analysis } from '@/types'
import { apiService } from '@/services/apiService'
import { useAuthStore } from '@/context/authContext'
import { generateAnalysisPDF } from '@/utils/pdfGenerator'
import toast from 'react-hot-toast'
import ReportDownloadModal from '@/components/ReportDownloadModal'
import {
  Activity,
  Heart,
  Download,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  Sparkles,
  ShieldAlert,
  Info,
  Clock,
  FileCheck,
} from 'lucide-react'

export default function AnalysisPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false)

  const analysisId = params.id as string

  useEffect(() => {
    fetchAnalysis()
  }, [analysisId])

  const fetchAnalysis = async () => {
    try {
      setIsLoading(true)
      const res = await apiService.getAnalysis(analysisId)
      setAnalysis(res.data)
    } catch (err) {
      console.error(err)
      toast.error('Could not load analysis details.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadReport = () => {
    if (!analysis) return
    setIsDownloadModalOpen(true)
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="container-main min-h-[60vh] flex flex-col items-center justify-center">
          <Sparkles className="w-10 h-10 text-blue-600 animate-spin mb-3" />
          <p className="text-slate-500 font-semibold text-sm">Retrieving Waveform Analysis...</p>
        </div>
      </ProtectedRoute>
    )
  }

  if (!analysis) {
    return (
      <ProtectedRoute>
        <div className="container-main py-16 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Analysis Record Not Found</h2>
          <p className="text-slate-500 text-sm mb-6">
            The requested analysis ID "{analysisId}" could not be retrieved.
          </p>
          <button onClick={() => router.push('/dashboard')} className="btn-primary">
            <ArrowLeft className="w-4 h-4" /> Return to Dashboard
          </button>
        </div>
      </ProtectedRoute>
    )
  }

  const isAbnormal = analysis.aiPrediction.class !== 'Normal'
  const isLowConfidence = analysis.aiPrediction.confidence < 0.65
  const isPoorQuality = analysis.signalQuality.status === 'POOR'

  return (
    <ProtectedRoute>
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-[1920px] mx-auto">
        {/* Navigation back link & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>

          <div className="flex items-center gap-3">
            {user?.role === 'doctor' && (
              <button
                onClick={() => router.push(`/doctor/review/${analysis.id}`)}
                className="btn-secondary text-xs"
              >
                Doctor Review Interface
              </button>
            )}
            <button onClick={handleDownloadReport} className="btn-primary text-xs shadow-md">
              <Download className="w-4 h-4" /> Download PDF Report
            </button>
          </div>
        </div>

        {/* Header Title Card */}
        <div className="card mb-6 border-l-4 border-l-teal-600 bg-white shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-teal-100 text-teal-900">
                  {analysis.fileType} Signal
                </span>
                <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {new Date(analysis.uploadedAt).toLocaleString()}
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {analysis.fileName}
              </h1>

              {/* Patient Details Sub-header */}
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5 text-teal-900 font-bold bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                  Patient: {analysis.patientName || 'Rajesh Sharma'}
                </span>
                <span className="text-slate-500">
                  ID: <span className="font-mono font-bold text-slate-800">{analysis.patientId || 'PAT-001'}</span>
                </span>
                <span className="text-slate-500">
                  Age/Gender: <span className="font-bold text-slate-800">{analysis.patientAge || 45} yrs / {analysis.patientGender || 'Male'}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-6">
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">
                  AI Prediction
                </span>
                <span
                  className={`text-lg font-black ${
                    isAbnormal ? 'text-amber-600' : 'text-emerald-600'
                  }`}
                >
                  {analysis.aiPrediction.class}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">
                  Confidence
                </span>
                <span className="text-lg font-black text-slate-900">
                  {(analysis.aiPrediction.confidence * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Poor Signal Warning Alert if quality is POOR */}
        {isPoorQuality && (
          <div className="mb-6 card border-l-4 border-l-red-500 bg-red-50/70 flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-red-900 text-sm">Poor Signal Quality Detected</h3>
              <p className="text-xs text-red-800 mt-0.5">
                The recording contains significant noise, baseline drift, or motion artifacts (Quality score: {analysis.signalQuality.score}%). AI classification confidence may be reduced. Re-recording under resting conditions is recommended.
              </p>
            </div>
          </div>
        )}

        {/* Low Confidence Warning Alert */}
        {isLowConfidence && !isPoorQuality && (
          <div className="mb-6 card border-l-4 border-l-amber-500 bg-amber-50/70 flex items-start gap-3">
            <Info className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-amber-900 text-sm">Moderate/Low Model Confidence</h3>
              <p className="text-xs text-amber-800 mt-0.5">
                The deep learning model returned a confidence score of {(analysis.aiPrediction.confidence * 100).toFixed(1)}% (below 65%). Manual review by a healthcare professional is strongly recommended.
              </p>
            </div>
          </div>
        )}

        {/* Main Grid Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Signal Quality Gauge & HR Cards (Col 1) */}
          <div className="space-y-6">
            {/* Quality Score Card */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm text-slate-900">Signal Quality Score</h3>
                <span
                  className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${
                    analysis.signalQuality.status === 'GOOD'
                      ? 'badge-good'
                      : analysis.signalQuality.status === 'MODERATE'
                      ? 'badge-warning'
                      : 'badge-danger'
                  }`}
                >
                  {analysis.signalQuality.status}
                </span>
              </div>

              <div className="flex items-baseline gap-3 mb-3">
                <span className="text-4xl font-extrabold text-slate-900">
                  {analysis.signalQuality.score}%
                </span>
                <span className="text-xs text-slate-500">Quality Index</span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-3 mb-4 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    analysis.signalQuality.score >= 80
                      ? 'bg-emerald-500'
                      : analysis.signalQuality.score >= 50
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${analysis.signalQuality.score}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-slate-400 block font-medium">Noise</span>
                  <strong className="capitalize">{analysis.signalQuality.factors.noise}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Baseline</span>
                  <strong className="capitalize">{analysis.signalQuality.factors.baseline}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Clipping</span>
                  <strong className="capitalize">{analysis.signalQuality.factors.saturation}</strong>
                </div>
              </div>
            </div>

            {/* Heart Rate Analysis Card */}
            <div className="card">
              <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500 fill-red-500/20" />
                Heart Rate Analysis
              </h3>

              <div className="bg-gradient-to-br from-red-50 to-blue-50 p-4 rounded-xl border border-red-100 mb-4 text-center">
                <span className="text-xs text-slate-500 block uppercase font-semibold">
                  Average Heart Rate
                </span>
                <span className="text-4xl font-black text-slate-900 my-1 block">
                  {analysis.heartRate.average} <span className="text-base font-normal text-slate-500">BPM</span>
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">Minimum</span>
                  <strong className="text-slate-900">{analysis.heartRate.min} BPM</strong>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">Maximum</span>
                  <strong className="text-slate-900">{analysis.heartRate.max} BPM</strong>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">Variability</span>
                  <strong className="text-slate-900 capitalize">{analysis.heartRate.variability}</strong>
                </div>
              </div>
            </div>

            {/* Anomaly Detection Score Card */}
            <div className="card">
              <h3 className="font-bold text-sm text-slate-900 mb-2">Anomaly Score Index</h3>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-black text-slate-900">
                  {(analysis.anomalyScore * 100).toFixed(0)}/100
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {analysis.anomalyScore > 0.6 ? 'Elevated Pattern' : 'Normal Baseline'}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    analysis.anomalyScore > 0.6 ? 'bg-amber-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${analysis.anomalyScore * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* AI Prediction & Waveform View (Cols 2-3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Waveform Chart Component */}
            <div className="card">
              <WaveformChart
                data={analysis.rawSignal}
                focusArea={analysis.focusArea}
              />
            </div>

            {/* AI Classification & Class Probability Distribution */}
            <div className="card">
              <h3 className="font-bold text-base text-slate-900 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                AI Model Prediction & Probability Breakdown
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center md:text-left">
                  <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">
                    Primary Classification
                  </span>
                  <p className={`text-3xl font-black mb-3 ${
                    isAbnormal ? 'text-amber-600' : 'text-emerald-600'
                  }`}>
                    {analysis.aiPrediction.class}
                  </p>

                  <span className="text-xs font-semibold text-slate-500 block mb-1">
                    Model Confidence Score
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-slate-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          analysis.aiPrediction.confidence >= 0.85
                            ? 'bg-emerald-500'
                            : analysis.aiPrediction.confidence >= 0.65
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${analysis.aiPrediction.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-extrabold text-slate-900">
                      {(analysis.aiPrediction.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Class Distribution Bars */}
                <div className="space-y-2 text-xs">
                  <span className="font-bold text-slate-700 block mb-2">Class Probability Distribution:</span>
                  {Object.entries(analysis.aiPrediction.classDistribution).map(([cls, prob]) => {
                    const pct = (prob * 100).toFixed(1)
                    return (
                      <div key={cls} className="space-y-0.5">
                        <div className="flex justify-between font-medium text-slate-700">
                          <span>{cls}</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              cls === analysis.aiPrediction.class ? 'bg-blue-600' : 'bg-slate-300'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* AI Screening Summary Observation */}
            <div className="card bg-blue-50/50 border-blue-200">
              <h3 className="font-bold text-sm text-blue-950 mb-1 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                AI Screening Observation Summary
              </h3>
              <p className="text-xs text-blue-900 leading-relaxed">
                The analyzed {analysis.fileType} signal recorded an average heart rate of {analysis.heartRate.average} BPM. The model classified the pattern as <strong>{analysis.aiPrediction.class}</strong> with {(analysis.aiPrediction.confidence * 100).toFixed(1)}% confidence. Signal segment between {analysis.focusArea.startTime}s and {analysis.focusArea.endTime}s exhibited the strongest focus weight during model inference.
              </p>
            </div>
          </div>
        </div>

        {/* Doctor Review Display if review was conducted */}
        {analysis.review && (
          <div className="mb-6 card bg-emerald-50/60 border-emerald-200">
            <div className="flex items-center gap-2 mb-2">
              <FileCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-sm">Doctor Assessment Recorded</h3>
            </div>
            <div className="text-xs text-slate-800 space-y-1">
              <p><strong>Reviewer:</strong> {analysis.review.doctorName}</p>
              <p><strong>Clinical Assessment:</strong> <span className="font-bold text-emerald-700">{analysis.review.assessment}</span></p>
              <p><strong>Clinical Notes:</strong> {analysis.review.notes || 'No additional notes.'}</p>
              <p className="text-[10px] text-slate-500">Reviewed at: {new Date(analysis.review.reviewedAt).toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Mandatory Medical Disclaimer Callout */}
        <div className="p-4 rounded-xl bg-slate-900 text-slate-300 text-xs border border-slate-800 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-white block font-bold mb-0.5">Medical & Regulatory Disclaimer:</strong>
            CardioAI is an AI screening prototype developed for research and educational demonstrations. Results generated by the system do not constitute medical diagnosis or diagnostic advise. Please consult a licensed cardiologist or physician for evaluation of cardiac symptoms.
          </div>
        </div>

        {/* Multi-Language Report Download Modal */}
        <ReportDownloadModal
          isOpen={isDownloadModalOpen}
          analysis={analysis}
          onClose={() => setIsDownloadModalOpen(false)}
        />

        {/* CardioAI Assistant Chatbot Drawer */}
        <CardioAssistantChat analysis={analysis} />
      </div>
    </ProtectedRoute>
  )
}
