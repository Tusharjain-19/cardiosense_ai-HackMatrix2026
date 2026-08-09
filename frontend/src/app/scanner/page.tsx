'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import WebcamPPGScanner from '@/components/WebcamPPGScanner'
import { apiService } from '@/services/apiService'
import { useAuthStore } from '@/context/authContext'
import { useLanguage } from '@/context/LanguageContext'
import toast from 'react-hot-toast'
import {
  Heart,
  Camera,
  Hand,
  User,
  Play,
  RotateCcw,
  Sparkles,
  Activity,
  AlertTriangle,
  Zap,
  Timer,
  Signal,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import type { PPGScanResult } from '@/types'

// ─── Constants ───────────────────────────────────────────────────────────────
const SCAN_DURATION = 30 // seconds

type ScannerState = 'idle' | 'ready' | 'capturing' | 'complete' | 'error'

export default function ScannerPage() {
  const { user } = useAuthStore()
  const { t } = useLanguage()
  const router = useRouter()

  const [mode, setMode] = useState<'finger' | 'face'>('finger')
  const [state, setState] = useState<ScannerState>('idle')
  const [isCapturing, setIsCapturing] = useState(false)
  const [bpm, setBpm] = useState(0)
  const [signalQuality, setSignalQuality] = useState(0)
  const [signalData, setSignalData] = useState<{ x: number; y: number }[]>([])
  const [elapsed, setElapsed] = useState(0)
  const [scanResult, setScanResult] = useState<PPGScanResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)

  // ─── Countdown Timer ─────────────────────────────────────────────────────
  useEffect(() => {
    if (isCapturing) {
      startTimeRef.current = Date.now()
      timerRef.current = setInterval(() => {
        const sec = Math.floor((Date.now() - startTimeRef.current) / 1000)
        setElapsed(sec)
      }, 250)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isCapturing])

  // ─── Handlers ────────────────────────────────────────────────────────────
  const handleCameraReady = useCallback(() => {
    setState('ready')
  }, [])

  const handleStartCapture = useCallback(() => {
    setState('capturing')
    setIsCapturing(true)
    setElapsed(0)
    setBpm(0)
    setSignalQuality(0)
    setSignalData([])
    setScanResult(null)
  }, [])

  const handleSignalUpdate = useCallback((signal: number[], currentBpm: number, quality: number) => {
    setBpm(currentBpm)
    setSignalQuality(quality)
    setSignalData(signal.map((y, x) => ({ x, y })))
  }, [])

  const handleComplete = useCallback((result: PPGScanResult) => {
    setIsCapturing(false)
    setState('complete')
    setScanResult(result)
    setBpm(result.bpm)
    setSignalQuality(result.signalQuality)

    // Build final signal data for display
    setSignalData(result.filteredSignal.slice(-150).map((y, x) => ({ x, y })))

    if (result.bpm > 0) {
      toast.success(`Scan complete! Heart rate: ${result.bpm} BPM`)
    } else {
      toast('Scan complete, but BPM could not be reliably determined. Try again with better contact.', { icon: '⚠️' })
    }
  }, [])

  const handleError = useCallback((error: string) => {
    setState('error')
    setIsCapturing(false)
    setErrorMessage(error)
    toast.error(error)
  }, [])

  const handleReset = useCallback(() => {
    setState('idle')
    setIsCapturing(false)
    setBpm(0)
    setSignalQuality(0)
    setSignalData([])
    setElapsed(0)
    setScanResult(null)
    setErrorMessage('')
  }, [])

  const handleAnalyzeWithAI = useCallback(async () => {
    if (!scanResult) return
    setIsAnalyzing(true)

    try {
      const patientDetails = user ? {
        patientName: user.name || 'Anonymous',
        patientAge: user.age ? Number(user.age) : 30,
        patientGender: user.gender === 'male' ? 'Male' : user.gender === 'female' ? 'Female' : 'Other',
        patientId: user.id || `PAT-${Date.now().toString().slice(-5)}`,
        clinicalNotes: `Webcam rPPG capture (${mode} mode). Duration: ${SCAN_DURATION}s. Live BPM: ${scanResult.bpm}.`,
      } : undefined

      const res = await apiService.processWebcamPPG(
        scanResult.rawSignal,
        scanResult.bpm,
        scanResult.signalQuality,
        SCAN_DURATION,
        patientDetails
      )

      toast.success('AI analysis created from webcam PPG!')
      if (res.data?.id) {
        router.push(`/analysis/${res.data.id}`)
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to create analysis. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }, [scanResult, user, mode, router])

  // ─── Quality Color ───────────────────────────────────────────────────────
  const qualityColor = signalQuality >= 60 ? 'emerald' : signalQuality >= 35 ? 'amber' : 'red'
  const qualityLabel = signalQuality >= 60 ? 'Good' : signalQuality >= 35 ? 'Fair' : 'Poor'
  const progressPercent = Math.min(100, (elapsed / SCAN_DURATION) * 100)

  // ─── BPM animation timing ───────────────────────────────────────────────
  const heartAnimDuration = bpm > 0 ? (60 / bpm) : 1.2

  return (
    <ProtectedRoute>
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-[1920px] mx-auto">
        {/* Medical Disclaimer */}
        <div className="bg-amber-50/90 backdrop-blur border border-amber-200/90 rounded-xl p-4 mb-6 shadow-sm">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-900 text-xs font-bold mb-1">Research Prototype — Not for Medical Use</p>
              <p className="text-amber-800 text-[11px] leading-relaxed font-medium">
                Webcam-based heart rate measurement is an approximation based on subtle skin color changes.
                Results may vary significantly based on lighting, skin tone, camera quality, and movement.
                <strong> Do not use this for clinical decisions.</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-full mb-3 shadow-sm">
            <Camera className="w-3.5 h-3.5 text-rose-600" />
            Live Webcam rPPG Scanner
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            Heart Rate Scanner
          </h1>
          <p className="text-slate-600 text-sm max-w-2xl leading-relaxed">
            Measure your heart rate using your webcam. Place your finger over the camera lens or sit facing the camera for contactless facial rPPG.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Camera & Controls */}
          <div className="lg:col-span-7 space-y-6">
            {/* Mode Selector */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-5">
              <h2 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-teal-600" />
                1. Select Capture Mode
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => { if (state === 'idle' || state === 'ready' || state === 'error') setMode('finger') }}
                  disabled={isCapturing}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    mode === 'finger'
                      ? 'border-rose-500 bg-rose-50/90 text-rose-950 font-bold shadow-md'
                      : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:border-slate-300 hover:bg-white'
                  } ${isCapturing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-base font-black flex items-center gap-2">
                      <Hand className="w-5 h-5" /> Finger
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold uppercase">
                      Recommended
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Press fingertip over camera lens. Higher signal quality.
                  </p>
                </button>

                <button
                  onClick={() => { if (state === 'idle' || state === 'ready' || state === 'error') setMode('face') }}
                  disabled={isCapturing}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    mode === 'face'
                      ? 'border-rose-500 bg-rose-50/90 text-rose-950 font-bold shadow-md'
                      : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:border-slate-300 hover:bg-white'
                  } ${isCapturing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-base font-black flex items-center gap-2">
                      <User className="w-5 h-5" /> Face
                    </span>
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold uppercase">
                      Touchless
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Sit still facing camera. Requires good lighting.
                  </p>
                </button>
              </div>
            </div>

            {/* Camera Preview */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-5">
              <h2 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                <Camera className="w-4 h-4 text-teal-600" />
                2. Camera Feed
              </h2>

              {state !== 'error' ? (
                <WebcamPPGScanner
                  mode={mode}
                  duration={SCAN_DURATION}
                  isCapturing={isCapturing}
                  onComplete={handleComplete}
                  onSignalUpdate={handleSignalUpdate}
                  onError={handleError}
                  onCameraReady={handleCameraReady}
                />
              ) : (
                <div className="rounded-2xl bg-red-50 border border-red-200 p-8 text-center">
                  <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                  <p className="text-red-800 text-sm font-bold mb-1">Camera Error</p>
                  <p className="text-red-600 text-xs font-medium mb-4">{errorMessage}</p>
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* Progress Bar (during capture) */}
              {isCapturing && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-600 flex items-center gap-1.5">
                      <Timer className="w-3.5 h-3.5 text-teal-600" />
                      Capturing...
                    </span>
                    <span className="text-slate-900">{elapsed}s / {SCAN_DURATION}s</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-5 flex gap-3">
                {(state === 'ready' || state === 'complete') && !isCapturing && (
                  <button
                    onClick={handleStartCapture}
                    className="flex-1 py-3.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-rose-600/25 transition-all flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5 fill-white" />
                    {state === 'complete' ? 'Scan Again' : `Start ${SCAN_DURATION}s Scan`}
                  </button>
                )}

                {state === 'complete' && scanResult && (
                  <button
                    onClick={handleReset}
                    className="px-4 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-colors flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </button>
                )}
              </div>

              {/* Mode-specific instructions */}
              {(state === 'ready' || state === 'idle') && !isCapturing && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-blue-800 text-xs font-bold mb-1">
                    {mode === 'finger' ? '👆 Finger Mode Instructions' : '👤 Face Mode Instructions'}
                  </p>
                  <p className="text-blue-700 text-[11px] font-medium leading-relaxed">
                    {mode === 'finger'
                      ? 'Gently press your fingertip (index or middle finger) against the camera lens. You should see a warm red/pink glow on the preview. Stay still during the scan.'
                      : 'Sit ~50cm from your webcam in a well-lit room. Stay as still as possible. Avoid strong backlighting. The green dashed rectangle shows the region being analyzed.'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Live Stats & Results */}
          <div className="lg:col-span-5 space-y-5">
            {/* BPM Card */}
            <div className={`bg-white rounded-2xl border shadow-md p-6 transition-all ${
              state === 'complete' && bpm > 0
                ? 'border-emerald-300 bg-gradient-to-br from-white to-emerald-50/50'
                : 'border-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-500" />
                  Heart Rate
                </h3>
                {(isCapturing || state === 'complete') && (
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-wide ${
                    bpm > 0
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}>
                    {bpm > 0 ? 'Detected' : 'Measuring...'}
                  </span>
                )}
              </div>

              <div className="text-center py-6">
                {/* Animated Heart */}
                <div className="inline-flex items-center justify-center mb-4">
                  <div
                    className="relative"
                    style={{
                      animation: bpm > 0 ? `heartbeat ${heartAnimDuration}s ease-in-out infinite` : 'none'
                    }}
                  >
                    <Heart
                      className={`w-16 h-16 transition-colors ${
                        bpm > 0 ? 'text-rose-500 fill-rose-500' : 'text-slate-300'
                      }`}
                    />
                  </div>
                </div>

                {/* BPM Number */}
                <div className="flex items-baseline justify-center gap-2">
                  <span className={`text-6xl font-black tabular-nums tracking-tight transition-all ${
                    bpm > 0 ? 'text-slate-900' : 'text-slate-300'
                  }`}>
                    {bpm > 0 ? bpm : '--'}
                  </span>
                  <span className="text-xl font-bold text-slate-400">BPM</span>
                </div>

                {/* BPM Classification */}
                {state === 'complete' && bpm > 0 && (
                  <div className="mt-3">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold ${
                      bpm < 60
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : bpm > 100
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {bpm < 60 ? 'Bradycardia Range' : bpm > 100 ? 'Tachycardia Range' : 'Normal Range'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Signal Quality Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-5">
              <h3 className="text-sm font-extrabold text-slate-900 mb-3 flex items-center gap-2">
                <Signal className="w-4 h-4 text-teal-600" />
                Signal Quality
              </h3>

              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg ${
                  qualityColor === 'emerald'
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : qualityColor === 'amber'
                    ? 'bg-amber-100 text-amber-700 border border-amber-200'
                    : 'bg-red-100 text-red-700 border border-red-200'
                }`}>
                  {signalQuality > 0 ? signalQuality : '--'}
                </div>
                <div>
                  <p className={`text-sm font-extrabold ${
                    qualityColor === 'emerald' ? 'text-emerald-700' :
                    qualityColor === 'amber' ? 'text-amber-700' : 'text-red-700'
                  }`}>
                    {signalQuality > 0 ? qualityLabel : 'Awaiting Signal'}
                  </p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {mode === 'finger'
                      ? 'Press finger firmly for better quality'
                      : 'Stay still in good lighting'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Live Waveform Chart */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-5">
              <h3 className="text-sm font-extrabold text-slate-900 mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-600" />
                PPG Waveform
              </h3>

              <div className="h-40 w-full">
                {signalData.length > 5 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={signalData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                      <XAxis dataKey="x" hide />
                      <YAxis domain={[-1.2, 1.2]} hide />
                      <ReferenceLine y={0} stroke="#e2e8f0" strokeDasharray="3 3" />
                      <Line
                        type="monotone"
                        dataKey="y"
                        stroke="#e11d48"
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-center">
                      <Activity className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-400 font-semibold">
                        {state === 'idle' || state === 'ready'
                          ? 'Start a scan to see the waveform'
                          : 'Waiting for signal...'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Analyze with AI Button (shown after complete) */}
            {state === 'complete' && scanResult && scanResult.bpm > 0 && (
              <button
                onClick={handleAnalyzeWithAI}
                disabled={isAnalyzing}
                className="w-full py-4 bg-gradient-to-r from-teal-700 to-emerald-600 hover:from-teal-800 hover:to-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-teal-700/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <Sparkles className="w-5 h-5 animate-spin text-white" />
                    Running AI Analysis...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-white" />
                    Analyze with AI
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}

            {/* Quick Tips */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Tips for Best Results
              </h3>
              <ul className="space-y-2 text-xs text-slate-600 font-medium">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                  {mode === 'finger'
                    ? 'Cover the camera lens completely with your fingertip'
                    : 'Position your face in the center of the frame'
                  }
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                  Remain as still as possible during the scan
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                  Ensure good, consistent lighting (avoid flickering)
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                  {mode === 'finger'
                    ? 'Apply gentle, even pressure — don\'t press too hard'
                    : 'Avoid strong backlighting or direct sunlight on your face'
                  }
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
