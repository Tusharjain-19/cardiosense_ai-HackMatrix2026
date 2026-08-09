import { Analysis, User, SmartAlert, DoctorReview } from '@/types'

// Helper to generate mathematical ECG Waveform (P-Q-R-S-T wave)
export function generateECGWaveform(
  bpm: number = 72,
  durationSec: number = 15,
  samplingRate: number = 100,
  noiseLevel: number = 0.05
): number[] {
  const totalPoints = durationSec * samplingRate
  const period = (60 / bpm) * samplingRate // points per beat
  const signal: number[] = []

  for (let i = 0; i < totalPoints; i++) {
    const t = i % period
    const phase = t / period

    let value = 0

    // P wave (around phase 0.15)
    value += 0.15 * Math.exp(-Math.pow((phase - 0.15) / 0.03, 2))

    // Q wave (around phase 0.35)
    value -= 0.15 * Math.exp(-Math.pow((phase - 0.35) / 0.01, 2))

    // R peak (around phase 0.40)
    value += 1.2 * Math.exp(-Math.pow((phase - 0.40) / 0.015, 2))

    // S wave (around phase 0.45)
    value -= 0.35 * Math.exp(-Math.pow((phase - 0.45) / 0.015, 2))

    // T wave (around phase 0.70)
    value += 0.3 * Math.exp(-Math.pow((phase - 0.70) / 0.05, 2))

    // Random Gaussian noise
    const noise = (Math.random() - 0.5) * noiseLevel * 2
    signal.push(parseFloat((value + noise).toFixed(3)))
  }

  return signal
}

// Helper to generate mathematical PPG Waveform
export function generatePPGWaveform(
  bpm: number = 75,
  durationSec: number = 15,
  samplingRate: number = 100,
  noiseLevel: number = 0.04
): number[] {
  const totalPoints = durationSec * samplingRate
  const period = (60 / bpm) * samplingRate
  const signal: number[] = []

  for (let i = 0; i < totalPoints; i++) {
    const phase = (i % period) / period

    // Systolic peak
    let value = 0.8 * Math.exp(-Math.pow((phase - 0.25) / 0.1, 2))
    // Dicrotic notch & diastolic peak
    value += 0.4 * Math.exp(-Math.pow((phase - 0.55) / 0.08, 2))

    const noise = (Math.random() - 0.5) * noiseLevel * 2
    signal.push(parseFloat((value + noise).toFixed(3)))
  }

  return signal
}

// Mock Default Users
export const MOCK_USERS: User[] = [
  {
    id: 'user_patient_001',
    email: 'patient@cardiosense.ai',
    name: 'Rajesh Sharma',
    age: 45,
    gender: 'male',
    height: 175,
    weight: 74,
    role: 'patient',
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-08-08T14:30:00Z',
  },
  {
    id: 'user_doctor_001',
    email: 'doctor@cardiosense.ai',
    name: 'Dr. Rajesh V. Iyer',
    age: 44,
    gender: 'male',
    height: 172,
    weight: 68,
    role: 'doctor',
    createdAt: '2026-07-15T08:00:00Z',
    updatedAt: '2026-08-08T14:30:00Z',
  },
  {
    id: 'user_admin_001',
    email: 'admin@cardiosense.ai',
    name: 'Arjun Mehta (Admin)',
    age: 38,
    gender: 'male',
    height: 170,
    weight: 70,
    role: 'admin',
    createdAt: '2026-06-01T08:00:00Z',
    updatedAt: '2026-08-08T14:30:00Z',
  },
]

// Default Initial Mock Analyses (Empty by default - real user data only)
export const INITIAL_MOCK_ANALYSES: Analysis[] = []

// Mock Patients for Doctor Dashboard (Empty by default - real uploaded patients only)
export const MOCK_DOCTOR_PATIENTS: any[] = []

// Pre-loaded Sample Signals for Quick Upload Testing
export interface PreloadedSample {
  id: string
  title: string
  type: 'ECG' | 'PPG'
  bpm: number
  description: string
  predictionClass: 'Normal' | 'Bradycardia' | 'Tachycardia' | 'Irregular Rhythm' | 'Other'
  confidence: number
  qualityScore: number
  qualityStatus: 'GOOD' | 'MODERATE' | 'POOR'
}

export const PRELOADED_SAMPLES: PreloadedSample[] = [
  {
    id: 'sample_normal',
    title: 'Normal Resting ECG',
    type: 'ECG',
    bpm: 72,
    description: 'Clean ECG signal recorded at rest with standard 72 BPM sinus rhythm.',
    predictionClass: 'Normal',
    confidence: 0.968,
    qualityScore: 96,
    qualityStatus: 'GOOD',
  },
  {
    id: 'sample_tachycardia',
    title: 'Tachycardia ECG Signal',
    type: 'ECG',
    bpm: 126,
    description: 'ECG signal demonstrating elevated heart rate of 126 BPM.',
    predictionClass: 'Tachycardia',
    confidence: 0.914,
    qualityScore: 91,
    qualityStatus: 'GOOD',
  },
  {
    id: 'sample_bradycardia',
    title: 'Bradycardia ECG Signal',
    type: 'ECG',
    bpm: 48,
    description: 'ECG signal demonstrating slowed heart rate of 48 BPM.',
    predictionClass: 'Bradycardia',
    confidence: 0.882,
    qualityScore: 88,
    qualityStatus: 'GOOD',
  },
  {
    id: 'sample_irregular',
    title: 'Irregular Rhythm PPG',
    type: 'PPG',
    bpm: 84,
    description: 'Optical PPG pulse wave showing beat-to-beat interval variation.',
    predictionClass: 'Irregular Rhythm',
    confidence: 0.675,
    qualityScore: 65,
    qualityStatus: 'MODERATE',
  },
  {
    id: 'sample_mit_100',
    title: 'MIT-BIH Record 100 (WFDB)',
    type: 'ECG',
    bpm: 75,
    description: 'PhysioNet Arrhythmia Database Record 100 (360 Hz, MLII & V1 leads, 100.dat / 100.hea / 100.atr).',
    predictionClass: 'Normal',
    confidence: 0.985,
    qualityScore: 98,
    qualityStatus: 'GOOD',
  },
  {
    id: 'sample_noisy',
    title: 'Noisy / Low Quality ECG',
    type: 'ECG',
    bpm: 78,
    description: 'Signal containing motion artifact and baseline wander.',
    predictionClass: 'Normal',
    confidence: 0.530,
    qualityScore: 42,
    qualityStatus: 'POOR',
  },
]

// Storage helpers
const STORAGE_KEY_ANALYSES = 'cardioai_analyses'
const STORAGE_KEY_REVIEWS = 'cardioai_reviews'

export function getStoredAnalyses(): Analysis[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(STORAGE_KEY_ANALYSES)
  if (!stored) {
    localStorage.setItem(STORAGE_KEY_ANALYSES, JSON.stringify([]))
    return []
  }
  try {
    const list: Analysis[] = JSON.parse(stored)
    // Filter out old legacy dummy items
    const filtered = list.filter((a) => !a.id.startsWith('analysis_00'))
    return filtered
  } catch {
    return []
  }
}

export function saveAnalysis(analysis: Analysis): void {
  if (typeof window === 'undefined') return
  const current = getStoredAnalyses()
  const updated = [analysis, ...current]
  localStorage.setItem(STORAGE_KEY_ANALYSES, JSON.stringify(updated))
}

export function getAnalysisById(id: string): Analysis | null {
  const current = getStoredAnalyses()
  return current.find((a) => a.id === id) || null
}

export function deleteAnalysisById(id: string): void {
  if (typeof window === 'undefined') return
  const current = getStoredAnalyses()
  const filtered = current.filter((a) => a.id !== id)
  localStorage.setItem(STORAGE_KEY_ANALYSES, JSON.stringify(filtered))
}

export function saveDoctorReview(review: DoctorReview): void {
  if (typeof window === 'undefined') return
  const analyses = getStoredAnalyses()
  const targetIndex = analyses.findIndex((a) => a.id === review.analysisId)
  if (targetIndex !== -1) {
    analyses[targetIndex].review = review
    localStorage.setItem(STORAGE_KEY_ANALYSES, JSON.stringify(analyses))
  }
}
