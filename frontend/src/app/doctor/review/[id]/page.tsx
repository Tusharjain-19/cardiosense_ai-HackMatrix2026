'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import WaveformChart from '@/components/WaveformChart'
import { Analysis } from '@/types'
import { apiService } from '@/services/apiService'
import { useAuthStore } from '@/context/authContext'
import toast from 'react-hot-toast'
import { Stethoscope, CheckCircle, AlertTriangle, ArrowLeft, Save, FileCheck, ShieldCheck } from 'lucide-react'

export default function DoctorReviewPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [assessment, setAssessment] = useState<'CONFIRMED' | 'NEEDS_FURTHER_REVIEW' | 'NOT_RELIABLE'>('CONFIRMED')
  const [clinicalNotes, setClinicalNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const analysisId = params.id as string

  useEffect(() => {
    loadAnalysis()
  }, [analysisId])

  const loadAnalysis = async () => {
    try {
      setIsLoading(true)
      const res = await apiService.getAnalysis(analysisId)
      const data = res.data || null
      setAnalysis(data)
      if (data?.review) {
        setAssessment(data.review.assessment)
        setClinicalNotes(data.review.notes || '')
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to load analysis for review.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!analysis) return

    setIsSaving(true)
    try {
      await apiService.submitDoctorReview({
        id: `rev_${Date.now()}`,
        analysisId: analysis.id,
        doctorId: user?.id || 'doc_001',
        doctorName: user?.name || 'Dr. Sarah Jenkins',
        assessment,
        notes: clinicalNotes,
        reviewedAt: new Date().toISOString(),
      })
      toast.success('Clinical review saved successfully!')
      router.push('/doctor/patients')
    } catch (err) {
      toast.error('Failed to save review.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading || !analysis) {
    return (
      <ProtectedRoute requiredRole="doctor">
        <div className="container-main text-center py-16">
          <p className="text-slate-500 text-sm">Loading recording for clinical review...</p>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRole="doctor">
      <div className="container-main max-w-4xl">
        <button
          onClick={() => router.push('/doctor/patients')}
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-emerald-600 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Patient List
        </button>

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Stethoscope className="w-6 h-6 text-emerald-600" />
              Human-in-the-Loop Clinical Review
            </h1>
            <p className="text-xs text-slate-500">
              Patient: <strong>{analysis.patientName || 'John Doe'}</strong> | File: {analysis.fileName} ({analysis.fileType})
            </p>
          </div>

          <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full">
            Physician Interface
          </span>
        </div>

        {/* AI Output Summary Header */}
        <div className="card mb-6 bg-white text-slate-900 border border-slate-200 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-bold">AI Classification</span>
              <strong className="text-lg text-[#00605b] font-extrabold">{analysis.aiPrediction.class}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-bold">Model Confidence</span>
              <strong className="text-lg text-slate-900 font-extrabold">{(analysis.aiPrediction.confidence * 100).toFixed(1)}%</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-bold">Heart Rate</span>
              <strong className="text-lg text-emerald-700 font-extrabold">{analysis.heartRate.average} BPM</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-bold">Signal Quality</span>
              <strong className="text-lg text-amber-700 font-extrabold">{analysis.signalQuality.score}%</strong>
            </div>
          </div>
        </div>

        {/* Waveform Visualization */}
        <div className="card mb-6">
          <WaveformChart data={analysis.rawSignal} focusArea={analysis.focusArea} />
        </div>

        {/* Doctor Review Assessment Form */}
        <form onSubmit={handleSaveReview} className="card bg-emerald-50/50 border-emerald-200">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            Physician Assessment & Validation Form
          </h2>

          <div className="space-y-3 mb-6">
            <label className="block text-xs font-bold text-slate-700 uppercase">
              Clinical Validation Assessment:
            </label>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-2.5 ${
                  assessment === 'CONFIRMED'
                    ? 'border-emerald-600 bg-white font-bold text-emerald-950 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="assessment"
                  value="CONFIRMED"
                  checked={assessment === 'CONFIRMED'}
                  onChange={() => setAssessment('CONFIRMED')}
                  className="mt-0.5"
                />
                <div className="text-xs">
                  <span className="font-bold block text-emerald-800">Confirm AI Result</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    Model classification aligns with waveform analysis.
                  </span>
                </div>
              </label>

              <label
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-2.5 ${
                  assessment === 'NEEDS_FURTHER_REVIEW'
                    ? 'border-amber-600 bg-white font-bold text-amber-950 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="assessment"
                  value="NEEDS_FURTHER_REVIEW"
                  checked={assessment === 'NEEDS_FURTHER_REVIEW'}
                  onChange={() => setAssessment('NEEDS_FURTHER_REVIEW')}
                  className="mt-0.5"
                />
                <div className="text-xs">
                  <span className="font-bold block text-amber-800">Needs Further Review</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    Requires 12-lead ECG or Holter monitoring.
                  </span>
                </div>
              </label>

              <label
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-2.5 ${
                  assessment === 'NOT_RELIABLE'
                    ? 'border-red-600 bg-white font-bold text-red-950 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="assessment"
                  value="NOT_RELIABLE"
                  checked={assessment === 'NOT_RELIABLE'}
                  onChange={() => setAssessment('NOT_RELIABLE')}
                  className="mt-0.5"
                />
                <div className="text-xs">
                  <span className="font-bold block text-red-800">AI Result Not Reliable</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    High motion noise or false positive classification.
                  </span>
                </div>
              </label>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-bold text-[#00605b] uppercase mb-1">
              Physician Clinical Remarks & Patient Recommendations:
            </label>
            <textarea
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              rows={4}
              placeholder="Enter clinical remarks, diagnostic observations, or patient guidance..."
              className="input-field text-xs rounded-2xl"
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full btn-primary bg-[#00605b] hover:bg-[#147a74] py-3.5 rounded-full font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            {isSaving ? 'Updating Remarks...' : 'Save & Update Clinical Remarks'} <Save className="w-4 h-4" />
          </button>
        </form>
      </div>
    </ProtectedRoute>
  )
}
