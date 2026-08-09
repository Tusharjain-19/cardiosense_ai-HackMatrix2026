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

  useEffect(() => {
    setLogoUrl(renderLogoToCanvas())
    if (analysis.rawSignal) {
      setGraphUrl(renderECGGraphCanvas(analysis.rawSignal, analysis.xaiFocusArea))
    }
  }, [analysis])

  const confColor = analysis.aiPrediction.confidence >= 0.85 ? 'text-emerald-700' : 
                    analysis.aiPrediction.confidence >= 0.70 ? 'text-amber-600' : 'text-red-600'

  return (
    <div 
      id="pdf-report-template" 
      className="bg-white text-slate-900 mx-auto" 
      style={{ width: '210mm', minHeight: '297mm', padding: '0', position: 'relative', fontFamily: 'sans-serif' }}
    >
      {/* HEADER PAGE 1 */}
      <div className="bg-[#0F2942] w-full px-8 py-6 text-white flex items-center gap-6" style={{ borderBottom: '6px solid #0D9488' }}>
        {logoUrl && <img src={logoUrl} alt="Logo" className="w-16 h-16" />}
        <div>
          <h1 className="text-3xl font-black tracking-wider text-white m-0 leading-tight">{t.reportTitle}</h1>
          <p className="text-teal-200 text-sm font-bold m-0 uppercase tracking-widest mt-1">{t.subTitle}</p>
        </div>
      </div>

      <div className="px-10 py-8 space-y-8">
        
        {/* Section 1: Patient */}
        <section>
          <h2 className="text-lg font-bold text-[#0F2942] border-b-2 border-slate-200 pb-2 mb-4 uppercase">{t.patientSection}</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><span className="font-semibold text-slate-500 mr-2">{t.patientName}</span> <span className="font-bold">{analysis.patientName || 'Anonymous'}</span></p>
              <p><span className="font-semibold text-slate-500 mr-2">{t.ageGender}</span> <span className="font-bold">{analysis.patientAge || 30} yrs / {analysis.patientGender || 'Other'}</span></p>
            </div>
            <div>
              <p><span className="font-semibold text-slate-500 mr-2">{t.fileName}</span> <span className="font-bold">{analysis.fileName}</span></p>
              <p><span className="font-semibold text-slate-500 mr-2">{t.fileType}</span> <span className="font-bold">{analysis.fileType}</span></p>
              <p><span className="font-semibold text-slate-500 mr-2">{t.processedAt}</span> <span className="font-bold">{format(new Date(analysis.uploadedAt), 'PPpp')}</span></p>
            </div>
          </div>
        </section>

        {/* Section 2: Metrics */}
        <section>
          <h2 className="text-lg font-bold text-[#0F2942] border-b-2 border-slate-200 pb-2 mb-4 uppercase">{t.metricsSection}</h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-3 text-sm">
            <div className="flex justify-between border-b border-slate-100 pb-1">
              <span className="font-semibold text-slate-500">{t.qualityScore}</span> 
              <span className="font-bold">{analysis.signalQuality.score}% ({analysis.signalQuality.status})</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-1">
              <span className="font-semibold text-slate-500">{t.noiseLevel}</span> 
              <span className="font-bold">{analysis.signalQuality.noiseLevel}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-1">
              <span className="font-semibold text-slate-500">{t.baselineStability}</span> 
              <span className="font-bold">{analysis.signalQuality.baselineStability}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-1">
              <span className="font-semibold text-slate-500">{t.heartRateAvg}</span> 
              <span className="font-bold">{analysis.cardiacMetrics.heartRate} BPM</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-1">
              <span className="font-semibold text-slate-500">{t.hrRange}</span> 
              <span className="font-bold">{analysis.cardiacMetrics.hrMin} - {analysis.cardiacMetrics.hrMax} BPM</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-1">
              <span className="font-semibold text-slate-500">{t.hrVariability}</span> 
              <span className="font-bold">{analysis.cardiacMetrics.hrv} ms</span>
            </div>
          </div>
        </section>

        {/* Section 3: AI Prediction */}
        <section>
          <h2 className="text-lg font-bold text-[#0F2942] border-b-2 border-slate-200 pb-2 mb-4 uppercase">{t.aiSection}</h2>
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <div className="mb-4">
              <span className="text-slate-500 font-bold uppercase text-xs block mb-1">{t.classificationLabel}</span>
              <span className="text-2xl font-black text-[#0F2942]">{analysis.aiPrediction.class.toUpperCase()}</span>
            </div>
            <div className="mb-6">
              <span className="text-slate-500 font-bold uppercase text-xs block mb-1">{t.confidenceLabel}</span>
              <span className={`text-xl font-bold ${confColor}`}>{(analysis.aiPrediction.confidence * 100).toFixed(1)}%</span>
            </div>
            
            <div>
              <span className="text-slate-500 font-bold uppercase text-xs block mb-3">{t.probabilityTitle}</span>
              <div className="space-y-3">
                {Object.entries(analysis.aiPrediction.probabilities).map(([className, prob]) => {
                  const percent = (prob as number * 100).toFixed(1)
                  return (
                    <div key={className} className="flex items-center gap-4">
                      <span className="w-48 text-sm font-semibold truncate">{className}</span>
                      <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-600 rounded-full" style={{ width: `${percent}%` }} />
                      </div>
                      <span className="w-16 text-right text-sm font-bold">{percent}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Graph */}
        <section>
          <h2 className="text-lg font-bold text-[#0F2942] border-b-2 border-slate-200 pb-2 mb-4 uppercase">{t.graphSection}</h2>
          {graphUrl && (
            <div className="w-full border-2 border-slate-200 rounded-lg overflow-hidden">
              <img src={graphUrl} alt="ECG Graph" className="w-full h-auto" />
            </div>
          )}
        </section>
      </div>

      <div style={{ pageBreakBefore: 'always' }} />

      {/* HEADER PAGE 2 */}
      <div className="bg-[#0F2942] w-full px-8 py-4 text-white flex items-center justify-between" style={{ borderBottom: '4px solid #0D9488' }}>
        <p className="font-bold text-sm">{t.reportTitle} - {t.subTitle}</p>
        <p className="text-teal-200 text-sm font-semibold">Page 2</p>
      </div>

      <div className="px-10 py-8 space-y-8">
        
        {/* Section 5: XAI */}
        <section>
          <h2 className="text-lg font-bold text-[#0F2942] border-b-2 border-slate-200 pb-2 mb-4 uppercase">{t.explainableSection}</h2>
          <div className="bg-amber-50/50 p-4 border-l-4 border-amber-500 rounded-r-lg">
            <p className="text-sm mb-2"><span className="font-bold text-slate-700">{t.focusSegment}</span> <span className="font-semibold">{analysis.xaiFocusArea?.startTime}s - {analysis.xaiFocusArea?.endTime}s</span></p>
            <p className="text-sm"><span className="font-bold text-slate-700">{t.focusDescription}</span> <span className="text-slate-600 font-medium">{analysis.xaiFocusArea?.description}</span></p>
          </div>
        </section>

        {/* Section 6: Risk */}
        <section>
          <h2 className="text-lg font-bold text-[#0F2942] border-b-2 border-slate-200 pb-2 mb-4 uppercase">{t.riskSection}</h2>
          <div className="flex items-center gap-4">
            <span className="font-bold text-slate-700 uppercase">{t.riskLevel}</span>
            <span className={`px-4 py-1.5 rounded-full text-sm font-black text-white ${
              analysis.aiPrediction.class === 'Normal' ? 'bg-emerald-600' : 'bg-red-600'
            }`}>
              {analysis.aiPrediction.class === 'Normal' ? 'LOW RISK' : 'HIGH RISK / ABNORMAL'}
            </span>
          </div>
        </section>

        {/* Section 7: Doctor Review */}
        <section>
          <h2 className="text-lg font-bold text-[#0F2942] border-b-2 border-slate-200 pb-2 mb-4 uppercase">{t.doctorSection}</h2>
          <div className="space-y-4 text-sm bg-slate-50 p-5 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <span className="font-bold w-48">{t.reviewedBy}</span>
              <span className="text-slate-500">__________________________________________</span>
            </div>
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <span className="font-bold w-48">{t.clinicalAssessment}</span>
              <span className="text-slate-500">__________________________________________</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold w-48 shrink-0">{t.clinicalNotes}</span>
              <div className="flex-1 h-20 border-b border-slate-200 border-dashed" />
            </div>
          </div>
        </section>

        {/* Section 8: Recommendations */}
        <section>
          <h2 className="text-lg font-bold text-[#0F2942] border-b-2 border-slate-200 pb-2 mb-4 uppercase">{t.recommendationsSection}</h2>
          <div className="space-y-3 text-sm text-slate-700 font-medium leading-relaxed bg-blue-50/50 p-5 rounded-lg border border-blue-100">
            {analysis.aiPrediction.class === 'Normal' ? (
              <>
                <p>{t.recNormalItem1}</p>
                <p>{t.recNormalItem2}</p>
                <p>{t.recNormalItem3}</p>
              </>
            ) : (
              <>
                <p className="text-red-700 font-semibold">{t.recAbnormalItem1}</p>
                <p>{t.recAbnormalItem2}</p>
                <p className="text-red-700 font-bold">{t.recAbnormalItem3}</p>
                <p>{t.recAbnormalItem4}</p>
              </>
            )}
          </div>
        </section>

        {/* Disclaimer */}
        <div className="mt-12 pt-6 border-t-2 border-slate-200 text-center">
          <p className="text-xs font-black text-slate-500 uppercase mb-1">{t.disclaimerTitle}</p>
          <p className="text-[10px] text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">{t.disclaimerBody}</p>
        </div>
      </div>
    </div>
  )
}
