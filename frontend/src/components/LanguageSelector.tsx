'use client'

import React from 'react'
import { useLanguage, LANGUAGES, Language } from '@/context/LanguageContext'
import { Globe } from 'lucide-react'

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="relative inline-flex items-center">
      <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors">
        <Globe className="w-3.5 h-3.5 text-blue-600 shrink-0" />
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer pr-1"
          aria-label="Select Application Language"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.nativeName} ({lang.label})
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
