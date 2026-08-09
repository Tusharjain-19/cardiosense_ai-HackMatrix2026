/**
 * PPG Signal Processing Utilities
 * 
 * Pure functions for in-browser digital signal processing of
 * photoplethysmography (PPG) signals extracted from webcam video.
 * No external dependencies — all processing is self-contained.
 */

// ─── IIR Butterworth Bandpass Filter ─────────────────────────────────────────
// 2nd-order Butterworth bandpass filter implemented as two cascaded
// biquad sections (high-pass + low-pass). Designed for ~30 fps sample rate.

interface BiquadCoeffs {
  b0: number
  b1: number
  b2: number
  a1: number
  a2: number
}

/**
 * Compute 2nd-order Butterworth low-pass biquad coefficients.
 */
function butterworthLowPass(cutoffHz: number, sampleRate: number): BiquadCoeffs {
  const omega = 2 * Math.PI * cutoffHz / sampleRate
  const sinOmega = Math.sin(omega)
  const cosOmega = Math.cos(omega)
  const alpha = sinOmega / (2 * Math.SQRT2) // Q = sqrt(2)/2 for Butterworth

  const a0 = 1 + alpha
  return {
    b0: ((1 - cosOmega) / 2) / a0,
    b1: (1 - cosOmega) / a0,
    b2: ((1 - cosOmega) / 2) / a0,
    a1: (-2 * cosOmega) / a0,
    a2: (1 - alpha) / a0,
  }
}

/**
 * Compute 2nd-order Butterworth high-pass biquad coefficients.
 */
function butterworthHighPass(cutoffHz: number, sampleRate: number): BiquadCoeffs {
  const omega = 2 * Math.PI * cutoffHz / sampleRate
  const sinOmega = Math.sin(omega)
  const cosOmega = Math.cos(omega)
  const alpha = sinOmega / (2 * Math.SQRT2)

  const a0 = 1 + alpha
  return {
    b0: ((1 + cosOmega) / 2) / a0,
    b1: (-(1 + cosOmega)) / a0,
    b2: ((1 + cosOmega) / 2) / a0,
    a1: (-2 * cosOmega) / a0,
    a2: (1 - alpha) / a0,
  }
}

/**
 * Apply a biquad filter (Direct Form I) to a signal.
 */
function applyBiquad(signal: number[], coeffs: BiquadCoeffs): number[] {
  const { b0, b1, b2, a1, a2 } = coeffs
  const out = new Array(signal.length)
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0

  for (let i = 0; i < signal.length; i++) {
    const x0 = signal[i]
    const y0 = b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2
    out[i] = y0
    x2 = x1; x1 = x0
    y2 = y1; y1 = y0
  }
  return out
}

/**
 * Bandpass filter a signal using cascaded Butterworth high-pass + low-pass.
 * 
 * @param signal    - Input signal array
 * @param lowCut    - Low cutoff frequency in Hz (e.g., 0.7 for 42 BPM)
 * @param highCut   - High cutoff frequency in Hz (e.g., 4.0 for 240 BPM)
 * @param sampleRate - Sample rate in Hz (typically ~30 for webcam)
 * @returns Filtered signal
 */
export function bandpassFilter(
  signal: number[],
  lowCut: number,
  highCut: number,
  sampleRate: number
): number[] {
  if (signal.length < 4) return signal

  const hpCoeffs = butterworthHighPass(lowCut, sampleRate)
  const lpCoeffs = butterworthLowPass(highCut, sampleRate)

  // Apply high-pass first, then low-pass
  const highPassed = applyBiquad(signal, hpCoeffs)
  return applyBiquad(highPassed, lpCoeffs)
}

// ─── Peak Detection ──────────────────────────────────────────────────────────

/**
 * Detect peaks (local maxima) in a signal with a minimum distance constraint.
 * 
 * @param signal      - Input signal array
 * @param minDistance  - Minimum number of samples between peaks
 * @returns Array of peak indices
 */
export function detectPeaks(signal: number[], minDistance: number): number[] {
  if (signal.length < 3) return []

  const peaks: number[] = []
  const threshold = computeAdaptiveThreshold(signal)

  for (let i = 1; i < signal.length - 1; i++) {
    if (
      signal[i] > signal[i - 1] &&
      signal[i] > signal[i + 1] &&
      signal[i] > threshold
    ) {
      // Check minimum distance from last peak
      if (peaks.length === 0 || (i - peaks[peaks.length - 1]) >= minDistance) {
        peaks.push(i)
      } else if (signal[i] > signal[peaks[peaks.length - 1]]) {
        // Replace last peak if this one is higher and within min distance
        peaks[peaks.length - 1] = i
      }
    }
  }

  return peaks
}

/**
 * Compute an adaptive threshold for peak detection.
 * Uses the mean + 0.3 * standard deviation of positive values.
 */
function computeAdaptiveThreshold(signal: number[]): number {
  const positiveValues = signal.filter(v => v > 0)
  if (positiveValues.length === 0) return 0

  const mean = positiveValues.reduce((a, b) => a + b, 0) / positiveValues.length
  const variance = positiveValues.reduce((sum, v) => sum + (v - mean) ** 2, 0) / positiveValues.length
  const std = Math.sqrt(variance)

  return mean + 0.3 * std
}

// ─── BPM Calculation ─────────────────────────────────────────────────────────

/**
 * Compute beats per minute from detected peak indices.
 * 
 * @param peakIndices - Array of sample indices where peaks occur
 * @param sampleRate  - Sample rate in Hz
 * @returns BPM value, or 0 if insufficient peaks
 */
export function computeBPM(peakIndices: number[], sampleRate: number): number {
  if (peakIndices.length < 2) return 0

  // Compute inter-peak intervals in seconds
  const intervals: number[] = []
  for (let i = 1; i < peakIndices.length; i++) {
    const intervalSamples = peakIndices[i] - peakIndices[i - 1]
    intervals.push(intervalSamples / sampleRate)
  }

  // Remove outliers (intervals that deviate > 50% from median)
  const sorted = [...intervals].sort((a, b) => a - b)
  const median = sorted[Math.floor(sorted.length / 2)]
  const filtered = intervals.filter(
    iv => iv > median * 0.5 && iv < median * 1.5
  )

  if (filtered.length === 0) return 0

  const meanInterval = filtered.reduce((a, b) => a + b, 0) / filtered.length
  const bpm = 60 / meanInterval

  // Clamp to physiological range
  return Math.max(40, Math.min(220, Math.round(bpm)))
}

// ─── Signal Quality ──────────────────────────────────────────────────────────

/**
 * Estimate signal quality based on signal-to-noise ratio and periodicity.
 * 
 * @param signal - Raw green-channel signal
 * @param filteredSignal - Bandpass-filtered signal
 * @returns Quality score 0–100
 */
export function computeSignalQuality(
  signal: number[],
  filteredSignal?: number[]
): number {
  if (signal.length < 10) return 0

  // Factor 1: Coefficient of Variation (lower = more stable = better)
  const mean = signal.reduce((a, b) => a + b, 0) / signal.length
  const variance = signal.reduce((sum, v) => sum + (v - mean) ** 2, 0) / signal.length
  const std = Math.sqrt(variance)
  const cv = mean !== 0 ? std / Math.abs(mean) : 1

  // CV-based score: very low CV means finger is covering camera well
  // Typical CV for good finger PPG: 0.001 – 0.05
  // Typical CV for noise/no contact: > 0.1
  const cvScore = Math.max(0, Math.min(100, (1 - cv * 10) * 100))

  // Factor 2: Signal range (filtered signal should have clear oscillations)
  let rangeScore = 50
  if (filteredSignal && filteredSignal.length > 10) {
    const fMax = Math.max(...filteredSignal)
    const fMin = Math.min(...filteredSignal)
    const range = fMax - fMin
    // Good PPG has noticeable range; noise is very small or very large
    rangeScore = range > 0.01 && range < 50 ? 80 : 30
  }

  // Factor 3: Mean brightness (for finger mode, higher green = finger covering)
  const brightnessScore = mean > 50 && mean < 250 ? 80 : 40

  // Weighted combination
  return Math.round(cvScore * 0.4 + rangeScore * 0.35 + brightnessScore * 0.25)
}

// ─── Normalization ───────────────────────────────────────────────────────────

/**
 * Normalize a signal to the range [-1, 1].
 */
export function normalizeSignal(signal: number[]): number[] {
  if (signal.length === 0) return []

  const max = Math.max(...signal)
  const min = Math.min(...signal)
  const range = max - min

  if (range === 0) return signal.map(() => 0)

  return signal.map(v => ((v - min) / range) * 2 - 1)
}

/**
 * Simple moving average smoother.
 * 
 * @param signal     - Input signal
 * @param windowSize - Number of samples to average over
 * @returns Smoothed signal
 */
export function movingAverage(signal: number[], windowSize: number): number[] {
  if (signal.length === 0 || windowSize < 1) return signal

  const halfWin = Math.floor(windowSize / 2)
  const result = new Array(signal.length)

  for (let i = 0; i < signal.length; i++) {
    const start = Math.max(0, i - halfWin)
    const end = Math.min(signal.length - 1, i + halfWin)
    let sum = 0
    for (let j = start; j <= end; j++) {
      sum += signal[j]
    }
    result[i] = sum / (end - start + 1)
  }

  return result
}

// ─── Detrending ──────────────────────────────────────────────────────────────

/**
 * Remove linear trend (DC drift) from a signal.
 */
export function detrend(signal: number[]): number[] {
  const n = signal.length
  if (n < 2) return signal

  // Least-squares linear fit
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
  for (let i = 0; i < n; i++) {
    sumX += i
    sumY += signal[i]
    sumXY += i * signal[i]
    sumX2 += i * i
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  return signal.map((v, i) => v - (slope * i + intercept))
}
