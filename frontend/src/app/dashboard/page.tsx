'use client'

import React, { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/context/authContext'
import { useLanguage } from '@/context/LanguageContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardStats from '@/components/DashboardStats'
import { Analysis, SmartAlert } from '@/types'
import { apiService } from '@/services/apiService'
import {
  UploadCloud,
  History,
  FileText,
  Stethoscope,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Zap,
  ShieldCheck,
  Cpu,
  CheckCircle2,
  FileCheck2,
  Activity,
} from 'lucide-react'
import { HospitalDeviceLink } from '@/components/HospitalDeviceLink'
import { ClinicalTrialExporter } from '@/components/ClinicalTrialExporter'
import { useSearchParams } from 'next/navigation'

function DashboardContent() {
  const { user } = useAuthStore()
  const { t } = useLanguage()
  const searchParams = useSearchParams()
  const initialMode = searchParams ? searchParams.get('mode') || 'standard' : 'standard'

  const [activeMode, setActiveMode] = useState<string>(initialMode)
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [alerts, setAlerts] = useState<SmartAlert[]>([])

  useEffect(() => {
    if (searchParams) {
      const mode = searchParams.get('mode')
      if (mode) setActiveMode(mode)
    }
  }, [searchParams])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      const res = await apiService.getHistory()
      const list = res.data || []
      setAnalyses(list)

      // Derive smart alerts from analyses
      const generatedAlerts: SmartAlert[] = []
      list.forEach((a: Analysis) => {
        if (a.aiPrediction.confidence < 0.65) {
          generatedAlerts.push({
            id: `alert_conf_${a.id}`,
            analysisId: a.id,
            userId: a.userId,
            patientName: a.patientName || 'Patient',
            type: 'LOW_CONFIDENCE',
            message: `Recording ${a.fileName} flagged low AI confidence (${(a.aiPrediction.confidence * 100).toFixed(1)}%). Review recommended.`,
            severity: 'medium',
            createdAt: a.uploadedAt,
            isDismissed: false,
          })
        }
        if (a.signalQuality.status === 'POOR') {
          generatedAlerts.push({
            id: `alert_qual_${a.id}`,
            analysisId: a.id,
            userId: a.userId,
            patientName: a.patientName || 'Patient',
            type: 'POOR_QUALITY',
            message: `Recording ${a.fileName} contains significant signal noise (${a.signalQuality.score}% quality). Re-recording suggested.`,
            severity: 'high',
            createdAt: a.uploadedAt,
            isDismissed: false,
          })
        }
      })
      setAlerts(generatedAlerts)
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const normalCount = analyses.filter((a: Analysis) => a.aiPrediction.class === 'Normal').length
  const reviewCount = analyses.filter((a: Analysis) => a.aiPrediction.confidence < 0.65).length
  const poorQualityCount = analyses.filter((a: Analysis) => a.signalQuality.status === 'POOR').length
  const latestAnalysis = analyses[0] || null

  return (
    <ProtectedRoute>
      <div className="container-main min-h-[calc(100vh-5rem)] flex flex-col justify-between py-8 space-y-10">
        <div className="space-y-8">
          {/* Header Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#e7eeff] via-[#f0f3ff] to-[#dee8ff] text-[#111c2c] p-8 md:p-10 shadow-lg border border-[#bdc9c7]">
            <div className="absolute right-0 top-0 -mt-12 -mr-12 w-96 h-96 bg-[#00605b]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-[#b6ebd8]/30 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-[#147a74]/15 text-[#00605b] border border-[#147a74]/30">
                    <Sparkles className="w-3.5 h-3.5" /> Clinical Cardiac Screening
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-[#b6ebd8] text-[#3a6c5d] border border-[#9dd1bf] capitalize">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {user?.role || 'patient'} Portal Active
                  </span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#00605b]">
                  {t('welcomeBack')}, {user?.name || 'User'}!
                </h1>

                <p className="text-[#3e4947] text-sm sm:text-base leading-relaxed font-medium">
                  Real-time electrophysiological (ECG) and optical (PPG) screening powered by 1D-CNN deep learning with saliency Explainable AI (XAI) overlays.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0 flex-wrap">
                <Link
                  href="/history"
                  className="px-5 py-3 rounded-xl bg-white text-[#00605b] border border-teal-200 hover:bg-teal-50 font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
                >
                  <History className="w-4 h-4 text-[#00605b]" />
                  <span>View History Records</span>
                </Link>
                <Link
                  href="/upload"
                  className="btn-primary"
                >
                  <UploadCloud className="w-5 h-5" /> + {t('uploadNewSignal')}
                </Link>
              </div>
            </div>
          </div>

          {/* Mode Switcher Tabs for Hospital Direct Link & Exporter */}
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 overflow-x-auto">
            <button
              onClick={() => setActiveMode('standard')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeMode === 'standard'
                  ? 'bg-[#00605b] text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Activity className="w-4 h-4 text-emerald-300" />
              Standard Overview
            </button>
            <button
              onClick={() => setActiveMode('hospital')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeMode === 'hospital'
                  ? 'bg-emerald-700 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Zap className="w-4 h-4 text-emerald-300 animate-pulse" />
              Hospital Device Link (Web Serial / Oscilloscope)
            </button>
            <button
              onClick={() => setActiveMode('exporter')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeMode === 'exporter'
                  ? 'bg-indigo-700 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <FileCheck2 className="w-4 h-4 text-indigo-200" />
              Clinical Trial Exporter
            </button>
          </div>

          {/* Render Active Specialized Mode if selected */}
          {activeMode === 'hospital' && (
            <HospitalDeviceLink />
          )}

          {activeMode === 'exporter' && (
            <ClinicalTrialExporter analysisData={latestAnalysis} />
          )}

          {/* Quick Action Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <Link
              href="/upload"
              className="card p-6 hover:shadow-xl transition-all duration-300 border-l-4 border-l-blue-600 flex items-center justify-between group bg-white hover:-translate-y-1"
            >
              <div className="space-y-1">
                <p className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors">
                  {t('uploadNewSignal')}
                </p>
                <p className="text-xs text-slate-500">Analyze CSV, TXT, EDF clinical signals</p>
              </div>
              <span className="p-3 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                <UploadCloud className="w-6 h-6" />
              </span>
            </Link>

            <Link
              href="/history"
              className="card p-6 hover:shadow-xl transition-all duration-300 border-l-4 border-l-emerald-600 flex items-center justify-between group bg-white hover:-translate-y-1"
            >
              <div className="space-y-1">
                <p className="font-bold text-slate-900 text-base group-hover:text-emerald-600 transition-colors">
                  {t('historyTrends')}
                </p>
                <p className="text-xs text-slate-500">Track heart rate & AI confidence history</p>
              </div>
              <span className="p-3 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                <History className="w-6 h-6" />
              </span>
            </Link>

            {user?.role === 'doctor' ? (
              <Link
                href="/doctor/patients"
                className="card p-6 hover:shadow-xl transition-all duration-300 border-l-4 border-l-purple-600 flex items-center justify-between group bg-white hover:-translate-y-1"
              >
                <div className="space-y-1">
                  <p className="font-bold text-slate-900 text-base group-hover:text-purple-600 transition-colors">
                    Doctor Patient Portal
                  </p>
                  <p className="text-xs text-slate-500">Review patient cohorts & submitted notes</p>
                </div>
                <span className="p-3 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-sm">
                  <Stethoscope className="w-6 h-6" />
                </span>
              </Link>
            ) : (
              <Link
                href="/history"
                className="card p-6 hover:shadow-xl transition-all duration-300 border-l-4 border-l-amber-600 flex items-center justify-between group bg-white hover:-translate-y-1"
              >
                <div className="space-y-1">
                  <p className="font-bold text-slate-900 text-base group-hover:text-amber-600 transition-colors">
                    {t('screeningReports')}
                  </p>
                  <p className="text-xs text-slate-500">Download formatted PDF reports (i18n)</p>
                </div>
                <span className="p-3 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all shadow-sm">
                  <FileText className="w-6 h-6" />
                </span>
              </Link>
            )}
          </div>

          {/* Smart Alerts Banner if any exist */}
          {alerts.length > 0 && (
            <div className="card p-6 border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-50/80 to-white">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Smart System Alerts ({alerts.length})
                </h3>
              </div>
              <div className="space-y-2">
                {alerts.slice(0, 2).map((alt) => (
                  <div
                    key={alt.id}
                    className="bg-white p-3.5 rounded-xl border border-amber-200 flex items-center justify-between text-xs shadow-sm"
                  >
                    <span className="text-slate-800 font-medium">{alt.message}</span>
                    <Link
                      href={`/analysis/${alt.analysisId}`}
                      className="text-amber-700 font-bold hover:underline flex items-center gap-1 shrink-0 ml-3"
                    >
                      Review Analysis <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dashboard Statistics Component */}
          {isLoading ? (
            <div className="text-center py-20 card bg-white">
              <Sparkles className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-3" />
              <p className="text-slate-600 font-medium text-sm">Loading screening statistics & history...</p>
            </div>
          ) : (
            <DashboardStats
              totalAnalyses={analyses.length}
              normalCount={normalCount}
              reviewCount={reviewCount}
              poorQualityCount={poorQualityCount}
              latestAnalysis={latestAnalysis}
            />
          )}

          {/* Clinical Workflow & System Capabilities Highlights */}
          <div className="pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Clinical Capabilities & AI Architecture
                </h2>
                <p className="text-xs text-slate-500">
                  End-to-end electrophysiological analysis, explainability models, and patient report export.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="card p-6 bg-gradient-to-br from-white via-slate-50 to-blue-50/50 border border-slate-200 hover:border-blue-300 transition-all">
                <div className="p-3 rounded-xl bg-blue-100 text-blue-700 w-fit mb-4">
                  <Cpu className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-1">
                  1D-CNN Deep Learning
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Bandpass filtered 0.5–100Hz 1D Convolutional Neural Network trained on 3,600-sample windows for automated cardiac rhythm classification.
                </p>
                <div className="flex items-center gap-2 text-[11px] font-semibold text-blue-700">
                  <Zap className="w-3.5 h-3.5" /> Real-time Inference (&lt;2.0s)
                </div>
              </div>

              <div className="card p-6 bg-gradient-to-br from-white via-slate-50 to-emerald-50/50 border border-slate-200 hover:border-emerald-300 transition-all">
                <div className="p-3 rounded-xl bg-emerald-100 text-emerald-700 w-fit mb-4">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-1">
                  Explainable AI (XAI) Overlay
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Gradient backpropagation saliency heatmaps highlighting exact temporal regions that influenced the deep model prediction.
                </p>
                <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-700">
                  <ShieldCheck className="w-3.5 h-3.5" /> High Clinical Transparency
                </div>
              </div>

              <div className="card p-6 bg-gradient-to-br from-white via-slate-50 to-amber-50/50 border border-slate-200 hover:border-amber-300 transition-all">
                <div className="p-3 rounded-xl bg-amber-100 text-amber-700 w-fit mb-4">
                  <FileCheck2 className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-1">
                  Multi-Language PDF Exports
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Download formal clinical PDF reports formatted natively in 7 languages (English, Hindi, Tamil, Telugu, Gujarati, Marathi, Bengali).
                </p>
                <div className="flex items-center gap-2 text-[11px] font-semibold text-amber-700">
                  <FileText className="w-3.5 h-3.5" /> Native i18n Renderer
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-500">Loading Dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  )
}
