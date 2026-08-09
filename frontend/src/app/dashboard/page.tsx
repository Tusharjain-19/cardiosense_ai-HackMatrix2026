'use client'

import React, { useEffect, useState } from 'react'
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
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { t } = useLanguage()
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [alerts, setAlerts] = useState<SmartAlert[]>([])

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
      list.forEach((a) => {
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

  const normalCount = analyses.filter((a) => a.aiPrediction.class === 'Normal').length
  const reviewCount = analyses.filter((a) => a.aiPrediction.confidence < 0.65).length
  const poorQualityCount = analyses.filter((a) => a.signalQuality.status === 'POOR').length
  const latestAnalysis = analyses[0] || null

  return (
    <ProtectedRoute>
      <div className="container-main">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {t('welcomeBack')}, {user?.name}!
              </h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 capitalize">
                {user?.role} Mode
              </span>
            </div>
            <p className="text-slate-600 text-sm">
              Continuous cardiac signal screening, explainability insights, and health tracking.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/upload" className="btn-primary">
              <UploadCloud className="w-4 h-4" /> + {t('uploadNewSignal')}
            </Link>
          </div>
        </div>

        {/* Quick Action Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Link
            href="/upload"
            className="card hover:shadow-lg transition-all border-l-4 border-l-blue-600 flex items-center justify-between group"
          >
            <div>
              <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                {t('uploadNewSignal')}
              </p>
              <p className="text-xs text-slate-500">Analyze CSV, TXT, EDF signal files</p>
            </div>
            <span className="p-2.5 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <UploadCloud className="w-5 h-5" />
            </span>
          </Link>

          <Link
            href="/history"
            className="card hover:shadow-lg transition-all border-l-4 border-l-emerald-600 flex items-center justify-between group"
          >
            <div>
              <p className="font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">
                {t('historyTrends')}
              </p>
              <p className="text-xs text-slate-500">Track heart rate & AI confidence</p>
            </div>
            <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <History className="w-5 h-5" />
            </span>
          </Link>

          {user?.role === 'doctor' ? (
            <Link
              href="/doctor/patients"
              className="card hover:shadow-lg transition-all border-l-4 border-l-purple-600 flex items-center justify-between group"
            >
              <div>
                <p className="font-semibold text-slate-900 group-hover:text-purple-600 transition-colors">
                  Doctor Patient Portal
                </p>
                <p className="text-xs text-slate-500">Review patient recordings</p>
              </div>
              <span className="p-2.5 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all">
                <Stethoscope className="w-5 h-5" />
              </span>
            </Link>
          ) : (
            <Link
              href="/history"
              className="card hover:shadow-lg transition-all border-l-4 border-l-amber-600 flex items-center justify-between group"
            >
              <div>
                <p className="font-semibold text-slate-900 group-hover:text-amber-600 transition-colors">
                  {t('screeningReports')}
                </p>
                <p className="text-xs text-slate-500">Download formatted PDF reports</p>
              </div>
              <span className="p-2.5 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all">
                <FileText className="w-5 h-5" />
              </span>
            </Link>
          )}
        </div>

        {/* Smart Alerts Banner if any exist */}
        {alerts.length > 0 && (
          <div className="mb-8 card border-l-4 border-l-amber-500 bg-amber-50/50">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-slate-900 text-sm">
                Smart Alerts ({alerts.length})
              </h3>
            </div>
            <div className="space-y-2">
              {alerts.slice(0, 2).map((alt) => (
                <div
                  key={alt.id}
                  className="bg-white p-3 rounded-lg border border-amber-200 flex items-center justify-between text-xs"
                >
                  <span className="text-slate-800">{alt.message}</span>
                  <Link
                    href={`/analysis/${alt.analysisId}`}
                    className="text-amber-700 font-semibold hover:underline flex items-center gap-1 shrink-0 ml-2"
                  >
                    Review <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dashboard Statistics */}
        {isLoading ? (
          <div className="text-center py-16 card">
            <Sparkles className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-slate-500 text-sm">Loading screening stats...</p>
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
      </div>
    </ProtectedRoute>
  )
}
