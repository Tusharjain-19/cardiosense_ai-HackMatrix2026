import React from 'react'
import Link from 'next/link'
import { ShieldAlert, ArrowLeft, Lock, Server, Cpu, CheckCircle2 } from 'lucide-react'

export default function HipaaSecurityPage() {
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
            <ShieldAlert className="w-6 h-6" />
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
            Cybersecurity & Compliance
          </span>
        </div>

        <h1 className="text-3xl font-black tracking-tight text-white mb-2">
          Data Security & HIPAA Compliance
        </h1>
        <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
          Technical safeguards, encryption standards, and de-identification procedures protecting physiological waveform data.
        </p>
        <p className="text-xs text-slate-400 mt-4">
          Last Updated: August 2026 | Platform Security Standard
        </p>
      </div>

      {/* Main Content Sections */}
      <div className="card p-8 bg-white space-y-8 text-slate-700 text-sm leading-relaxed border border-slate-200">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <Lock className="w-5 h-5 text-blue-600" /> 1. Encryption Standards
          </h2>
          <p>
            Cardiosense AI enforces modern cryptographic protocols across data in transit and at rest:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <strong className="text-xs font-bold text-slate-900 block mb-1">In-Transit Encryption</strong>
              <p className="text-xs text-slate-600">TLS 1.3 encryption enforced for all client-to-backend REST communication and signal uploads.</p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <strong className="text-xs font-bold text-slate-900 block mb-1">At-Rest Storage Encryption</strong>
              <p className="text-xs text-slate-600">AES-256 bit database encryption for stored patient recordings, analysis history, and metadata.</p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <Cpu className="w-5 h-5 text-blue-600" /> 2. PHI De-Identification & Anonymization
          </h2>
          <p>
            Under HIPAA Safe Harbor guidelines (45 CFR § 164.514), all electrophysiological waveform processing removes direct Protected Health Information (PHI) prior to deep learning model inference:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li>Raw time-series arrays are evaluated strictly by numeric indices.</li>
            <li>Patient identifiers are stored separately with strict role-based access control (RBAC).</li>
            <li>Doctor review notes are bound strictly to authorized doctor user accounts.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <Server className="w-5 h-5 text-blue-600" /> 3. Access Control & Audit Trails
          </h2>
          <p>
            Role-Based Access Control (RBAC) ensures Patients access only their personal recordings, while Doctors access assigned patient cohorts. All data modifications write structured audit timestamps.
          </p>
        </section>

        <section className="pt-4 border-t border-slate-200 text-xs text-slate-500">
          <p>Security questions or compliance inquiries? Contact our Security Team at <a href="mailto:security@cardiosense.ai" className="text-blue-600 underline">security@cardiosense.ai</a>.</p>
        </section>
      </div>
    </div>
  )
}
