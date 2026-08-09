// User & Authentication Types
export type UserRole = 'patient' | 'doctor' | 'admin'

export interface User {
  id: string
  email: string
  name: string
  age: number
  gender: 'male' | 'female' | 'other'
  height: number // in cm
  weight: number // in kg
  role: UserRole
  createdAt: string
  updatedAt: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface SignupRequest extends LoginRequest {
  name: string
  age: number
  gender: 'male' | 'female' | 'other'
  height: number
  weight: number
  role?: UserRole
}

export interface AuthResponse {
  token: string
  user: User
}

// Signal Quality Metrics
export interface SignalQuality {
  score: number // 0-100
  status: 'GOOD' | 'MODERATE' | 'POOR'
  factors: {
    noise: 'low' | 'moderate' | 'high'
    baseline: 'stable' | 'drift' | 'unstable'
    saturation: 'none' | 'partial' | 'full'
  }
}

// Heart Rate Metrics
export interface HeartRate {
  average: number
  min: number
  max: number
  variability: 'low' | 'moderate' | 'high'
}

// AI Prediction
export interface AIPrediction {
  class: 'Normal' | 'Bradycardia' | 'Tachycardia' | 'Irregular Rhythm' | 'Other'
  confidence: number // 0-1
  classDistribution: {
    Normal: number
    Bradycardia: number
    Tachycardia: number
    'Irregular Rhythm': number
    Other: number
  }
}

// Model Focus Region (XAI)
export interface FocusArea {
  startTime: number // in seconds
  endTime: number // in seconds
  description: string
}

// Doctor Review
export interface DoctorReview {
  id: string
  analysisId: string
  doctorId: string
  doctorName: string
  assessment: 'CONFIRMED' | 'NEEDS_FURTHER_REVIEW' | 'NOT_RELIABLE'
  notes: string
  reviewedAt: string
}

// Analysis Record
export interface Analysis {
  id: string
  userId: string
  patientName?: string
  patientAge?: number
  patientGender?: string
  patientId?: string
  clinicalNotes?: string
  fileType: 'ECG' | 'PPG'
  fileName: string
  uploadedAt: string
  signalQuality: SignalQuality
  heartRate: HeartRate
  aiPrediction: AIPrediction
  anomalyScore: number // 0-1
  focusArea: FocusArea
  rawSignal: number[] // Waveform values
  processingTime: number // in seconds
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED'
  review?: DoctorReview
}

// System Alerts
export interface SmartAlert {
  id: string
  analysisId: string
  userId: string
  patientName: string
  type: 'LOW_CONFIDENCE' | 'POOR_QUALITY' | 'ABNORMAL_PATTERN'
  message: string
  severity: 'high' | 'medium' | 'low'
  createdAt: string
  isDismissed: boolean
}

// Generic API Response
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  timestamp: string
}
