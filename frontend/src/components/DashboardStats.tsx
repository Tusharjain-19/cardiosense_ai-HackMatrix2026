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
      borderColor: 'border-blue-200',
      bgColor: 'bg-blue-50/70',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Normal',
      count: normalCount,
      subtext: 'Normal sinus rhythm',
      icon: CheckCircle,
      borderColor: 'border-emerald-200',
      bgColor: 'bg-emerald-50/70',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'Needs Review',
      count: reviewCount,
      subtext: 'Flagged or low confidence',
      icon: AlertTriangle,
      borderColor: 'border-amber-200',
      bgColor: 'bg-amber-50/70',
      iconColor: 'text-amber-600',
    },
    {
      title: 'Poor Quality',
      count: poorQualityCount,
      subtext: 'High noise or artifact',
      icon: XCircle,
      borderColor: 'border-red-200',
      bgColor: 'bg-red-50/70',
      iconColor: 'text-red-600',
    },
  ]

  return (
    <div className="space-y-6">
      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => {
          const Icon = c.icon
          return (
            <div
              key={c.title}
              className={`card border ${c.borderColor} ${c.bgColor} transition-all hover:shadow-md`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {c.title}
                </span>
                <span className={`p-2 rounded-lg bg-white shadow-sm ${c.iconColor}`}>
                  <Icon className="w-5 h-5" />
                </span>
              </div>
              <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {c.count}
              </p>
              <p className="text-xs text-slate-500 mt-1">{c.subtext}</p>
            </div>
          )
        })}
      </div>

      {/* Latest Analysis Banner */}
      {latestAnalysis && (
        <div className="card bg-gradient-to-r from-white to-blue-50 text-slate-900 border border-blue-100 shadow-lg overflow-hidden relative">
          <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-blue-100 text-blue-700 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-blue-200">
                  Latest Recording
                </span>
                <span className="text-xs text-slate-500">
                  {new Date(latestAnalysis.uploadedAt).toLocaleString()}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">
                {latestAnalysis.fileName} ({latestAnalysis.fileType})
              </h2>
              <p className="text-xs text-slate-600">
                AI Classification: <strong className="text-blue-600 font-semibold">{latestAnalysis.aiPrediction.class}</strong> ({ (latestAnalysis.aiPrediction.confidence * 100).toFixed(1) }% confidence)
              </p>
            </div>

            <div className="grid grid-cols-3 gap-6 bg-white/80 p-4 rounded-xl border border-slate-200/60 backdrop-blur shadow-sm">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Heart Rate</span>
                <span className="text-lg font-bold text-emerald-600 flex items-center gap-1">
                  <Heart className="w-4 h-4 fill-emerald-600/20" />
                  {latestAnalysis.heartRate.average} <span className="text-xs text-slate-500 font-normal">BPM</span>
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Quality</span>
                <span className={`text-sm font-bold ${
                  latestAnalysis.signalQuality.status === 'GOOD'
                    ? 'text-emerald-600'
                    : latestAnalysis.signalQuality.status === 'MODERATE'
                    ? 'text-amber-600'
                    : 'text-red-600'
                }`}>
                  {latestAnalysis.signalQuality.score}% ({latestAnalysis.signalQuality.status})
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Anomaly</span>
                <span className="text-sm font-bold text-blue-600">
                  {(latestAnalysis.anomalyScore * 100).toFixed(0)}/100
                </span>
              </div>
            </div>

            <Link
              href={`/analysis/${latestAnalysis.id}`}
              className="btn-primary bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-4 py-2.5 shadow-md"
            >
              View Full Waveform & XAI <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
