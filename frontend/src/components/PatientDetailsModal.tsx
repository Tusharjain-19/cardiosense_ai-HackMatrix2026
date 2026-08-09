'use client'

import React, { useState } from 'react'
import { User, Activity, FileText, Calendar, Hash, X, Check } from 'lucide-react'

export interface PatientDetailsData {
  patientName: string
  patientAge: number | ''
  patientGender: 'Male' | 'Female' | 'Other'
  patientId: string
  clinicalNotes: string
}

interface PatientDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: PatientDetailsData) => void
  fileName?: string
  fileType?: 'ECG' | 'PPG'
}

export default function PatientDetailsModal({
  isOpen,
  onClose,
  onSubmit,
  fileName = 'recording.csv',
  fileType = 'ECG',
}: PatientDetailsModalProps) {
  const [patientName, setPatientName] = useState('Rajesh Sharma')
  const [patientAge, setPatientAge] = useState<number | ''>(45)
  const [patientGender, setPatientGender] = useState<'Male' | 'Female' | 'Other'>('Male')
  const [patientId, setPatientId] = useState(`PAT-${Math.floor(10000 + Math.random() * 90000)}`)
  const [clinicalNotes, setClinicalNotes] = useState('Routine cardiac screening & arrhythmia risk evaluation.')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      patientName: patientName.trim() || 'Anonymous Patient',
      patientAge: patientAge === '' ? 45 : Number(patientAge),
      patientGender,
      patientId: patientId.trim() || `PAT-${Date.now().toString().slice(-5)}`,
      clinicalNotes: clinicalNotes.trim(),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-teal-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-500/20 rounded-xl border border-teal-400/30">
              <User className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Doctor Clinical Portal — Patient Details</h3>
              <p className="text-xs text-teal-200">
                Attach patient record details before running AI analysis
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected File Banner */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-700">
          <span className="flex items-center gap-1.5 font-mono text-slate-900">
            <FileText className="w-4 h-4 text-teal-700" /> {fileName}
          </span>
          <span className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-bold uppercase">
            {fileType} Signal
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-left">
          {/* Patient Name */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">
              Patient Full Name *
            </label>
            <div className="relative flex items-center">
              <User className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                required
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                placeholder="e.g. Rajesh Sharma"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Age */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">
                Age
              </label>
              <input
                type="number"
                value={patientAge}
                onChange={(e) => setPatientAge(e.target.value === '' ? '' : parseInt(e.target.value))}
                min={1}
                max={120}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                placeholder="45"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">
                Gender
              </label>
              <select
                value={patientGender}
                onChange={(e) => setPatientGender(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Patient ID */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">
                Patient MRN / ID
              </label>
              <div className="relative flex items-center">
                <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full pl-8 pr-2 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  placeholder="PAT-98214"
                />
              </div>
            </div>
          </div>

          {/* Clinical Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">
              Doctor Clinical Notes & Symptoms
            </label>
            <textarea
              rows={2}
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
              placeholder="e.g. Mild shortness of breath, palpitation history..."
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-700/20 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Save Details & Run AI Screening
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
