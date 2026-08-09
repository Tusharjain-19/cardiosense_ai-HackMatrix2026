'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { generateAnalysisPDF, ReportLanguage } from '@/utils/pdfGenerator'
import { Analysis } from '@/types'
import ReportTemplate from './ReportTemplate'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { useAuthStore } from '@/context/authContext'
import { LANGUAGES, useLanguage } from '@/context/LanguageContext'
import { FileText, Download, X, Globe, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface ReportDownloadModalProps {
  isOpen: boolean
  analysis: Analysis | null
  onClose: () => void
}

export default function ReportDownloadModal({
  isOpen,
  analysis,
  onClose,
}: ReportDownloadModalProps) {
  const { user } = useAuthStore()
  const { language } = useLanguage()
  const [selectedLang, setSelectedLang] = useState<ReportLanguage>(language)
  const [isGenerating, setIsGenerating] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!isOpen || !analysis || !mounted) return null

  const handleDownload = async () => {
    try {
      setIsGenerating(true)
      await new Promise(r => setTimeout(r, 350))
      
      const page1El = document.getElementById('pdf-page-1')
      const page2El = document.getElementById('pdf-page-2')
      if (!page1El || !page2El) throw new Error('Report template pages not found')

      const canvas1 = await html2canvas(page1El, { scale: 2, useCORS: true, logging: false })
      const canvas2 = await html2canvas(page2El, { scale: 2, useCORS: true, logging: false })

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      // Add Page 1
      pdf.addImage(canvas1.toDataURL('image/png'), 'PNG', 0, 0, 210, 297)

      // Add Page 2
      pdf.addPage()
      pdf.addImage(canvas2.toDataURL('image/png'), 'PNG', 0, 0, 210, 297)

      pdf.save(`CardioSense_Report_${analysis.fileName.split('.')[0]}_${selectedLang}.pdf`)
      
      toast.success(`Clinical PDF Report exported successfully in ${LANGUAGES.find((l) => l.code === selectedLang)?.label || 'English'}!`)
      onClose()
    } catch (err) {
      console.error(err)
      toast.error('Failed to generate PDF report.')
    } finally {
      setIsGenerating(false)
    }
  }

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md overflow-hidden">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border border-teal-200">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 leading-tight">
              Clinical Screening Report PDF
            </h3>
            <p className="text-xs text-slate-500">
              Select output language for exported PDF document
            </p>
          </div>
        </div>

        {/* Recording Context Box */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs mb-5 space-y-1">
          <p className="font-bold text-slate-800">
            Recording: {analysis.fileName} ({analysis.fileType})
          </p>
          <p className="text-slate-600">
            Patient: {analysis.patientName || 'Rajesh Sharma'} | Result: <strong className="text-teal-700">{analysis.aiPrediction.class}</strong> ({ (analysis.aiPrediction.confidence * 100).toFixed(1) }%)
          </p>
        </div>

        {/* Language Options Selector Grid */}
        <div className="space-y-2 mb-6">
          <label className="block text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-teal-600" /> Select PDF Language (Default: English):
          </label>

          <div className="grid grid-cols-2 gap-2">
            {LANGUAGES.map((lang) => {
              const isSelected = selectedLang === lang.code
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setSelectedLang(lang.code as ReportLanguage)}
                  className={`p-2.5 rounded-xl border-2 text-left transition-all flex items-center justify-between text-xs ${
                    isSelected
                      ? 'border-teal-600 bg-teal-50/70 text-teal-950 font-bold shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <span className="font-bold block text-slate-900">{lang.nativeName}</span>
                    <span className="text-[10px] text-slate-500 font-medium">{lang.label}</span>
                  </div>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={isGenerating}
            className="px-4 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-md shadow-teal-700/20 transition-all flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            {isGenerating ? 'Generating...' : 'Export Clinical PDF'}
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(
    <>
      <div className="fixed top-[10000px] left-[10000px] opacity-0 pointer-events-none z-[-9999]">
        <ReportTemplate analysis={analysis} user={user} language={selectedLang} />
      </div>
      {modalContent}
    </>,
    document.body
  )
}
