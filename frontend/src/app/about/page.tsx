'use client'

import React from 'react'
import Link from 'next/link'
import { Activity, ArrowLeft, Cpu, ShieldCheck, FileText, Zap, Heart, Github } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="container-main max-w-4xl py-10 space-y-8">
      {/* Navigation link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      {/* Header */}
      <div className="card p-8 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white border-0 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-3 mb-3">
          <span className="p-2.5 bg-blue-500/20 text-blue-300 rounded-xl border border-blue-500/30">
            <Activity className="w-6 h-6" />
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
            Platform Vision & Technology
          </span>
        </div>

        <h1 className="text-3xl font-black tracking-tight text-white mb-2">
          About Cardiosense AI
        </h1>
        <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
          Democratizing electrophysiological & optical cardiac screening through deep learning 1D Convolutional Neural Networks and Explainable AI (XAI) overlays.
        </p>

        <div className="pt-4 flex items-center gap-3">
          <a
            href="https://github.com/Tusharjain-19/cardiosense_ai"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded-xl flex items-center gap-2"
          >
            <Github className="w-4 h-4" /> View Open Source on GitHub
          </a>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="card p-8 bg-white space-y-8 text-slate-700 text-sm leading-relaxed border border-slate-200">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <Heart className="w-5 h-5 text-blue-600" /> 1. Project Mission
          </h2>
          <p>
            Cardiovascular diseases remain the leading cause of global mortality. Early detection through continuous screening of electrophysiological (ECG) and optical (PPG) signals can save lives. <strong>Cardiosense AI</strong> was designed to bridge the gap between complex raw waveform recordings and actionable, explainable clinical insights.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <Cpu className="w-5 h-5 text-blue-600" /> 2. Deep Learning 1D-CNN Architecture
          </h2>
          <p>
            Our PyTorch neural network processes preprocessed 3,600-sample windows (10 seconds @ 360 Hz) through a 3-block 1D Convolutional architecture:
          </p>
          <div className="p-4 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs space-y-1">
            <p className="text-blue-400 font-bold">Input: Waveform Tensor (batch, 1, 3600)</p>
            <p>├── Conv1D(1 → 64, k=5)   → BatchNorm → ReLU → MaxPool1D(2)</p>
            <p>├── Conv1D(64 → 128, k=5) → BatchNorm → ReLU → MaxPool1D(2)</p>
            <p>├── Conv1D(128 → 256, k=5)→ BatchNorm → ReLU → MaxPool1D(2)</p>
            <p>├── GlobalAveragePooling1D()</p>
            <p>├── Dense(256 → 128) → ReLU → Dropout(0.5)</p>
            <p className="text-emerald-400 font-bold">└── Dense(128 → 5) → Softmax Classification</p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <Zap className="w-5 h-5 text-blue-600" /> 3. Explainable AI (XAI) Saliency Maps
          </h2>
          <p>
            Rather than serving as a opaque "black box", Cardiosense AI applies gradient backpropagation with 1D Gaussian filter smoothing to isolate the exact temporal windows (e.g. QRS complex or T-wave inversion) that drove the classification result.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <FileText className="w-5 h-5 text-blue-600" /> 4. Multi-Language PDF Generation
          </h2>
          <p>
            To serve diverse patient populations, screening reports are rendered natively into 7 regional languages (English, Hindi, Tamil, Telugu, Gujarati, Marathi, Bengali) using a specialized HTML-to-Canvas PDF engine.
          </p>
        </section>
      </div>
    </div>
  )
}
