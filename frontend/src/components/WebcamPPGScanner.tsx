'use client'

import React, { useRef, useEffect, useCallback, useState } from 'react'
import {
  bandpassFilter,
  detectPeaks,
  computeBPM,
  computeSignalQuality,
  normalizeSignal,
  detrend,
  movingAverage,
} from '@/utils/ppgSignalProcessing'
import type { PPGScanResult } from '@/types'

// ─── Constants ───────────────────────────────────────────────────────────────
const TARGET_FPS = 30
const BUFFER_SECONDS = 10
const BUFFER_SIZE = TARGET_FPS * BUFFER_SECONDS // 300 samples
const LOW_CUT_HZ = 0.7   // 42 BPM minimum
const HIGH_CUT_HZ = 3.5  // 210 BPM maximum
const MIN_PEAK_DISTANCE = Math.floor(TARGET_FPS * 0.3) // ~0.3s between beats
const BPM_UPDATE_INTERVAL = 1000 // ms between BPM recalculations

// ─── Types ───────────────────────────────────────────────────────────────────
interface WebcamPPGScannerProps {
  mode: 'finger' | 'face'
  duration: number // seconds
  isCapturing: boolean
  onComplete: (result: PPGScanResult) => void
  onSignalUpdate: (signal: number[], bpm: number, quality: number) => void
  onError: (error: string) => void
  onCameraReady: () => void
}

export type CaptureState = 'idle' | 'requesting' | 'ready' | 'capturing' | 'processing' | 'complete' | 'error'

// ─── Component ───────────────────────────────────────────────────────────────
export default function WebcamPPGScanner({
  mode,
  duration,
  isCapturing,
  onComplete,
  onSignalUpdate,
  onError,
  onCameraReady,
}: WebcamPPGScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animFrameRef = useRef<number>(0)
  const signalBufferRef = useRef<number[]>([])
  const fullSignalRef = useRef<number[]>([])
  const lastBpmUpdateRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)
  const actualFpsRef = useRef<number>(TARGET_FPS)
  const frameCountRef = useRef<number>(0)
  const fpsStartTimeRef = useRef<number>(0)

  const [cameraActive, setCameraActive] = useState(false)
  const mountedRef = useRef(true)

  // ─── Start Camera ────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    // Stop any existing stream first (prevents conflicts on re-mount)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: mode === 'finger' ? 'environment' : 'user',
          width: { ideal: 320 },
          height: { ideal: 240 },
          frameRate: { ideal: TARGET_FPS },
        },
        audio: false,
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)

      // Check if component was unmounted while awaiting camera
      if (!mountedRef.current) {
        stream.getTracks().forEach(track => track.stop())
        return
      }

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        try {
          await videoRef.current.play()
        } catch (playErr) {
          // AbortError is harmless — happens when React Strict Mode
          // double-mounts or when navigating away during play()
          if (playErr instanceof DOMException && playErr.name === 'AbortError') {
            return
          }
          throw playErr
        }

        // Final mount check after async play()
        if (!mountedRef.current) return

        setCameraActive(true)
        onCameraReady()
      }
    } catch (err) {
      // Don't report errors if component unmounted
      if (!mountedRef.current) return

      const message = err instanceof Error ? err.message : 'Camera access denied'
      if (message.includes('NotAllowedError') || message.includes('denied')) {
        onError('Camera permission denied. Please allow camera access in your browser settings.')
      } else if (message.includes('NotFoundError')) {
        onError('No camera detected. Please connect a webcam and try again.')
      } else {
        onError(`Camera error: ${message}`)
      }
    }
  }, [mode, onError, onCameraReady])

  // ─── Stop Camera ─────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = 0
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
  }, [])

  // ─── Extract Green Channel ───────────────────────────────────────────────
  const extractGreenChannel = useCallback((): number | null => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState < 2) return null

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return null

    const vw = video.videoWidth
    const vh = video.videoHeight
    if (vw === 0 || vh === 0) return null

    canvas.width = vw
    canvas.height = vh

    // Define ROI based on mode
    let roiX: number, roiY: number, roiW: number, roiH: number

    if (mode === 'finger') {
      // Full frame for finger mode (finger covers entire lens)
      roiX = Math.floor(vw * 0.2)
      roiY = Math.floor(vh * 0.2)
      roiW = Math.floor(vw * 0.6)
      roiH = Math.floor(vh * 0.6)
    } else {
      // Central rectangle for face mode (forehead/cheek region)
      roiX = Math.floor(vw * 0.3)
      roiY = Math.floor(vh * 0.15)
      roiW = Math.floor(vw * 0.4)
      roiH = Math.floor(vh * 0.35)
    }

    ctx.drawImage(video, 0, 0, vw, vh)
    const imageData = ctx.getImageData(roiX, roiY, roiW, roiH)
    const pixels = imageData.data

    // Compute mean green channel value
    let greenSum = 0
    const pixelCount = roiW * roiH

    for (let i = 0; i < pixels.length; i += 4) {
      greenSum += pixels[i + 1] // Green channel
    }

    return greenSum / pixelCount
  }, [mode])

  // ─── Capture Loop ────────────────────────────────────────────────────────
  const captureLoop = useCallback(() => {
    if (!isCapturing) return

    const now = performance.now()
    const elapsed = (now - startTimeRef.current) / 1000

    // Track actual FPS
    frameCountRef.current++
    const fpsDelta = (now - fpsStartTimeRef.current) / 1000
    if (fpsDelta >= 1) {
      actualFpsRef.current = frameCountRef.current / fpsDelta
      frameCountRef.current = 0
      fpsStartTimeRef.current = now
    }

    // Check if duration exceeded
    if (elapsed >= duration) {
      // Processing complete — compute final result
      const rawSignal = [...fullSignalRef.current]
      const sampleRate = actualFpsRef.current || TARGET_FPS

      const detrended = detrend(rawSignal)
      const filtered = bandpassFilter(detrended, LOW_CUT_HZ, HIGH_CUT_HZ, sampleRate)
      const smoothed = movingAverage(filtered, 3)
      const peaks = detectPeaks(smoothed, MIN_PEAK_DISTANCE)
      const bpm = computeBPM(peaks, sampleRate)
      const quality = computeSignalQuality(rawSignal, filtered)

      const result: PPGScanResult = {
        rawSignal,
        filteredSignal: normalizeSignal(smoothed),
        bpm,
        signalQuality: quality,
        duration,
        sampleRate,
        mode,
        capturedAt: new Date().toISOString(),
      }

      onComplete(result)
      return
    }

    // Extract green channel value
    const greenValue = extractGreenChannel()
    if (greenValue !== null) {
      // Add to rolling buffer (for real-time display)
      signalBufferRef.current.push(greenValue)
      if (signalBufferRef.current.length > BUFFER_SIZE) {
        signalBufferRef.current.shift()
      }

      // Add to full signal (for final analysis)
      fullSignalRef.current.push(greenValue)

      // Periodically update BPM
      if (now - lastBpmUpdateRef.current >= BPM_UPDATE_INTERVAL) {
        lastBpmUpdateRef.current = now
        const buffer = signalBufferRef.current
        
        if (buffer.length > TARGET_FPS * 3) { // Need at least 3 seconds
          const sampleRate = actualFpsRef.current || TARGET_FPS
          const detrended = detrend(buffer)
          const filtered = bandpassFilter(detrended, LOW_CUT_HZ, HIGH_CUT_HZ, sampleRate)
          const smoothed = movingAverage(filtered, 3)
          const peaks = detectPeaks(smoothed, MIN_PEAK_DISTANCE)
          const bpm = computeBPM(peaks, sampleRate)
          const quality = computeSignalQuality(buffer, filtered)

          // Send normalized signal for display (last 150 points)
          const displaySignal = normalizeSignal(smoothed.slice(-150))
          onSignalUpdate(displaySignal, bpm, quality)
        }
      }
    }

    animFrameRef.current = requestAnimationFrame(captureLoop)
  }, [isCapturing, duration, mode, extractGreenChannel, onComplete, onSignalUpdate])

  // ─── Effects ─────────────────────────────────────────────────────────────

  // Start camera on mount
  useEffect(() => {
    mountedRef.current = true
    startCamera()
    return () => {
      mountedRef.current = false
      stopCamera()
    }
  }, [startCamera, stopCamera])

  // Start/stop capture loop
  useEffect(() => {
    if (isCapturing && cameraActive) {
      // Reset buffers
      signalBufferRef.current = []
      fullSignalRef.current = []
      lastBpmUpdateRef.current = 0
      frameCountRef.current = 0
      startTimeRef.current = performance.now()
      fpsStartTimeRef.current = performance.now()

      animFrameRef.current = requestAnimationFrame(captureLoop)
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
    }
  }, [isCapturing, cameraActive, captureLoop])

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full">
      {/* Video Preview */}
      <div className="relative overflow-hidden rounded-2xl bg-black aspect-video shadow-inner">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${
            mode === 'finger' ? 'scale-110' : ''
          }`}
          style={{ transform: mode === 'face' ? 'scaleX(-1)' : undefined }}
        />

        {/* ROI Overlay */}
        {cameraActive && (
          <div className="absolute inset-0 pointer-events-none">
            {mode === 'finger' ? (
              // Finger mode: soft vignette overlay
              <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />
            ) : (
              // Face mode: ROI rectangle guide
              <div className="absolute inset-0 flex items-start justify-center pt-[15%]">
                <div
                  className="border-2 border-dashed border-teal-400/70 rounded-xl"
                  style={{ width: '40%', height: '35%' }}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-teal-300/80 text-[10px] font-bold uppercase tracking-widest">
                      ROI
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Recording indicator */}
            {isCapturing && (
              <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-white text-xs font-bold tracking-wide">REC</span>
              </div>
            )}

            {/* Mode badge */}
            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <span className="text-white text-[11px] font-bold uppercase tracking-wider">
                {mode === 'finger' ? '👆 Finger' : '👤 Face'}
              </span>
            </div>
          </div>
        )}

        {/* No camera message */}
        {!cameraActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-slate-800 flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-slate-400 text-sm font-medium">Requesting camera access...</p>
            </div>
          </div>
        )}
      </div>

      {/* Hidden canvas for frame extraction */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
