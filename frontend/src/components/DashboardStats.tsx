'use client'

import React from 'react'
import { Analysis } from '@/types'
import { Activity, CheckCircle, AlertTriangle, XCircle, Heart, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface DashboardStatsProps {
  totalAnalyses: number
  normalCount: number
  reviewCount: number
  poorQualityCount: number
  latestAnalysis: Analysis | null
}

export default function DashboardStats({
  totalAnalyses,
  normalCount,
  reviewCount,
  poorQualityCount,
  latestAnalysis,
}: DashboardStatsProps) {
  const cards = [
    {
      title: 'Total Analyses',
      count: totalAnalyses,
      subtext: 'Completed recordings',
      icon: Activity,
      borderColor: 'border-blue-200 hover:border-blue-400',
      bgColor: 'bg-gradient-to-br from-white to-blue-50/60',
      iconColor: 'text-blue-600 bg-blue-100',
    },
    {
      title: 'Normal',
      count: normalCount,
      subtext: 'Normal sinus rhythm',
      icon: CheckCircle,
      borderColor: 'border-emerald-200 hover:border-emerald-400',
      bgColor: 'bg-gradient-to-br from-white to-emerald-50/60',
      iconColor: 'text-emerald-600 bg-emerald-100',
    },
    {
      title: 'Needs Review',
      count: reviewCount,
      subtext: 'Flagged or low confidence',
      icon: AlertTriangle,
      borderColor: 'border-amber-200 hover:border-amber-400',
      bgColor: 'bg-gradient-to-br from-white to-amber-50/60',
      iconColor: 'text-amber-600 bg-amber-100',
    },
    {
      title: 'Poor Quality',
      count: poorQualityCount,
      subtext: 'High noise or artifact',
      icon: XCircle,
      borderColor: 'border-red-200 hover:border-red-400',
      bgColor: 'bg-gradient-to-br from-white to-red-50/60',
      iconColor: 'text-red-600 bg-red-100',
    },
  ]

  return (
    <div className="space-y-6">
      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((c) => {
          const Icon = c.icon
          return (
            <div
              key={c.title}
              className={`card p-6 border ${c.borderColor} ${c.bgColor} transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  {c.title}
                </span>
                <span className={`p-2.5 rounded-xl shadow-sm ${c.iconColor}`}>
                  <Icon className="w-5 h-5" />
                </span>
              </div>
              <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {c.count}
              </p>
              <p className="text-xs text-slate-500 font-medium mt-1.5">{c.subtext}</p>
            </div>
          )
        })}
      </div>

      {/* Latest Analysis Banner */}
      {latestAnalysis && (
        <div className="card p-6 sm:p-8 bg-gradient-to-r from-white via-blue-50/30 to-indigo-50/50 text-slate-900 border border-blue-200/80 shadow-xl overflow-hidden relative">
          <div className="absolute -right-8 -bottom-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-bold border border-blue-200/80 shadow-sm">
                  Latest Recording
                </span>
                <span className="text-xs font-medium text-slate-500">
                  {new Date(latestAnalysis.uploadedAt).toLocaleString()}
                </span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {latestAnalysis.fileName} <span className="text-sm font-bold text-slate-500">({latestAnalysis.fileType})</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                AI Rhythm Classification: <strong className="text-blue-700 font-extrabold">{latestAnalysis.aiPrediction.class}</strong> ({(latestAnalysis.aiPrediction.confidence * 100).toFixed(1)}% confidence)
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
              <div className="grid grid-cols-3 gap-6 bg-white/90 p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm backdrop-blur">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Heart Rate</span>
                  <span className="text-xl font-extrabold text-emerald-600 flex items-center gap-1.5 mt-0.5">
                    <Heart className="w-4 h-4 fill-emerald-600/20" />
                    {latestAnalysis.heartRate.average} <span className="text-xs text-slate-500 font-normal">BPM</span>
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Quality</span>
                  <span className={`text-base font-extrabold mt-0.5 block ${
                    latestAnalysis.signalQuality.status === 'GOOD'
                      ? 'text-emerald-600'
                      : latestAnalysis.signalQuality.status === 'MODERATE'
                      ? 'text-amber-600'
                      : 'text-red-600'
                  }`}>
                    {latestAnalysis.signalQuality.score}% <span className="text-xs font-semibold">({latestAnalysis.signalQuality.status})</span>
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Anomaly</span>
                  <span className="text-base font-extrabold text-blue-600 mt-0.5 block">
                    {(latestAnalysis.anomalyScore * 100).toFixed(0)}/100
                  </span>
                </div>
              </div>

              <Link
                href={`/analysis/${latestAnalysis.id}`}
                className="btn-primary bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm px-5 py-3.5 rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 shrink-0"
              >
                View Full Waveform & XAI <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
