'use client'

import React from 'react'
import Link from 'next/link'
import { Cookie, ArrowLeft, Database, CheckCircle2, RefreshCw } from 'lucide-react'

export default function CookiePolicyPage() {
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
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-3 mb-3">
          <span className="p-2.5 bg-amber-500/20 text-amber-300 rounded-xl border border-amber-500/30">
            <Cookie className="w-6 h-6" />
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
            Storage & Tracking
          </span>
        </div>

        <h1 className="text-3xl font-black tracking-tight text-white mb-2">
          Cookie & Storage Policy
        </h1>
        <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
          How Cardiosense AI uses local browser storage and session cookies for application performance.
        </p>
        <p className="text-xs text-slate-400 mt-4">
          Last Updated: August 2026 | Effective for Version 1.0 Platform
        </p>
      </div>

      {/* Main Content Sections */}
      <div className="card p-8 bg-white space-y-8 text-slate-700 text-sm leading-relaxed border border-slate-200">
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <Database className="w-5 h-5 text-amber-600" /> 1. Browser Storage Utilization
          </h2>
          <p>
            Cardiosense AI uses HTML5 Local Storage (`localStorage`) and session tokens strictly to support core application functions:
          </p>
          <div className="space-y-3 pt-2">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <strong className="text-xs font-bold text-slate-900 block mb-1">Session Token (`token`)</strong>
              <p className="text-xs text-slate-600">Stores JWT authentication tokens to keep you logged in across page refreshes.</p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <strong className="text-xs font-bold text-slate-900 block mb-1">User Profile (`cardioai_user`)</strong>
              <p className="text-xs text-slate-600">Caches basic user profile state (Name, Role, Age, Gender) for instant UI rendering.</p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <strong className="text-xs font-bold text-slate-900 block mb-1">User Preferences (`cardiosense_user_settings`)</strong>
              <p className="text-xs text-slate-600">Saves your preferred language, noise filter mode, and audio notification settings.</p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <CheckCircle2 className="w-5 h-5 text-amber-600" /> 2. No Third-Party Tracking Cookies
          </h2>
          <p>
            We do <strong>not</strong> use third-party advertising cookies, cross-site tracking scripts, or commercial analytics trackers.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <RefreshCw className="w-5 h-5 text-amber-600" /> 3. Managing Your Storage
          </h2>
          <p>
            You can clear your cached local storage data at any time through your browser's Privacy & Security settings or by logging out of the application.
          </p>
        </section>
      </div>
    </div>
  )
}
