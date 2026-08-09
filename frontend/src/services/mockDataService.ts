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

// Default Initial Mock Analyses
export const INITIAL_MOCK_ANALYSES: Analysis[] = [
  {
    id: 'analysis_001',
    userId: 'user_patient_001',
    patientName: 'Rajesh Sharma',
    fileType: 'ECG',
    fileName: 'ECG_resting_normal.csv',
    uploadedAt: '2026-08-08T14:30:00Z',
    signalQuality: {
      score: 96,
      status: 'GOOD',
      factors: { noise: 'low', baseline: 'stable', saturation: 'none' },
    },
    heartRate: {
      average: 72,
      min: 68,
      max: 79,
      variability: 'low',
    },
    aiPrediction: {
      class: 'Normal',
      confidence: 0.968,
      classDistribution: {
        Normal: 0.968,
        Bradycardia: 0.014,
        Tachycardia: 0.010,
        'Irregular Rhythm': 0.005,
        Other: 0.003,
      },
    },
    anomalyScore: 0.12,
    focusArea: {
      startTime: 3.2,
      endTime: 4.1,
      description: 'Standard sinus rhythm with sharp, clear QRS complexes.',
    },
    rawSignal: generateECGWaveform(72, 15, 100, 0.03),
    processingTime: 1.8,
    status: 'COMPLETED',
  },
  {
    id: 'analysis_002',
    userId: 'user_patient_001',
    patientName: 'Rajesh Sharma',
    fileType: 'ECG',
    fileName: 'ECG_post_exercise.csv',
    uploadedAt: '2026-08-06T18:15:00Z',
    signalQuality: {
      score: 91,
      status: 'GOOD',
      factors: { noise: 'low', baseline: 'stable', saturation: 'none' },
    },
    heartRate: {
      average: 126,
      min: 118,
      max: 135,
      variability: 'moderate',
    },
    aiPrediction: {
      class: 'Tachycardia',
      confidence: 0.914,
      classDistribution: {
        Normal: 0.052,
        Bradycardia: 0.014,
        Tachycardia: 0.914,
        'Irregular Rhythm': 0.012,
        Other: 0.008,
      },
    },
    anomalyScore: 0.76,
    focusArea: {
      startTime: 4.5,
      endTime: 5.8,
      description: 'Short RR intervals indicating elevated heart rate.',
    },
    rawSignal: generateECGWaveform(126, 15, 100, 0.04),
    processingTime: 2.1,
    status: 'COMPLETED',
  },
  {
    id: 'analysis_003',
    userId: 'user_patient_001',
    patientName: 'Rajesh Sharma',
    fileType: 'PPG',
    fileName: 'PPG_wrist_optical.txt',
    uploadedAt: '2026-08-04T09:45:00Z',
    signalQuality: {
      score: 61,
      status: 'MODERATE',
      factors: { noise: 'moderate', baseline: 'drift', saturation: 'none' },
    },
    heartRate: {
      average: 84,
      min: 71,
      max: 102,
      variability: 'high',
    },
    aiPrediction: {
      class: 'Irregular Rhythm',
      confidence: 0.635,
      classDistribution: {
        Normal: 0.220,
        Bradycardia: 0.045,
        Tachycardia: 0.080,
        'Irregular Rhythm': 0.635,
        Other: 0.020,
      },
    },
    anomalyScore: 0.68,
    focusArea: {
      startTime: 6.0,
      endTime: 7.5,
      description: 'Inconsistent beat-to-beat optical pulse interval.',
    },
    rawSignal: generatePPGWaveform(84, 15, 100, 0.12),
    processingTime: 2.4,
    status: 'COMPLETED',
  },
  {
    id: 'analysis_004',
    userId: 'user_patient_001',
    patientName: 'Rajesh Sharma',
    fileType: 'ECG',
    fileName: 'ECG_sleeping.edf',
    uploadedAt: '2026-08-01T04:20:00Z',
    signalQuality: {
      score: 88,
      status: 'GOOD',
      factors: { noise: 'low', baseline: 'stable', saturation: 'none' },
    },
    heartRate: {
      average: 48,
      min: 44,
      max: 52,
      variability: 'low',
    },
    aiPrediction: {
      class: 'Bradycardia',
      confidence: 0.882,
      classDistribution: {
        Normal: 0.095,
        Bradycardia: 0.882,
        Tachycardia: 0.005,
        'Irregular Rhythm': 0.010,
        Other: 0.008,
      },
    },
    anomalyScore: 0.54,
    focusArea: {
      startTime: 2.0,
      endTime: 4.2,
      description: 'Extended RR interval characteristic of nocturnal bradycardia.',
    },
    rawSignal: generateECGWaveform(48, 15, 100, 0.03),
    processingTime: 1.9,
    status: 'COMPLETED',
  },
  {
    id: 'analysis_005',
    userId: 'user_patient_001',
    patientName: 'Rajesh Sharma',
    fileType: 'ECG',
    fileName: 'ECG_noisy_motion.csv',
    uploadedAt: '2026-07-28T11:10:00Z',
    signalQuality: {
      score: 42,
      status: 'POOR',
      factors: { noise: 'high', baseline: 'unstable', saturation: 'partial' },
    },
    heartRate: {
      average: 76,
      min: 55,
      max: 110,
      variability: 'high',
    },
    aiPrediction: {
      class: 'Normal',
      confidence: 0.530,
      classDistribution: {
        Normal: 0.530,
        Bradycardia: 0.120,
        Tachycardia: 0.150,
        'Irregular Rhythm': 0.150,
        Other: 0.050,
      },
    },
    anomalyScore: 0.82,
    focusArea: {
      startTime: 1.2,
      endTime: 3.5,
      description: 'High amplitude motion artifact detected.',
    },
    rawSignal: generateECGWaveform(76, 15, 100, 0.35),
    processingTime: 2.8,
    status: 'COMPLETED',
  },
]

// Mock Patients for Doctor Dashboard
export const MOCK_DOCTOR_PATIENTS = [
  {
    id: 'patient_001',
    name: 'Rajesh Sharma (P001)',
    age: 45,
    gender: 'Male',
    latestAnalysis: INITIAL_MOCK_ANALYSES[0],
    totalAnalyses: 5,
  },
  {
    id: 'patient_002',
    name: 'Priya Patel (P002)',
    age: 62,
    gender: 'Female',
    latestAnalysis: INITIAL_MOCK_ANALYSES[2],
    totalAnalyses: 8,
  },
  {
    id: 'patient_003',
    name: 'Vikram Singh (P003)',
    age: 54,
    gender: 'Male',
    latestAnalysis: INITIAL_MOCK_ANALYSES[1],
    totalAnalyses: 3,
  },
  {
    id: 'patient_004',
    name: 'Sunita Rao (P004)',
    age: 29,
    gender: 'Female',
    latestAnalysis: INITIAL_MOCK_ANALYSES[4],
    totalAnalyses: 2,
  },
]

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
  if (typeof window === 'undefined') return INITIAL_MOCK_ANALYSES
  const stored = localStorage.getItem(STORAGE_KEY_ANALYSES)
  if (!stored) {
    localStorage.setItem(STORAGE_KEY_ANALYSES, JSON.stringify(INITIAL_MOCK_ANALYSES))
    return INITIAL_MOCK_ANALYSES
  }
  try {
    return JSON.parse(stored)
  } catch {
    return INITIAL_MOCK_ANALYSES
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
