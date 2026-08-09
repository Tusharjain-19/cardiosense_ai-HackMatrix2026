'use client'

import React from 'react'
import Link from 'next/link'
import { ShieldCheck, ArrowLeft, Lock, Database, Eye, FileText } from 'lucide-react'

export default function PrivacyPolicyPage() {
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
      <div className="card p-8 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border-0 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-3 mb-3">
          <span className="p-2.5 bg-teal-500/20 text-teal-300 rounded-xl border border-teal-500/30">
            <ShieldCheck className="w-6 h-6" />
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-300">
            Legal & Data Protection
          </span>
        </div>

        <h1 className="text-3xl font-black tracking-tight text-white mb-2">
          Privacy Policy
        </h1>
        <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
          How Cardiosense AI protects your health records, electrophysiological signals, and personal data.
        </p>
        <p className="text-xs text-slate-400 mt-4">
          Last Updated: August 2026 | Effective for Version 1.0 Platform
        </p>
      </div>

      {/* Main Content Sections */}
      <div className="card p-8 bg-white space-y-8 text-slate-700 text-sm leading-relaxed border border-slate-200">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <Lock className="w-5 h-5 text-teal-600" /> 1. Commitment to Health Data Privacy
          </h2>
          <p>
            At <strong>Cardiosense AI</strong>, we prioritize the protection and security of your personal health data and electrophysiological recordings (ECG and PPG). This Privacy Policy explains what information we process, how it is stored, and the strict safeguards in place to ensure confidentiality.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <Database className="w-5 h-5 text-teal-600" /> 2. Information We Process
          </h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Account & Profile Data:</strong> Name, email address, age, gender, height, weight, and user role (Patient, Doctor, Admin).
            </li>
            <li>
              <strong>Signal Waveform Files:</strong> Uploaded CSV, TXT, or EDF recordings containing raw voltage or optical sensor time-series data.
            </li>
            <li>
              <strong>Derived AI Metrics:</strong> Heart rate (BPM), signal quality scores, classification probabilities, anomaly scores, and Explainable AI (XAI) saliency focus windows.
            </li>
            <li>
              <strong>Clinical Assessment Notes:</strong> Validation status and clinical notes entered by reviewing healthcare professionals.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <Eye className="w-5 h-5 text-teal-600" /> 3. Local Storage & Zero Third-Party Sale
          </h2>
          <p>
            Cardiosense AI operates under a strict privacy model:
          </p>
          <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl space-y-2 text-xs font-medium text-teal-950">
            <p>✔ <strong>Local Browser Storage:</strong> For standalone demonstrations, user sessions and settings are saved locally inside your browser storage (`localStorage`).</p>
            <p>✔ <strong>Zero Data Monetization:</strong> We never sell, rent, or trade your medical data, raw signals, or personal identification to third parties or advertising networks.</p>
            <p>✔ <strong>Anonymized Signal Processing:</strong> Waveforms sent for deep learning inference are stripped of identifying metadata prior to model evaluation.</p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <FileText className="w-5 h-5 text-teal-600" /> 4. Your Data Control Rights
          </h2>
          <p>
            You retain complete ownership of your cardiac records:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li><strong>Access & Export:</strong> You can download your full screening history as formatted multi-language PDF reports at any time.</li>
            <li><strong>Deletion:</strong> You can delete any individual analysis or clear your local session data through the Platform Settings.</li>
          </ul>
        </section>

        <section className="pt-4 border-t border-slate-200 text-xs text-slate-500">
          <p>If you have questions regarding this Privacy Policy or data security practices, contact us at <a href="mailto:privacy@cardiosense.ai" className="text-blue-600 underline">privacy@cardiosense.ai</a> or visit our <a href="https://github.com/Tusharjain-19/cardiosense_ai" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">GitHub Repository</a>.</p>
        </section>
      </div>
    </div>
  )
}
