import React from 'react'
import Link from 'next/link'
import { ShieldCheck, ArrowLeft, Lock, Database, Eye, FileText, CheckCircle2, ShieldAlert, Key } from 'lucide-react'

export default function PrivacyPolicyPage() {
  return (
    <div className="container-main max-w-4xl py-10 space-y-8">
      {/* Navigation link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00605b] hover:text-[#147a74] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#e7eeff] via-[#f0f3ff] to-[#dee8ff] text-[#111c2c] p-8 md:p-10 shadow-lg border border-[#bdc9c7]">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-64 h-64 bg-[#00605b]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-3 mb-3">
          <span className="p-2.5 bg-[#b6ebd8] text-[#3a6c5d] rounded-2xl border border-[#9dd1bf]">
            <ShieldCheck className="w-6 h-6" />
          </span>
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#00605b]">
            Clinical Softness — Privacy & Compliance Standard
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#00605b] mb-2 font-['Plus_Jakarta_Sans']">
          Privacy Policy
        </h1>
        <p className="text-[#3e4947] text-sm sm:text-base max-w-2xl leading-relaxed font-medium">
          How Cardiosense AI protects your health records, electrophysiological signals (ECG/PPG), and personal data with enterprise-grade encryption and zero third-party monetization.
        </p>
        <p className="text-xs font-bold text-[#00605b] mt-4">
          Last Updated: August 2026 | Effective for Platform Version 1.0
        </p>
      </div>

      {/* Main Content Card */}
      <div className="card p-8 bg-white space-y-8 text-[#111c2c] text-sm leading-relaxed border border-[#e7eeff] shadow-md rounded-3xl">
        
        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[#00605b] flex items-center gap-2 border-b border-[#e7eeff] pb-3 font-['Plus_Jakarta_Sans']">
            <Lock className="w-5 h-5 text-[#00605b]" /> 1. Commitment to Health Data Confidentiality
          </h2>
          <p className="text-[#3e4947] font-medium leading-relaxed">
            At <strong>Cardiosense AI</strong>, we prioritize the protection and security of your personal health data and electrophysiological recordings (ECG and PPG). This Privacy Policy explains what information we process, how it is stored, and the strict safeguards in place to ensure confidentiality.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[#00605b] flex items-center gap-2 border-b border-[#e7eeff] pb-3 font-['Plus_Jakarta_Sans']">
            <Database className="w-5 h-5 text-[#00605b]" /> 2. Information We Process
          </h2>
          <p className="text-[#3e4947] font-medium">To deliver clinical screening insights, Cardiosense AI processes:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-5 bg-[#f0f3ff] rounded-2xl border border-[#dee8ff] space-y-1">
              <strong className="text-xs font-bold text-[#00605b] block">Profile Metadata</strong>
              <p className="text-xs text-[#3e4947]">Name, email address, age, gender, height, weight, and assigned role (Patient, Doctor, Admin).</p>
            </div>
            <div className="p-5 bg-[#f0f3ff] rounded-2xl border border-[#dee8ff] space-y-1">
              <strong className="text-xs font-bold text-[#00605b] block">Signal Waveform Files</strong>
              <p className="text-xs text-[#3e4947]">Uploaded CSV, TXT, or EDF recordings containing raw time-series voltage or optical sensor data.</p>
            </div>
            <div className="p-5 bg-[#f0f3ff] rounded-2xl border border-[#dee8ff] space-y-1">
              <strong className="text-xs font-bold text-[#00605b] block">AI Screening Vitals</strong>
              <p className="text-xs text-[#3e4947]">Heart rate (BPM), signal quality scores, 1D-CNN classification probabilities, and XAI attention windows.</p>
            </div>
            <div className="p-5 bg-[#f0f3ff] rounded-2xl border border-[#dee8ff] space-y-1">
              <strong className="text-xs font-bold text-[#00605b] block">Clinical Notes</strong>
              <p className="text-xs text-[#3e4947]">Validation status, doctor review notes, and clinical triage assessments added by reviewing physicians.</p>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[#00605b] flex items-center gap-2 border-b border-[#e7eeff] pb-3 font-['Plus_Jakarta_Sans']">
            <Eye className="w-5 h-5 text-[#00605b]" /> 3. Local Browser Storage & Zero Data Monetization
          </h2>
          <div className="p-5 bg-[#b6ebd8]/30 border border-[#9dd1bf] rounded-2xl space-y-2 text-xs font-bold text-[#3a6c5d]">
            <p className="flex items-center gap-2">✔ <strong>Local Storage Privacy:</strong> User sessions and screening settings are cached locally in your browser (`localStorage`).</p>
            <p className="flex items-center gap-2">✔ <strong>Zero Third-Party Selling:</strong> We never sell, rent, trade, or share your medical data or signals with ad networks or third parties.</p>
            <p className="flex items-center gap-2">✔ <strong>De-Identified Neural Inference:</strong> Signal arrays sent for deep learning evaluation are stripped of personal identifiers prior to inference.</p>
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[#00605b] flex items-center gap-2 border-b border-[#e7eeff] pb-3 font-['Plus_Jakarta_Sans']">
            <FileText className="w-5 h-5 text-[#00605b]" /> 4. Your User Data & Export Rights
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-xs text-[#3e4947] font-medium">
            <li><strong>Export Data:</strong> You can download complete multi-language PDF clinical reports for any session at any time.</li>
            <li><strong>Delete Records:</strong> You can delete any individual signal analysis or clear your cached session data through Platform Settings.</li>
            <li><strong>Role Switcher Privacy:</strong> Switching between Patient and Doctor roles maintains localized access controls without exposing patient records across accounts.</li>
          </ul>
        </section>

        {/* Footer info */}
        <section className="pt-4 border-t border-[#e7eeff] text-xs text-[#3e4947] flex flex-col sm:flex-row items-center justify-between gap-4 font-medium">
          <p>Questions? Contact our Privacy Officer at <a href="mailto:privacy@cardiosense.ai" className="text-[#00605b] font-bold underline">privacy@cardiosense.ai</a>.</p>
          <a
            href="https://github.com/Tusharjain-19/cardiosense_ai"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-xs px-4 py-2"
          >
            View GitHub Repository
          </a>
        </section>
      </div>
    </div>
  )
}
