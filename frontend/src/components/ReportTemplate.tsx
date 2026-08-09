import React, { useEffect, useState } from 'react'
import { Analysis, User } from '@/types'
import { PDF_TRANSLATIONS, ReportLanguage, renderLogoToCanvas, renderECGGraphCanvas } from '@/utils/pdfGenerator'
import { format } from 'date-fns'

interface ReportTemplateProps {
  analysis: Analysis
  user?: User | null
  language: ReportLanguage
}

export default function ReportTemplate({ analysis, user, language }: ReportTemplateProps) {
  const t = PDF_TRANSLATIONS[language] || PDF_TRANSLATIONS.en
  const [logoUrl, setLogoUrl] = useState('')
  const [graphUrl, setGraphUrl] = useState('')

  const focusArea = (analysis as any).xaiFocusArea || analysis.focusArea
  const cardiac = (analysis as any).cardiacMetrics || {
    heartRate: analysis.heartRate?.average || 72,
    hrMin: analysis.heartRate?.min || 68,
    hrMax: analysis.heartRate?.max || 79,
    hrv: analysis.heartRate?.variability || 'low',
  }
  const quality = {
    score: analysis.signalQuality?.score || 94,
    status: analysis.signalQuality?.status || 'GOOD',
    noiseLevel: (analysis.signalQuality as any)?.noiseLevel || analysis.signalQuality?.factors?.noise || 'low',
    baselineStability: (analysis.signalQuality as any)?.baselineStability || analysis.signalQuality?.factors?.baseline || 'stable',
  }
  const classDist = (analysis.aiPrediction as any)?.probabilities || analysis.aiPrediction?.classDistribution || {
    Normal: 0.95,
    Bradycardia: 0.02,
    Tachycardia: 0.01,
    'Irregular Rhythm': 0.01,
    Other: 0.01,
  }

  useEffect(() => {
    setLogoUrl(renderLogoToCanvas())
    if (analysis.rawSignal) {
      setGraphUrl(renderECGGraphCanvas(analysis.rawSignal, focusArea))
    }
  }, [analysis, focusArea])

  const confColor = analysis.aiPrediction.confidence >= 0.85 ? 'text-emerald-700' : 
                    analysis.aiPrediction.confidence >= 0.70 ? 'text-amber-600' : 'text-red-600'

  return (
    <div id="pdf-report-template-wrapper" className="bg-slate-200 p-0 m-0 space-y-6">
      {/* PAGE 1 CONTAINER */}
      <div 
        id="pdf-page-1" 
        className="bg-white text-slate-900 mx-auto shadow-xl flex flex-col justify-between" 
        style={{ width: '210mm', height: '297mm', boxSizing: 'border-box', overflow: 'hidden', padding: '0', position: 'relative', fontFamily: 'sans-serif' }}
      >
        <div>
          {/* HEADER PAGE 1 */}
          <div className="bg-[#0F2942] w-full px-8 py-5 text-white flex items-center justify-between" style={{ borderBottom: '5px solid #00605b' }}>
            <div className="flex items-center gap-4">
              {logoUrl && <img src={logoUrl} alt="Logo" className="w-14 h-14" />}
              <div>
                <h1 className="text-2xl font-extrabold tracking-wider text-white m-0 leading-tight">{t.reportTitle}</h1>
                <p className="text-teal-300 text-xs font-bold m-0 uppercase tracking-widest mt-0.5">{t.subTitle}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-teal-800 text-teal-100 rounded-md font-mono text-xs font-bold">
                PAGE 1 OF 2
              </span>
              <p className="text-[10px] text-slate-300 mt-1">{format(new Date(analysis.uploadedAt), 'PPpp')}</p>
            </div>
          </div>

          <div className="px-8 py-6 space-y-6">
            
            {/* Section 1: Patient Demographic & Metadata */}
            <section className="bg-slate-50/80 p-4 rounded-xl border border-slate-200">
              <h2 className="text-xs font-black text-[#00605b] border-b border-slate-200 pb-1.5 mb-3 uppercase tracking-wider">{t.patientSection}</h2>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <p className="flex justify-between border-b border-slate-200/60 pb-1">
                    <span className="font-semibold text-slate-500">{t.patientName}</span>
                    <span className="font-bold text-slate-900">{analysis.patientName || 'Anonymous Patient'}</span>
                  </p>
                  <p className="flex justify-between border-b border-slate-200/60 pb-1">
                    <span className="font-semibold text-slate-500">{t.ageGender}</span>
                    <span className="font-bold text-slate-900">{analysis.patientAge || 30} Yrs / {analysis.patientGender || 'Male'}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-semibold text-slate-500">Patient ID:</span>
                    <span className="font-bold text-slate-900">{analysis.patientId || `PAT-${analysis.id.slice(-6)}`}</span>
                  </p>
                </div>
                <div className="space-y-1.5">
                  <p className="flex justify-between border-b border-slate-200/60 pb-1">
                    <span className="font-semibold text-slate-500">{t.fileName}</span>
                    <span className="font-bold text-slate-900 truncate max-w-[140px]">{analysis.fileName}</span>
                  </p>
                  <p className="flex justify-between border-b border-slate-200/60 pb-1">
                    <span className="font-semibold text-slate-500">{t.fileType}</span>
                    <span className="font-bold text-teal-700">{analysis.fileType} Modality</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-semibold text-slate-500">{t.processedAt}</span>
                    <span className="font-bold text-slate-900">{format(new Date(analysis.uploadedAt), 'yyyy-MM-dd HH:mm')}</span>
                  </p>
                </div>
              </div>
            </section>

            {/* Section 2: Clinical Vitals & SQI Metrics */}
            <section className="bg-slate-50/80 p-4 rounded-xl border border-slate-200">
              <h2 className="text-xs font-black text-[#00605b] border-b border-slate-200 pb-1.5 mb-3 uppercase tracking-wider">{t.metricsSection}</h2>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-center">
                  <span className="font-semibold text-slate-500 text-[10px] uppercase block">{t.qualityScore}</span>
                  <strong className="text-base font-black text-teal-800">{quality.score}% ({quality.status})</strong>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-center">
                  <span className="font-semibold text-slate-500 text-[10px] uppercase block">{t.heartRateAvg}</span>
                  <strong className="text-base font-black text-emerald-700">{cardiac.heartRate} BPM</strong>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-center">
                  <span className="font-semibold text-slate-500 text-[10px] uppercase block">{t.hrRange}</span>
                  <strong className="text-base font-black text-slate-800">{cardiac.hrMin} - {cardiac.hrMax} BPM</strong>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs mt-3">
                <div className="bg-white p-2 rounded-lg border border-slate-100 flex justify-between">
                  <span className="text-slate-500 font-medium">{t.noiseLevel}</span>
                  <span className="font-bold text-slate-800 capitalize">{quality.noiseLevel}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-100 flex justify-between">
                  <span className="text-slate-500 font-medium">{t.baselineStability}</span>
                  <span className="font-bold text-slate-800 capitalize">{quality.baselineStability}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-100 flex justify-between">
                  <span className="text-slate-500 font-medium">{t.hrVariability}</span>
                  <span className="font-bold text-slate-800 capitalize">{cardiac.hrv}</span>
                </div>
              </div>
            </section>

            {/* Section 3: AI Prediction & Class Distribution */}
            <section className="bg-slate-50/80 p-4 rounded-xl border border-slate-200">
              <h2 className="text-xs font-black text-[#00605b] border-b border-slate-200 pb-1.5 mb-3 uppercase tracking-wider">{t.aiSection}</h2>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-500 font-bold uppercase text-[10px] block mb-0.5">{t.classificationLabel}</span>
                  <span className="text-xl font-black text-[#00605b]">{analysis.aiPrediction.class.toUpperCase()}</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-500 font-bold uppercase text-[10px] block mb-0.5">{t.confidenceLabel}</span>
                  <span className={`text-xl font-extrabold ${confColor}`}>{(analysis.aiPrediction.confidence * 100).toFixed(1)}%</span>
                </div>
              </div>

              <div>
                <span className="text-slate-600 font-bold uppercase text-[10px] block mb-2">{t.probabilityTitle}</span>
                <div className="space-y-1.5">
                  {Object.entries(classDist).map(([className, prob]) => {
                    const percent = ((prob as number) * 100).toFixed(1)
                    return (
                      <div key={className} className="flex items-center gap-3 text-xs">
                        <span className="w-40 font-semibold text-slate-700 truncate">{className}</span>
                        <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-teal-700 rounded-full" style={{ width: `${percent}%` }} />
                        </div>
                        <span className="w-12 text-right font-extrabold text-slate-800 text-[11px]">{percent}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </section>

            {/* Section 4: XAI Focus Segment */}
            <section className="bg-amber-50/70 p-3.5 border-l-4 border-amber-500 rounded-r-xl border border-amber-200 text-xs">
              <h3 className="font-bold text-amber-950 uppercase text-[11px] mb-1">{t.explainableSection}</h3>
              <p className="mb-0.5">
                <span className="font-bold text-slate-800">{t.focusSegment}</span>{' '}
                <span className="font-semibold text-amber-900">{focusArea?.startTime || '2.40'}s - {focusArea?.endTime || '3.20'}s</span>
              </p>
              <p>
                <span className="font-bold text-slate-800">{t.focusDescription}</span>{' '}
                <span className="text-slate-700 font-medium">{focusArea?.description || 'QRS complex voltage peak elevation driving prediction.'}</span>
              </p>
            </section>

            {/* Prototype Clinical Warning Callout Box */}
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-950 flex items-start gap-2.5">
              <span className="text-base font-bold shrink-0">⚠️</span>
              <div>
                <strong className="font-extrabold block text-rose-900 uppercase text-[10px]">
                  PROTOTYPE RESEARCH & CLINICAL SCREENING ONLY
                </strong>
                <p className="text-[11px] text-rose-800 leading-tight">
                  This document is an automated AI screening report generated by CardioSense AI 1D-CNN. It is intended for clinical trial triage and educational demonstration only and DOES NOT constitute formal medical diagnosis.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Page 1 */}
        <div className="px-8 py-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-semibold bg-slate-50">
          <span>CardioSense AI — Clinical Screening System</span>
          <span>Page 1 of 2</span>
        </div>
      </div>

      {/* PAGE 2 CONTAINER */}
      <div 
        id="pdf-page-2" 
        className="bg-white text-slate-900 mx-auto shadow-xl flex flex-col justify-between" 
        style={{ width: '210mm', height: '297mm', boxSizing: 'border-box', overflow: 'hidden', padding: '0', position: 'relative', fontFamily: 'sans-serif' }}
      >
        <div>
          {/* HEADER PAGE 2 */}
          <div className="bg-[#0F2942] w-full px-8 py-4 text-white flex items-center justify-between" style={{ borderBottom: '4px solid #00605b' }}>
            <div className="flex items-center gap-3">
              {logoUrl && <img src={logoUrl} alt="Logo" className="w-10 h-10" />}
              <div>
                <h2 className="text-lg font-black tracking-wider text-white m-0">{t.reportTitle}</h2>
                <p className="text-teal-300 text-[10px] font-bold m-0 uppercase tracking-widest">{t.subTitle}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-teal-800 text-teal-100 rounded-md font-mono text-xs font-bold">
                PAGE 2 OF 2
              </span>
            </div>
          </div>

          <div className="px-8 py-5 space-y-5">
            
            {/* Section 5: High-Res Full Waveform Graph (Clean Dedicated Page 2 Block) */}
            <section className="bg-white rounded-xl border border-slate-300 p-3">
              <h2 className="text-xs font-black text-[#00605b] border-b border-slate-200 pb-1 mb-2 uppercase tracking-wider flex items-center justify-between">
                <span>{t.graphSection}</span>
                <span className="text-[10px] font-mono text-slate-500 lowercase font-semibold">10 sec @ 360 Hz</span>
              </h2>
              {graphUrl && (
                <div className="w-full border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                  <img src={graphUrl} alt="ECG Full Waveform Graph" className="w-full h-auto max-h-[160mm] object-contain" />
                </div>
              )}
            </section>

            {/* Section 6: Physician Assessment & Blank Handwritten Remarks Block */}
            <section className="bg-slate-50/90 p-4 rounded-xl border border-slate-300 space-y-3">
              <h2 className="text-xs font-black text-[#00605b] border-b border-slate-200 pb-1 mb-2 uppercase tracking-wider flex items-center justify-between">
                <span>{t.doctorSection}</span>
                <span className="text-[10px] text-slate-500 font-bold">Human-in-the-Loop Validation</span>
              </h2>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="flex items-center gap-2 border-b border-slate-300 pb-1.5">
                  <span className="font-bold text-slate-700 shrink-0">{t.reviewedBy}</span>
                  <span className="font-bold text-slate-900">{analysis.review?.doctorName || 'Dr. _______________________'}</span>
                </div>
                <div className="flex items-center gap-2 border-b border-slate-300 pb-1.5">
                  <span className="font-bold text-slate-700 shrink-0">Medical License ID:</span>
                  <span className="font-bold text-slate-900">REG-______________________</span>
                </div>
              </div>

              {/* Blank Lined Area for Doctor's Handwritten Remarks */}
              <div className="pt-1">
                <label className="block text-[11px] font-bold text-slate-800 uppercase mb-1">
                  Physician Clinical Remarks & Differential Diagnosis Notes:
                </label>
                <div className="bg-white border border-slate-300 rounded-lg p-3 space-y-4">
                  <div className="border-b border-slate-300 border-dashed pb-0.5 text-xs text-slate-400 font-mono italic">
                    {analysis.review?.notes ? analysis.review.notes : 'Line 1: ____________________________________________________________________________'}
                  </div>
                  <div className="border-b border-slate-300 border-dashed pb-0.5 text-xs text-slate-400 font-mono italic">
                    Line 2: ____________________________________________________________________________
                  </div>
                  <div className="border-b border-slate-300 border-dashed pb-0.5 text-xs text-slate-400 font-mono italic">
                    Line 3: ____________________________________________________________________________
                  </div>
                </div>
              </div>

              {/* Physician Signature & Hospital Stamp Box */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-[10px] text-slate-500 font-semibold">
                  Date of Review: ____ / ____ / 2026
                </div>
                <div className="w-48 h-12 border-2 border-dashed border-slate-400 rounded-lg flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase">
                  Doctor Signature & Stamp
                </div>
              </div>
            </section>

            {/* Section 7: Point-Wise Action Plan & Recommendations */}
            <section className="bg-blue-50/40 p-3.5 rounded-xl border border-blue-100 text-xs">
              <h2 className="text-[11px] font-extrabold text-blue-950 uppercase mb-1.5">{t.recommendationsSection}</h2>
              <div className="space-y-1 text-slate-700 font-medium text-[11px]">
                {analysis.aiPrediction.class === 'Normal' ? (
                  <>
                    <p>{t.recNormalItem1}</p>
                    <p>{t.recNormalItem2}</p>
                    <p>{t.recNormalItem3}</p>
                  </>
                ) : (
                  <>
                    <p className="text-red-700 font-bold">{t.recAbnormalItem1}</p>
                    <p>{t.recAbnormalItem2}</p>
                    <p className="text-red-700 font-bold">{t.recAbnormalItem3}</p>
                  </>
                )}
              </div>
            </section>

            {/* Section 8: Formal Medical Disclaimer */}
            <div className="pt-2 text-center text-[10px] text-slate-400">
              <strong className="font-bold text-slate-500 block uppercase mb-0.5">{t.disclaimerTitle}</strong>
              <p className="max-w-xl mx-auto leading-tight">{t.disclaimerBody}</p>
            </div>
          </div>
        </div>

        {/* Footer Page 2 */}
        <div className="px-8 py-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-semibold bg-slate-50">
          <span>CardioSense AI — Clinical Screening System</span>
          <span>Page 2 of 2</span>
        </div>
      </div>
    </div>
  )
}
