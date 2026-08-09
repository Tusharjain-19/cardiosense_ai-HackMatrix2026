'use client'

import React, { useRef, useState } from 'react'
import { UploadCloud, FileText, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

interface FileUploadProps {
  onFileSelected: (file: File) => void
  isLoading?: boolean
}

export default function FileUpload({ onFileSelected, isLoading = false }: FileUploadProps) {
  const { t } = useLanguage()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState('')
  const [selectedFileName, setSelectedFileName] = useState('')

  const MAX_SIZE = 100 * 1024 * 1024 // 100MB

  const validateFile = (file: File): boolean => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['csv', 'txt', 'edf', 'dat', 'hea', 'atr'].includes(ext || '')) {
      setError('Invalid file format. Supported formats: CSV, TXT, EDF, DAT, HEA, ATR.')
      return false
    }

    if (file.size > MAX_SIZE) {
      setError('File size exceeds 100 MB limit.')
      return false
    }

    setError('')
    return true
  }

  const handleFile = (file: File) => {
    if (validateFile(file)) {
      setSelectedFileName(file.name)
      onFileSelected(file)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
          dragActive
            ? 'border-blue-500 bg-blue-50/80 scale-[1.01]'
            : selectedFileName
            ? 'border-emerald-400 bg-emerald-50/30'
            : 'border-slate-300 bg-white hover:bg-slate-50/80 hover:border-blue-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleChange}
          className="hidden"
          accept=".csv,.txt,.edf,.dat,.hea,.atr"
          disabled={isLoading}
        />

        <div className="flex flex-col items-center justify-center">
          {selectedFileName ? (
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3 shadow-inner">
              <CheckCircle2 className="w-7 h-7" />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 shadow-inner">
              <UploadCloud className="w-7 h-7" />
            </div>
          )}

          <h3 className="text-base font-bold text-slate-900 mb-1">
            {selectedFileName ? selectedFileName : t('dragDropText')}
          </h3>
          
          <p className="text-xs text-slate-500 max-w-sm mb-4">
            {selectedFileName
              ? 'File validated and ready for AI signal processing.'
              : t('orClickBrowse')}
          </p>

          <span className="inline-flex items-center gap-2 text-[11px] font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
            <FileText className="w-3.5 h-3.5 text-blue-600" /> {t('supportedFormats')}
          </span>
        </div>
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 text-red-700 bg-red-50 p-3 rounded-xl border border-red-200 text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
