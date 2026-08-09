'use client'

import React, { useState } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import Link from 'next/link'
import { MOCK_DOCTOR_PATIENTS } from '@/services/mockDataService'
import { Stethoscope, User, AlertTriangle, Eye, CheckCircle2, Search, Sparkles } from 'lucide-react'

export default function DoctorPatientsPage() {
  const [filter, setFilter] = useState<'ALL' | 'NORMAL' | 'REVIEW' | 'POOR'>('ALL')
  const [searchTerm, setSearchTerm] = useState('')

  const getFilteredPatients = () => {
    return MOCK_DOCTOR_PATIENTS.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase())
      if (!matchSearch) return false

      if (filter === 'ALL') return true
      if (filter === 'NORMAL') return p.latestAnalysis.aiPrediction.class === 'Normal'
      if (filter === 'REVIEW') return p.latestAnalysis.aiPrediction.confidence < 0.65 || p.latestAnalysis.aiPrediction.class !== 'Normal'
      if (filter === 'POOR') return p.latestAnalysis.signalQuality.status === 'POOR'
      return true
    })
  }

  const filteredList = getFilteredPatients()

  return (
    <ProtectedRoute requiredRole="doctor">
      <div className="container-main">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-200">
                <Stethoscope className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Doctor Workstation & Patient Queue
              </h1>
            </div>
            <p className="text-slate-600 text-sm">
              Clinical validation portal for multi-patient triage, AI confidence verification, and diagnostic sign-off.
            </p>
          </div>

          {/* Action Buttons required for Doctor */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/upload"
              className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-700/20 transition-all flex items-center gap-1.5"
            >
              + New Patient Intake & Signal Upload
            </Link>
            <Link
              href="/history"
              className="px-4 py-2.5 bg-slate-100 text-slate-800 hover:bg-slate-200 font-bold text-xs rounded-xl transition-all border border-slate-200"
            >
              View Patient Records History
            </Link>
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div className="card mb-6 p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="font-bold text-slate-500">Filter Patients:</span>
              <button
                onClick={() => setFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  filter === 'ALL'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All Patients ({MOCK_DOCTOR_PATIENTS.length})
              </button>
              <button
                onClick={() => setFilter('REVIEW')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  filter === 'REVIEW'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Needs Review
              </button>
              <button
                onClick={() => setFilter('NORMAL')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  filter === 'NORMAL'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Normal Rhythm
              </button>
              <button
                onClick={() => setFilter('POOR')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  filter === 'POOR'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Poor Quality Signal
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search patient name..."
                className="input-field pl-9 py-1.5 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Patients Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="px-4 py-3">Patient Name</th>
                <th className="px-4 py-3">Demographics</th>
                <th className="px-4 py-3">Latest Result</th>
                <th className="px-4 py-3">Heart Rate</th>
                <th className="px-4 py-3">AI Confidence</th>
                <th className="px-4 py-3">Signal Quality</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredList.map((p) => {
                const analysis = p.latestAnalysis
                const isAbnormal = analysis.aiPrediction.class !== 'Normal'
                return (
                  <tr key={p.id} className="hover:bg-emerald-50/40 transition-colors">
                    <td className="px-4 py-4 font-bold text-slate-900 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                        <User className="w-4 h-4" />
                      </div>
                      {p.name}
                    </td>
                    <td className="px-4 py-4 text-slate-500">
                      {p.age} yrs | {p.gender}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          isAbnormal ? 'badge-warning' : 'badge-good'
                        }`}
                      >
                        {analysis.aiPrediction.class}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-bold text-slate-900">
                      {analysis.heartRate.average} BPM
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-800">
                      {(analysis.aiPrediction.confidence * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          analysis.signalQuality.status === 'GOOD'
                            ? 'badge-good'
                            : analysis.signalQuality.status === 'MODERATE'
                            ? 'badge-warning'
                            : 'badge-danger'
                        }`}
                      >
                        {analysis.signalQuality.score}% ({analysis.signalQuality.status})
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => alert(`AI Prediction for ${p.name} APPROVED and signed by Doctor.`)}
                          className="px-2.5 py-1.5 bg-emerald-100 text-emerald-900 hover:bg-emerald-200 rounded-xl text-xs font-bold border border-emerald-300 flex items-center gap-1 transition-colors"
                          title="1-Click Doctor Approval"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Approve
                        </button>
                        <Link
                          href={`/analysis/${analysis.id}`}
                          className="px-2.5 py-1.5 bg-blue-50 text-blue-800 hover:bg-blue-100 rounded-xl text-xs font-bold border border-blue-200 flex items-center gap-1 transition-colors"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-blue-600" /> AI Insights
                        </Link>
                        <Link
                          href={`/doctor/review/${analysis.id}`}
                          className="px-3 py-1.5 bg-[#00605b] hover:bg-[#147a74] text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> Full Review
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filteredList.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-xs">
              No patients match the current filter selection.
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
