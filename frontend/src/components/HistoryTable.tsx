'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Analysis } from '@/types'
import { Eye, Download, Trash2, Calendar, FileText, User, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/context/authContext'
import ReportDownloadModal from '@/components/ReportDownloadModal'
import ConfirmModal from '@/components/ConfirmModal'

interface HistoryTableProps {
  analyses: Analysis[]
  onDelete?: (id: string) => void
}

export default function HistoryTable({ analyses, onDelete }: HistoryTableProps) {
  const { user } = useAuthStore()
  const [itemToDelete, setItemToDelete] = useState<Analysis | null>(null)
  const [itemToDownload, setItemToDownload] = useState<Analysis | null>(null)

  const handleDownloadClick = (e: React.MouseEvent, analysis: Analysis) => {
    e.stopPropagation()
    setItemToDownload(analysis)
  }

  if (analyses.length === 0) {
    return (
      <div className="text-center py-16 card">
        <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <h3 className="font-bold text-slate-700 text-sm">No Analyses Found</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          You haven't uploaded any cardiac signal recordings yet.
        </p>
        <Link href="/upload" className="btn-primary text-xs">
          + Upload Your First Signal
        </Link>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-white">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
            <th className="px-4 py-3">Date & Time</th>
            <th className="px-4 py-3">Patient Record</th>
            <th className="px-4 py-3">Signal Type</th>
            <th className="px-4 py-3">File Name</th>
            <th className="px-4 py-3">Heart Rate</th>
            <th className="px-4 py-3">AI Prediction</th>
            <th className="px-4 py-3">Confidence</th>
            <th className="px-4 py-3">Signal Quality</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-xs">
          {analyses.map((item) => {
            const isNormal = item.aiPrediction.class === 'Normal'
            return (
              <tr key={item.id} className="hover:bg-teal-50/40 transition-colors">
                {/* Date & Time */}
                <td className="px-4 py-3.5 font-medium text-slate-900 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-teal-600" />
                    <span className="font-bold text-slate-900">
                      {new Date(item.uploadedAt).toLocaleString([], {
                        month: 'short',
                        day: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </td>

                {/* Patient Record */}
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center border border-teal-200 shrink-0">
                      {item.patientName ? item.patientName.charAt(0) : 'P'}
                    </div>
                    <div>
                      <strong className="text-slate-900 font-bold block text-xs">
                        {item.patientName || 'Rajesh Sharma'}
                      </strong>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {item.patientId || 'PAT-001'} {item.patientAge ? `(${item.patientAge}y)` : ''}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Signal Type */}
                <td className="px-4 py-3.5 font-extrabold text-slate-800">
                  <span className={`px-2 py-0.5 rounded text-[11px] ${item.fileType === 'ECG' ? 'bg-teal-100 text-teal-900' : 'bg-emerald-100 text-emerald-900'}`}>
                    {item.fileType}
                  </span>
                </td>

                {/* File Name */}
                <td className="px-4 py-3.5 text-slate-600 font-mono text-[11px]">{item.fileName}</td>

                {/* Heart Rate */}
                <td className="px-4 py-3.5 font-bold text-slate-900 whitespace-nowrap">
                  {item.heartRate.average} <span className="text-[10px] text-slate-400 font-normal">BPM</span>
                </td>

                {/* AI Prediction */}
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      isNormal
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {item.aiPrediction.class}
                  </span>
                </td>

                {/* Confidence */}
                <td className="px-4 py-3.5 font-semibold text-slate-900">
                  {(item.aiPrediction.confidence * 100).toFixed(1)}%
                </td>

                {/* Signal Quality */}
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      item.signalQuality.status === 'GOOD'
                        ? 'badge-good'
                        : item.signalQuality.status === 'MODERATE'
                        ? 'badge-warning'
                        : 'badge-danger'
                    }`}
                  >
                    {item.signalQuality.score}% ({item.signalQuality.status})
                  </span>
                </td>

                {/* Actions */}
                <td className="px-4 py-3.5 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/analysis/${item.id}`}
                      className="px-2.5 py-1.5 rounded-xl bg-teal-50 text-teal-900 hover:bg-teal-100 border border-teal-200 transition-colors text-xs font-bold flex items-center gap-1"
                      title="View Full AI Analysis & Insights"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-teal-700 animate-pulse" />
                      <span>AI Insights</span>
                    </Link>

                    <Link
                      href={`/analysis/${item.id}`}
                      className="p-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>

                    <button
                      onClick={(e) => handleDownloadClick(e, item)}
                      className="p-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                      title="Download Medical PDF Report"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    {onDelete && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setItemToDelete(item)
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Multi-Language Report Download Modal */}
      <ReportDownloadModal
        isOpen={!!itemToDownload}
        analysis={itemToDownload}
        onClose={() => setItemToDownload(null)}
      />

      {/* In-App Custom Confirm Modal */}
      <ConfirmModal
        isOpen={!!itemToDelete}
        title="Delete Analysis Record?"
        message={`Are you sure you want to delete recording "${itemToDelete?.fileName}" (${itemToDelete?.fileType})? This action cannot be undone.`}
        confirmText="Delete Record"
        cancelText="Cancel"
        variant="danger"
        onConfirm={() => {
          if (itemToDelete && onDelete) {
            onDelete(itemToDelete.id)
            setItemToDelete(null)
          }
        }}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  )
}
