'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import FileUpload from '@/components/FileUpload'
import PatientDetailsModal, { PatientDetailsData } from '@/components/PatientDetailsModal'
import { PRELOADED_SAMPLES } from '@/services/mockDataService'
import { apiService } from '@/services/apiService'
import { useAuthStore } from '@/context/authContext'
import { useLanguage } from '@/context/LanguageContext'
import toast from 'react-hot-toast'
import { Activity, Play, Sparkles, FileCheck, Download, UserPlus, Database, CheckCircle2 } from 'lucide-react'

export default function UploadPage() {
  const { user } = useAuthStore()
  const { t } = useLanguage()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileType, setFileType] = useState<'ECG' | 'PPG'>('ECG')
  const [selectedSample, setSelectedSample] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false)
  const router = useRouter()

  const handleFileSelected = (file: File) => {
    setSelectedFile(file)
    setSelectedSample(null) // clear sample selection if custom file chosen
    toast.success(`Selected file: ${file.name}`)
  }

  const handleSampleSelected = (sample: any) => {
    setSelectedSample(sample)
    setSelectedFile(null)
    setFileType(sample.type)
    toast.success(`Loaded sample dataset: ${sample.title}`)
  }

  const handleAnalyzeClick = () => {
    if (!selectedFile && !selectedSample) {
      toast.error('Please upload a signal file or select a sample dataset.')
      return
    }
    
    if (user?.role === 'patient') {
      // Patient panel: Skip modal and use their own details
      const genderMap: Record<string, 'Male' | 'Female' | 'Other'> = {
        'male': 'Male',
        'female': 'Female',
        'other': 'Other'
      }
      const mappedGender = user.gender ? (genderMap[user.gender.toLowerCase()] || 'Other') : 'Other'

      executeAnalysis({
        patientName: user.name || 'Anonymous Patient',
        patientAge: user.age ? Number(user.age) : 30,
        patientGender: mappedGender,
        patientId: user.id || `PAT-${Date.now().toString().slice(-5)}`,
        clinicalNotes: 'Self-uploaded by patient.'
      })
    } else {
      // Doctor or Admin panel: Open patient details modal
      setIsPatientModalOpen(true)
    }
  }

  const executeAnalysis = async (patientDetails?: PatientDetailsData) => {
    setIsPatientModalOpen(false)
    setIsLoading(true)
    try {
      const res = await apiService.processSignal(
        selectedFile,
        fileType,
        selectedSample,
        patientDetails
      )
      toast.success('Patient record saved & AI analysis completed!')
      router.push(`/analysis/${res.data.id}`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to process signal. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-[1920px] mx-auto">
        {/* Header */}
        <div className="mb-8 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold rounded-full mb-3 shadow-sm">
            <UserPlus className="w-3.5 h-3.5 text-teal-600" />
            {user?.role === 'doctor' ? 'Doctor Clinical Upload & Patient Intake' : 'Cardiac Screening & Patient Upload'}
          </div>

          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            {t('uploadNewSignal')}
          </h1>
          <p className="text-slate-600 text-sm max-w-2xl leading-relaxed">
            Upload a single or multi-lead cardiac recording or select a pre-loaded research dataset. Attach patient details to save directly into history & doctor patient records.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Upload Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-7">
              <h2 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-teal-600" />
                1. {t('signalType')}
              </h2>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => setFileType('ECG')}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    fileType === 'ECG'
                      ? 'border-teal-600 bg-teal-50/90 text-teal-950 font-bold shadow-md'
                      : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-lg font-black">ECG</span>
                    <span className="text-[11px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded font-bold uppercase">
                      Voltage
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Electrocardiogram electrical signal leads.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setFileType('PPG')}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    fileType === 'PPG'
                      ? 'border-teal-600 bg-teal-50/90 text-teal-950 font-bold shadow-md'
                      : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-lg font-black">PPG</span>
                    <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold uppercase">
                      Optical
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Photoplethysmogram blood pulse waves.
                  </p>
                </button>
              </div>

              <h2 className="text-base font-extrabold text-slate-900 mb-3 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-teal-600" />
                2. Choose Signal File
              </h2>

              <FileUpload onFileSelected={handleFileSelected} isLoading={isLoading} />

              {/* Sample Files Download Bar */}
              <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-teal-700" /> Test Datasets & PhysioNet WFDB Files:
                  </span>
                  <span className="text-[11px] text-slate-500 font-semibold">Click to download to PC</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <a
                    href="/samples/sample_ecg_normal.csv"
                    download="sample_ecg_normal.csv"
                    className="px-2.5 py-1.5 bg-blue-100 text-blue-900 font-bold rounded-lg hover:bg-blue-200 transition-colors text-[11px]"
                  >
                    Standard ECG (.csv)
                  </a>
                  <a
                    href="/samples/sample_ppg_normal.csv"
                    download="sample_ppg_normal.csv"
                    className="px-2.5 py-1.5 bg-emerald-100 text-emerald-900 font-bold rounded-lg hover:bg-emerald-200 transition-colors text-[11px]"
                  >
                    Wearable PPG (.csv)
                  </a>
                  <a
                    href="/samples/100.hea"
                    download="100.hea"
                    className="px-2.5 py-1.5 bg-purple-100 text-purple-900 font-bold rounded-lg hover:bg-purple-200 transition-colors text-[11px]"
                  >
                    100.hea (Header)
                  </a>
                  <a
                    href="/samples/100.dat"
                    download="100.dat"
                    className="px-2.5 py-1.5 bg-indigo-100 text-indigo-900 font-bold rounded-lg hover:bg-indigo-200 transition-colors text-[11px]"
                  >
                    100.dat (Signal Data)
                  </a>
                  <a
                    href="/samples/100.atr"
                    download="100.atr"
                    className="px-2.5 py-1.5 bg-amber-100 text-amber-900 font-bold rounded-lg hover:bg-amber-200 transition-colors text-[11px]"
                  >
                    100.atr (Annotations)
                  </a>
                </div>
              </div>

              {/* Active Selection Display */}
              {(selectedFile || selectedSample) && (
                <div className="mt-4 p-4 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-800 block">
                      Active Selection
                    </span>
                    <p className="font-bold text-slate-900 text-sm">
                      {selectedFile ? selectedFile.name : selectedSample.title}
                    </p>
                    <p className="text-xs text-slate-600 font-medium">
                      Type: {fileType} | Source: {selectedFile ? 'Custom Upload' : 'Pre-loaded Sample'}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedFile(null)
                      setSelectedSample(null)
                    }}
                    className="text-xs text-red-600 hover:underline font-bold"
                  >
                    Clear
                  </button>
                </div>
              )}

              <button
                onClick={handleAnalyzeClick}
                disabled={(!selectedFile && !selectedSample) || isLoading}
                className="w-full py-4 mt-6 bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-teal-700/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Sparkles className="w-5 h-5 animate-spin text-white" />
                    Pre-processing & Running AI Model...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-white" />
                    Enter Patient Details & Analyze Recording
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Pre-loaded Sample Signals Sidebar (HIGH CONTRAST & BEAUTIFUL CARDS) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="p-2 bg-teal-50 border border-teal-200 rounded-xl">
                  <Sparkles className="w-5 h-5 text-teal-700" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Instant Test Datasets</h3>
                  <p className="text-xs text-slate-600 font-semibold">Pre-loaded research ECG/PPG recordings</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 font-medium my-3 leading-relaxed">
                No local ECG/PPG files on your device? Click any pre-loaded dataset below to test the platform instantly:
              </p>

              <div className="space-y-3 mt-4">
                {PRELOADED_SAMPLES.map((sample) => {
                  const isSelected = selectedSample?.id === sample.id
                  const isNormal = sample.predictionClass === 'Normal'
                  const isTachy = sample.predictionClass === 'Tachycardia'
                  const isBrady = sample.predictionClass === 'Bradycardia'
                  const isIrregular = sample.predictionClass === 'Irregular Rhythm'

                  return (
                    <button
                      key={sample.id}
                      onClick={() => handleSampleSelected(sample)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-teal-50 border-2 border-teal-600 shadow-md'
                          : 'bg-slate-50/70 hover:bg-slate-100/90 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />}
                          <span className="font-bold text-slate-900 text-xs sm:text-sm">
                            {sample.title}
                          </span>
                        </div>

                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-md font-extrabold uppercase tracking-wide shrink-0 ${
                            isNormal
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                              : isTachy
                              ? 'bg-rose-100 text-rose-900 border border-rose-200'
                              : isBrady
                              ? 'bg-blue-100 text-blue-900 border border-blue-200'
                              : isIrregular
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : 'bg-purple-100 text-purple-900 border border-purple-200'
                          }`}
                        >
                          {sample.predictionClass}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium leading-normal line-clamp-2">
                        {sample.description}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Doctor Patient Details Modal */}
        <PatientDetailsModal
          isOpen={isPatientModalOpen}
          onClose={() => setIsPatientModalOpen(false)}
          onSubmit={executeAnalysis}
          fileName={selectedFile ? selectedFile.name : selectedSample?.title || `${fileType}_recording.csv`}
          fileType={fileType}
        />
      </div>
    </ProtectedRoute>
  )
}
