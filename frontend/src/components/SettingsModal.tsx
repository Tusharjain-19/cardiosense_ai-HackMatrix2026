'use client'

import React, { useState, useEffect } from 'react'
import { useAuthStore } from '@/context/authContext'
import { useLanguage, LANGUAGES, Language } from '@/context/LanguageContext'
import { Settings, X, Save, User, Sliders, Bell, ShieldCheck, CheckCircle2, History, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

import { createPortal } from 'react-dom'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user, updateUser } = useAuthStore()
  const { language, setLanguage } = useLanguage()

  const [activeTab, setActiveTab] = useState<'profile' | 'clinical' | 'system'>('profile')
  const [mounted, setMounted] = useState(false)

  // Profile State
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [age, setAge] = useState<number | string>(45)
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male')
  const [height, setHeight] = useState<number | string>(175)
  const [weight, setWeight] = useState<number | string>(74)
  const [medicalConditions, setMedicalConditions] = useState('Mild Hypertension, Seasonal Allergies')

  // Clinical Signal Processing State
  const [defaultSignalType, setDefaultSignalType] = useState<'ECG' | 'PPG'>('ECG')
  const [samplingRate, setSamplingRate] = useState<number>(100)
  const [filterMode, setFilterMode] = useState<string>('bandpass')
  const [preferredLanguage, setPreferredLanguage] = useState<Language>('en')

  // System & Notification State
  const [audioAlerts, setAudioAlerts] = useState<boolean>(true)
  const [autoSaveHistory, setAutoSaveHistory] = useState<boolean>(true)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (user) {
      setName(user.name || 'Rajesh Sharma')
      setEmail(user.email || 'patient@cardiosense.ai')
      setAge(user.age || 45)
      setGender(user.gender || 'male')
      setHeight(user.height || 175)
      setWeight(user.weight || 74)
    }

    // Load extra saved settings from browser localStorage if available
    const savedExtra = localStorage.getItem('cardiosense_user_settings')
    if (savedExtra) {
      try {
        const parsed = JSON.parse(savedExtra)
        if (parsed.medicalConditions) setMedicalConditions(parsed.medicalConditions)
        if (parsed.defaultSignalType) setDefaultSignalType(parsed.defaultSignalType)
        if (parsed.samplingRate) setSamplingRate(parsed.samplingRate)
        if (parsed.filterMode) setFilterMode(parsed.filterMode)
        if (parsed.audioAlerts !== undefined) setAudioAlerts(parsed.audioAlerts)
        if (parsed.autoSaveHistory !== undefined) setAutoSaveHistory(parsed.autoSaveHistory)
      } catch (err) {
        console.warn('Failed to parse extra settings', err)
      }
    }
    setPreferredLanguage(language)
  }, [user, language, isOpen])

  if (!isOpen || !user || !mounted) return null

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()

    // 1. Update user profile in AuthStore & localStorage ('user' key)
    updateUser({
      name,
      email,
      age: Number(age) || 45,
      gender,
      height: Number(height) || 175,
      weight: Number(weight) || 74,
    })

    // 2. Save language choice
    setLanguage(preferredLanguage)

    // 3. Save extra clinical settings to browser storage ('cardiosense_user_settings')
    const extraSettings = {
      medicalConditions,
      defaultSignalType,
      samplingRate,
      filterMode,
      preferredLanguage,
      audioAlerts,
      autoSaveHistory,
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem('cardiosense_user_settings', JSON.stringify(extraSettings))

    toast.success('Settings & profile saved to browser storage!')
    onClose()
  }

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-md overflow-hidden">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in zoom-in-95 duration-150 flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-600/20 text-teal-400 rounded-xl border border-teal-500/30">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                Cardiosense AI Platform Settings
              </h2>
              <p className="text-xs text-slate-400">
                Manage patient profile, clinical preferences, and browser storage
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'profile'
                ? 'border-teal-600 text-teal-800 bg-white rounded-t-xl shadow-sm'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" /> Patient & User Profile
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('clinical')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'clinical'
                ? 'border-teal-600 text-teal-800 bg-white rounded-t-xl shadow-sm'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4" /> Signal & Clinical Preferences
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('system')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'system'
                ? 'border-teal-600 text-teal-800 bg-white rounded-t-xl shadow-sm'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bell className="w-4 h-4" /> System & Storage
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* TAB 1: USER & PATIENT PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Age (Years)
                  </label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    min="1"
                    max="120"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    User Role
                  </label>
                  <input
                    type="text"
                    disabled
                    value={user.role.toUpperCase()}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 capitalize cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Medical History & Pre-existing Conditions
                </label>
                <textarea
                  value={medicalConditions}
                  onChange={(e) => setMedicalConditions(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  placeholder="e.g. Mild Hypertension, Diabetes, Past Palpitations"
                />
              </div>
            </div>
          )}

          {/* TAB 2: CLINICAL PREFERENCES */}
          {activeTab === 'clinical' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Default Signal Modality
                  </label>
                  <select
                    value={defaultSignalType}
                    onChange={(e) => setDefaultSignalType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  >
                    <option value="ECG">ECG (Electrocardiogram)</option>
                    <option value="PPG">PPG (Photoplethysmogram Optical)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Default Sampling Rate
                  </label>
                  <select
                    value={samplingRate}
                    onChange={(e) => setSamplingRate(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  >
                    <option value={100}>100 Hz (Standard Screening)</option>
                    <option value={250}>250 Hz (Clinical Grade)</option>
                    <option value={360}>360 Hz (PhysioNet MIT-BIH Standard)</option>
                    <option value={500}>500 Hz (High Resolution Diagnostic)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Noise Filtering Pipeline
                  </label>
                  <select
                    value={filterMode}
                    onChange={(e) => setFilterMode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  >
                    <option value="bandpass">Bandpass Filter (0.5 Hz - 40 Hz)</option>
                    <option value="notch50">Notch Filter (50 Hz Powerline)</option>
                    <option value="notch60">Notch Filter (60 Hz Powerline)</option>
                    <option value="none">Raw Signal (No Filter)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Preferred UI & Report Language
                  </label>
                  <select
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value as Language)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.nativeName} ({lang.label})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SYSTEM & BROWSER STORAGE */}
          {activeTab === 'system' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl flex items-start gap-3 text-xs text-teal-900">
                <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold block text-teal-950">Local Browser Storage Persistence</strong>
                  All settings, patient credentials, and screening history are persisted directly inside your local browser storage (`localStorage`). No clinical data is stored externally without user consent.
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                  <div>
                    <span className="font-bold text-xs text-slate-800 block">Audio & In-App Alerts</span>
                    <span className="text-[11px] text-slate-500">Play alert sound when high anomaly score is detected</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={audioAlerts}
                    onChange={(e) => setAudioAlerts(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                  <div>
                    <span className="font-bold text-xs text-slate-800 block">Auto-Save Screening History</span>
                    <span className="text-[11px] text-slate-500">Automatically cache new signal analyses to browser storage</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoSaveHistory}
                    onChange={(e) => setAutoSaveHistory(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                  />
                </label>

                {/* Direct History Shortcut Button in Settings */}
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#00605b] text-white flex items-center justify-center font-bold">
                      <History className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Screening & Analysis History Records</h4>
                      <p className="text-[11px] text-slate-600">Access full history table, filtering, and PhysioNet export</p>
                    </div>
                  </div>
                  <Link
                    href="/history"
                    onClick={onClose}
                    className="px-4 py-2 bg-[#00605b] hover:bg-[#147a74] text-white text-xs font-extrabold rounded-xl shadow-sm flex items-center gap-1.5 whitespace-nowrap transition-all"
                  >
                    <span>Open History</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-md shadow-teal-700/20 transition-all flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" /> Save Settings to Storage
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
