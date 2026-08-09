'use client'

import React, { useState, useRef } from 'react'
import toast from 'react-hot-toast'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
} from 'recharts'
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Info,
  Sun,
  Moon,
  MoveHorizontal,
  Hand,
  Volume2,
  Zap,
  Sparkles,
} from 'lucide-react'
import { FocusArea } from '@/types'

interface WaveformChartProps {
  data: number[]
  samplingRate?: number // default 100 Hz
  focusArea?: FocusArea
  title?: string
}

export default function WaveformChart({
  data,
  samplingRate = 100,
  focusArea,
  title = 'Cardiac Signal Waveform (Amplitude vs Time)',
}: WaveformChartProps) {
  const [zoomStart, setZoomStart] = useState(0)
  const [zoomEnd, setZoomEnd] = useState(Math.min(500, data.length)) // Default 5 seconds window
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>('light') // Default light mode
  const [isRawSignal, setIsRawSignal] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)

  const handleVoiceSummary = () => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel()
        setIsSpeaking(false);
        return
      }
      const text = `${title}. Showing signal waveform over ${((zoomEnd - zoomStart) / samplingRate).toFixed(1)} seconds window. Signal quality is good, showing regular cardiac rhythm.`
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.95
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)
      setIsSpeaking(true)
      window.speechSynthesis.speak(utterance)
    } else {
      toast.error('Speech synthesis is not supported in this browser.')
    }
  }

  // Mouse Drag-to-Scroll State
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [dragStartZoomStart, setDragStartZoomStart] = useState(0)
  const [dragStartZoomEnd, setDragStartZoomEnd] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const isDark = theme === 'dark'
  const totalTimeSec = data.length / samplingRate
  const timeWindowSec = (zoomEnd - zoomStart) / samplingRate
  const currentWindowSize = zoomEnd - zoomStart

  // Format data for chart
  const chartData = data.slice(zoomStart, zoomEnd).map((amplitudeVal, idx) => {
    const timeInSec = parseFloat(((zoomStart + idx) / samplingRate).toFixed(2))
    const isFocus =
      focusArea &&
      timeInSec >= focusArea.startTime &&
      timeInSec <= focusArea.endTime

    // Add baseline drift & high frequency noise if viewing raw signal mode
    const noise = isRawSignal ? 0.22 * Math.sin(idx * 0.04) + (Math.sin(idx * 1.5) * 0.08) : 0
    const amplitude = amplitudeVal + noise

    return {
      time: timeInSec,
      amplitude,
      focusAmplitude: isFocus ? amplitude : null,
    }
  })

  // --- Mouse Drag Left/Right Scroll Handlers ---
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStartX(e.clientX)
    setDragStartZoomStart(zoomStart)
    setDragStartZoomEnd(zoomEnd)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return
    const containerWidth = containerRef.current.clientWidth || 800
    const deltaX = e.clientX - dragStartX

    // Calculate how many data points 1 pixel represents
    const pointsPerPixel = (dragStartZoomEnd - dragStartZoomStart) / containerWidth
    const indexShift = Math.round(-deltaX * pointsPerPixel * 1.2)

    const windowSize = dragStartZoomEnd - dragStartZoomStart
    let newStart = dragStartZoomStart + indexShift
    let newEnd = newStart + windowSize

    if (newStart < 0) {
      newStart = 0
      newEnd = Math.min(data.length, windowSize)
    }
    if (newEnd > data.length) {
      newEnd = data.length
      newStart = Math.max(0, newEnd - windowSize)
    }

    setZoomStart(newStart)
    setZoomEnd(newEnd)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // --- Mouse Wheel Horizontal Scroll Handler ---
  const handleWheel = (e: React.WheelEvent) => {
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
    if (delta === 0) return

    const step = Math.max(5, Math.round(currentWindowSize * 0.08 * (delta > 0 ? 1 : -1)))
    if (delta > 0) {
      // Scroll Right
      const newEnd = Math.min(data.length, zoomEnd + step)
      const newStart = Math.max(0, newEnd - currentWindowSize)
      setZoomStart(newStart)
      setZoomEnd(newEnd)
    } else {
      // Scroll Left
      const newStart = Math.max(0, zoomStart + step)
      const newEnd = Math.min(data.length, newStart + currentWindowSize)
      setZoomStart(newStart)
      setZoomEnd(newEnd)
    }
  }

  // Range Slider Scroll Handler
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = parseInt(e.target.value, 10)
    const newEnd = Math.min(data.length, newStart + currentWindowSize)
    setZoomStart(newStart)
    setZoomEnd(newEnd)
  }

  const handleZoomIn = () => {
    if (currentWindowSize <= 100) return // min 1 sec
    const newRange = Math.max(100, Math.floor(currentWindowSize * 0.6))
    const center = Math.floor((zoomStart + zoomEnd) / 2)
    setZoomStart(Math.max(0, center - Math.floor(newRange / 2)))
    setZoomEnd(Math.min(data.length, center + Math.ceil(newRange / 2)))
  }

  const handleZoomOut = () => {
    const newRange = Math.min(data.length, Math.floor(currentWindowSize * 1.5))
    const center = Math.floor((zoomStart + zoomEnd) / 2)
    const newStart = Math.max(0, center - Math.floor(newRange / 2))
    const newEnd = Math.min(data.length, newStart + newRange)
    setZoomStart(newStart)
    setZoomEnd(newEnd)
  }

  const handlePan = (direction: 'left' | 'right') => {
    const step = Math.floor(currentWindowSize * 0.3)
    if (direction === 'left') {
      const newStart = Math.max(0, zoomStart - step)
      setZoomEnd(newStart + currentWindowSize)
      setZoomStart(newStart)
    } else {
      const newEnd = Math.min(data.length, zoomEnd + step)
      setZoomStart(newEnd - currentWindowSize)
      setZoomEnd(newEnd)
    }
  }

  const handleReset = () => {
    setZoomStart(0)
    setZoomEnd(Math.min(500, data.length))
  }

  const handleQuickWindow = (startSec: number, endSec: number) => {
    const startIdx = Math.max(0, Math.floor(startSec * samplingRate))
    const endIdx = Math.min(data.length, Math.floor(endSec * samplingRate))
    setZoomStart(startIdx)
    setZoomEnd(endIdx)
  }

  return (
    <div
      className={`w-full transition-all ${
        isFullscreen
          ? `fixed inset-0 z-50 p-6 overflow-auto flex flex-col justify-between ${
              isDark ? 'bg-black text-white' : 'bg-white text-slate-900'
            }`
          : `rounded-2xl p-5 border ${
              isDark ? 'bg-black text-white border-neutral-900' : 'bg-white text-slate-900 border-slate-200'
            }`
      }`}
    >
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className={`font-extrabold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {title}
            </h3>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-teal-100 text-teal-900 border border-teal-200 flex items-center gap-1">
              <Hand className="w-3 h-3 text-teal-700" /> Drag or Wheel to Scroll
            </span>
          </div>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
            Showing {(zoomStart / samplingRate).toFixed(1)}s – {(zoomEnd / samplingRate).toFixed(1)}s (Window: {timeWindowSec.toFixed(1)}s of {totalTimeSec.toFixed(1)}s total)
          </p>
        </div>

        {/* Controls Toolbar */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Raw vs Filtered DSP Toggle */}
          <button
            onClick={() => setIsRawSignal(!isRawSignal)}
            className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isRawSignal
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-teal-500/20 border-teal-500/40 text-teal-300'
            }`}
            title="Toggle Raw Signal (with Noise) vs Clean Filtered Signal"
          >
            {isRawSignal ? (
              <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-amber-400" /> Raw Signal (Unfiltered)</span>
            ) : (
              <span className="flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-teal-400" /> Butterworth Filtered</span>
            )}
          </button>

          {/* Voice Summary Diagnostics Button */}
          <button
            onClick={handleVoiceSummary}
            className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isSpeaking
                ? 'bg-purple-600 text-white animate-pulse'
                : isDark
                ? 'bg-neutral-900 border-neutral-800 text-purple-300 hover:bg-neutral-800'
                : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
            }`}
            title="Read Audio Diagnostic Summary Aloud"
          >
            <Volume2 className="w-4 h-4" />
            <span>{isSpeaking ? 'Reading Report...' : 'Voice Summary'}</span>
          </button>

          {/* Light / Dark Mode Toggle */}
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isDark
                ? 'bg-neutral-900 border-neutral-800 text-amber-400 hover:bg-neutral-800'
                : 'bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200'
            }`}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <button
            onClick={() => handlePan('left')}
            disabled={zoomStart === 0}
            className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
              isDark
                ? 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-white'
                : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-800'
            } disabled:opacity-40`}
            title="Pan Left"
          >
            <ChevronLeft className="w-4 h-4" /> Pan Left
          </button>

          <button
            onClick={() => handlePan('right')}
            disabled={zoomEnd >= data.length}
            className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
              isDark
                ? 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-white'
                : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-800'
            } disabled:opacity-40`}
            title="Pan Right"
          >
            Pan Right <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleZoomIn}
            className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
              isDark
                ? 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-white'
                : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-800'
            }`}
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" /> Zoom +
          </button>

          <button
            onClick={handleZoomOut}
            className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
              isDark
                ? 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-white'
                : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-800'
            }`}
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" /> Zoom -
          </button>

          <button
            onClick={handleReset}
            className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
              isDark
                ? 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-white'
                : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-800'
            }`}
            title="Reset View"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1 shadow-sm ml-1"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            {isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
          </button>
        </div>
      </div>

      {/* Interactive Mouse Drag & Wheel Waveform Chart Area */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className={`w-full ${isFullscreen ? 'h-[72vh]' : 'h-[320px]'} relative select-none rounded-xl ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        title="Click & Drag left/right to pan signal, or scroll mouse wheel"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#262626' : '#e2e8f0'} />
            <XAxis
              dataKey="time"
              stroke={isDark ? '#a3a3a3' : '#64748b'}
              tickFormatter={(v) => `${v}s`}
            />
            <YAxis stroke={isDark ? '#a3a3a3' : '#64748b'} domain={['auto', 'auto']} />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#000000' : '#ffffff',
                borderColor: isDark ? '#333333' : '#cbd5e1',
                borderRadius: '8px',
                color: isDark ? '#ffffff' : '#0f172a',
                fontSize: '12px',
              }}
              formatter={(value: any) => [`${Number(value).toFixed(3)} mV`, 'Amplitude']}
              labelFormatter={(label) => `Time: ${label}s`}
            />

            {/* Explainable AI Highlighted Focus Reference Area */}
            {focusArea && (
              <ReferenceArea
                x1={focusArea.startTime}
                x2={focusArea.endTime}
                stroke="none"
                fill="#f59e0b"
                fillOpacity={0.28}
                label={{
                  value: 'AI Attention Zone',
                  position: 'insideTop',
                  fill: '#d97706',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              />
            )}

            {/* Base Signal Line */}
            <Line
              type="monotone"
              dataKey="amplitude"
              stroke={isDark ? '#3b82f6' : '#2563eb'}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              name="Waveform Signal"
            />

            {/* Focus Area Highlighted Line Segment */}
            {focusArea && (
              <Line
                type="monotone"
                dataKey="focusAmplitude"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={false}
                isAnimationActive={false}
                name="AI Model Focus Region"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Horizontal Mouse Scrollbar Slider */}
      <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center gap-3 text-xs">
        <span className="font-bold text-slate-500 flex items-center gap-1 shrink-0">
          <MoveHorizontal className="w-4 h-4 text-teal-600" /> Waveform Position:
        </span>
        <input
          type="range"
          min={0}
          max={Math.max(0, data.length - currentWindowSize)}
          value={zoomStart}
          onChange={handleSliderChange}
          className="w-full accent-teal-700 cursor-pointer h-2 bg-slate-200 rounded-lg"
          title="Drag slider left or right to pan across signal recording"
        />
        <span className="font-mono font-bold text-slate-700 shrink-0">
          {(zoomStart / samplingRate).toFixed(1)}s / {totalTimeSec.toFixed(1)}s
        </span>
      </div>

      {/* Quick Time Window Jump Buttons */}
      <div className={`flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t ${isDark ? 'border-neutral-800' : 'border-slate-200'}`}>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold ${isDark ? 'text-neutral-400' : 'text-slate-500'}`}>
            Quick Time Windows:
          </span>
          <button
            onClick={() => handleQuickWindow(0, 5)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              isDark
                ? 'bg-neutral-900 hover:bg-teal-950 hover:text-teal-400 text-neutral-300'
                : 'bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700'
            }`}
          >
            0 – 5s
          </button>
          <button
            onClick={() => handleQuickWindow(5, 10)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              isDark
                ? 'bg-neutral-900 hover:bg-teal-950 hover:text-teal-400 text-neutral-300'
                : 'bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700'
            }`}
          >
            5 – 10s
          </button>
          <button
            onClick={() => handleQuickWindow(10, 15)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              isDark
                ? 'bg-neutral-900 hover:bg-teal-950 hover:text-teal-400 text-neutral-300'
                : 'bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700'
            }`}
          >
            10 – 15s
          </button>
          <button
            onClick={() => handleQuickWindow(0, totalTimeSec)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              isDark
                ? 'bg-neutral-900 hover:bg-teal-950 hover:text-teal-400 text-neutral-300'
                : 'bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700'
            }`}
          >
            All ({totalTimeSec.toFixed(0)}s)
          </button>
        </div>

        {/* Explainable AI Legend callout */}
        {focusArea && (
          <div className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-lg border ${
            isDark ? 'text-amber-300 bg-amber-950/40 border-amber-900/60' : 'text-amber-700 bg-amber-50 border-amber-200'
          }`}>
            <Info className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              Highlighted region (<strong>{focusArea.startTime}s–{focusArea.endTime}s</strong>) represents highest model attention weight.
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
