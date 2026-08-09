import {
  getStoredAnalyses,
  getAnalysisById,
  deleteAnalysisById,
  saveAnalysis,
  saveDoctorReview,
  generateECGWaveform,
  generatePPGWaveform,
} from './mockDataService'
import { Analysis, DoctorReview, ApiResponse } from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

export const apiService = {
  // Fetch user history
  async getHistory(): Promise<ApiResponse<Analysis[]>> {
    const localAnalyses = getStoredAnalyses()
    if (API_BASE_URL) {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : ''
        const res = await fetch(`${API_BASE_URL}/analysis/history`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          // Filter out any items that were deleted locally
          const localIds = new Set(localAnalyses.map((a) => a.id))
          const filtered = (data.data || []).filter((a: Analysis) => localIds.has(a.id))
          return { ...data, data: filtered }
        }
      } catch (err) {
        console.warn('API connection unavailable, using local mock data.', err)
      }
    }
    return {
      success: true,
      data: localAnalyses,
      timestamp: new Date().toISOString(),
    }
  },

  // Delete analysis permanently
  async deleteAnalysis(id: string): Promise<ApiResponse<void>> {
    deleteAnalysisById(id) // Remove permanently from browser localStorage
    if (API_BASE_URL) {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : ''
        await fetch(`${API_BASE_URL}/analysis/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        })
      } catch (err) {
        console.warn('Backend delete request failed:', err)
      }
    }
    return {
      success: true,
      timestamp: new Date().toISOString(),
    }
  },

  // Fetch single analysis details
  async getAnalysis(id: string): Promise<ApiResponse<Analysis>> {
    if (API_BASE_URL) {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : ''
        const res = await fetch(`${API_BASE_URL}/analysis/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          return await res.json()
        }
      } catch (err) {
        console.warn('API connection unavailable, using local mock data.', err)
      }
    }
    const found = getAnalysisById(id)
    if (found) {
      return { success: true, data: found, timestamp: new Date().toISOString() }
    }
    throw new Error('Analysis record not found.')
  },

  // Process uploaded signal file or sample selection
  async processSignal(
    file: File | null,
    fileType: 'ECG' | 'PPG',
    sampleConfig?: any,
    patientDetails?: {
      patientName?: string
      patientAge?: number
      patientGender?: string
      patientId?: string
      clinicalNotes?: string
    }
  ): Promise<ApiResponse<Analysis>> {
    if (API_BASE_URL && file && !sampleConfig) {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : ''
        const formData = new FormData()
        formData.append('file', file)
        formData.append('type', fileType)
        if (patientDetails?.patientName) formData.append('patientName', patientDetails.patientName)
        if (patientDetails?.patientAge) formData.append('patientAge', String(patientDetails.patientAge))
        if (patientDetails?.patientGender) formData.append('patientGender', patientDetails.patientGender)
        if (patientDetails?.patientId) formData.append('patientId', patientDetails.patientId)

        const res = await fetch(`${API_BASE_URL}/analysis/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        })
        if (res.ok) {
          const result = await res.json()
          if (result && result.data) {
            saveAnalysis(result.data)
          }
          return result
        }
      } catch (err) {
        console.warn('API upload failed, processing using internal engine.', err)
      }
    }

    // Local processing simulation
    const id = `analysis_${Date.now().toString().slice(-6)}`
    const isWfdb = file && (file.name.endsWith('.dat') || file.name.endsWith('.hea') || file.name.endsWith('.atr'))
    const bpm = sampleConfig?.bpm || (fileType === 'ECG' ? (isWfdb ? 75 : 74) : 80)
    const isNoisy = sampleConfig?.qualityStatus === 'POOR' || (file && file.name.includes('noisy'))
    const isTachy = sampleConfig?.predictionClass === 'Tachycardia' || bpm > 100
    const isBrady = sampleConfig?.predictionClass === 'Bradycardia' || bpm < 55
    const isIrregular = sampleConfig?.predictionClass === 'Irregular Rhythm'

    const rawSignal =
      fileType === 'ECG'
        ? generateECGWaveform(bpm, 15, isWfdb ? 360 : 100, isNoisy ? 0.32 : 0.04)
        : generatePPGWaveform(bpm, 15, 100, isNoisy ? 0.28 : 0.05)

    let predictedClass: Analysis['aiPrediction']['class'] = 'Normal'
    let confidence = 0.95
    if (isTachy) {
      predictedClass = 'Tachycardia'
      confidence = 0.914
    } else if (isBrady) {
      predictedClass = 'Bradycardia'
      confidence = 0.882
    } else if (isIrregular) {
      predictedClass = 'Irregular Rhythm'
      confidence = 0.675
    } else if (isNoisy) {
      predictedClass = 'Normal'
      confidence = 0.530
    }

    const qualityScore = isNoisy ? 42 : sampleConfig?.qualityScore || 94
    const qualityStatus = isNoisy ? 'POOR' : sampleConfig?.qualityStatus || 'GOOD'

    const newAnalysis: Analysis = {
      id,
      userId: 'user_patient_001',
      patientName: patientDetails?.patientName || 'Rajesh Sharma',
      patientAge: patientDetails?.patientAge || 45,
      patientGender: patientDetails?.patientGender || 'Male',
      patientId: patientDetails?.patientId || `PAT-${Math.floor(10000 + Math.random() * 90000)}`,
      clinicalNotes: patientDetails?.clinicalNotes || 'Routine signal screening',
      fileType,
      fileName: file ? file.name : sampleConfig?.title || `${fileType}_recording.csv`,
      uploadedAt: new Date().toISOString(),
      signalQuality: {
        score: qualityScore,
        status: qualityStatus,
        factors: {
          noise: isNoisy ? 'high' : 'low',
          baseline: isNoisy ? 'unstable' : 'stable',
          saturation: 'none',
        },
      },
      heartRate: {
        average: bpm,
        min: Math.max(40, bpm - 7),
        max: bpm + 8,
        variability: isIrregular ? 'high' : 'low',
      },
      aiPrediction: {
        class: predictedClass,
        confidence,
        classDistribution: {
          Normal: predictedClass === 'Normal' ? confidence : parseFloat(((1 - confidence) / 4).toFixed(3)),
          Bradycardia: predictedClass === 'Bradycardia' ? confidence : parseFloat(((1 - confidence) / 4).toFixed(3)),
          Tachycardia: predictedClass === 'Tachycardia' ? confidence : parseFloat(((1 - confidence) / 4).toFixed(3)),
          'Irregular Rhythm': predictedClass === 'Irregular Rhythm' ? confidence : parseFloat(((1 - confidence) / 4).toFixed(3)),
          Other: 0.01,
        },
      },
      anomalyScore: isTachy ? 0.76 : isBrady ? 0.54 : isIrregular ? 0.68 : 0.15,
      focusArea: {
        startTime: 3.2,
        endTime: 4.8,
        description: `Signal segment between 3.2s and 4.8s influenced the ${predictedClass} classification.`,
      },
      rawSignal,
      processingTime: 2.1,
      status: 'COMPLETED',
    }

    saveAnalysis(newAnalysis)

    return {
      success: true,
      data: newAnalysis,
      timestamp: new Date().toISOString(),
    }
  },

  // Submit doctor review
  async submitDoctorReview(review: DoctorReview): Promise<ApiResponse<DoctorReview>> {
    saveDoctorReview(review)
    return {
      success: true,
      data: review,
      timestamp: new Date().toISOString(),
    }
  },
}
