import './globals.css'
import type { Metadata } from 'next'
import Navigation from '@/components/Navigation'
import { Toaster } from 'react-hot-toast'
import { LanguageProvider } from '@/context/LanguageContext'
import CardiosenseLogo from '@/components/CardiosenseLogo'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Cardiosense AI — AI-Assisted Cardiac Screening Platform',
  description: 'Upload ECG/PPG signals, inspect AI predictions, explainability overlays, and generate screening reports.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <LanguageProvider>
          <Navigation />
          <main className="flex-1">{children}</main>

          <footer className="bg-slate-900 border-t border-slate-800 pt-12 pb-8 text-slate-400 text-sm relative z-10">
            <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
                {/* Brand & Mission (Col 1-2) */}
                <div className="space-y-4 md:col-span-2">
                  <div className="flex items-center">
                    <CardiosenseLogo size="md" variant="dark" showText={true} />
                  </div>
                  <p className="text-slate-400 leading-relaxed text-xs max-w-lg">
                    Democratizing advanced cardiac screening through artificial intelligence. Our platform analyzes electrophysiological (ECG) and optical (PPG) waveforms to provide explainable insights, signal quality scores, and risk stratification.
                  </p>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/10 border border-teal-500/20 rounded-lg">
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
                    <span className="text-xs font-bold text-teal-300">v1.0 Hackathon Build</span>
                  </div>
                </div>

                {/* Platform Links (Col 3) */}
                <div>
                  <h3 className="font-bold text-white mb-4 text-xs uppercase tracking-wider">Platform & Navigation</h3>
                  <ul className="space-y-2.5 text-xs">
                    <li><Link href="/dashboard" className="hover:text-teal-400 transition-colors">Dashboard</Link></li>
                    <li><Link href="/upload" className="hover:text-teal-400 transition-colors">Upload Signal (ECG/PPG)</Link></li>
                    <li><Link href="/history" className="hover:text-teal-400 transition-colors">History & Trends</Link></li>
                    <li><Link href="/doctor/patients" className="hover:text-teal-400 transition-colors">Doctor Portal</Link></li>
                    <li><Link href="/about" className="hover:text-teal-400 transition-colors">About & Architecture</Link></li>
                  </ul>
                </div>

                {/* Legal Links (Col 4) */}
                <div>
                  <h3 className="font-bold text-white mb-4 text-xs uppercase tracking-wider">Legal & Compliance</h3>
                  <ul className="space-y-2.5 text-xs">
                    <li><Link href="/privacy" className="hover:text-teal-400 transition-colors">Privacy Policy</Link></li>
                    <li><Link href="/terms" className="hover:text-teal-400 transition-colors">Terms of Service</Link></li>
                    <li><Link href="/hipaa" className="hover:text-teal-400 transition-colors">Data Security (HIPAA)</Link></li>
                    <li><Link href="/cookies" className="hover:text-teal-400 transition-colors">Cookie Policy</Link></li>
                  </ul>
                </div>
              </div>

              {/* Medical Disclaimer Banner */}
              <div className="bg-amber-950/40 border border-amber-800/50 rounded-xl p-5 mb-8 text-amber-200/90">
                <h4 className="font-bold text-amber-400 text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
                  <span className="text-base">⚠️</span> Important Medical Disclaimer
                </h4>
                <p className="text-amber-200/80 text-xs leading-relaxed">
                  Cardiosense AI is a research and screening prototype. The deep learning models, algorithms, and generated reports provided by this application <strong>do not constitute a formal medical diagnosis</strong>, medical advice, or a definitive clinical evaluation. The system is designed to assist, not replace, certified healthcare professionals. If you are experiencing chest pain, shortness of breath, or any medical emergency, please seek immediate medical attention or call your local emergency services.
                </p>
              </div>

              {/* Copyright & Social */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-800 text-xs text-slate-500">
                <p>&copy; {new Date().getFullYear()} Cardiosense AI Team. All rights reserved.</p>

                <div className="flex items-center gap-5">
                  <a href="https://github.com/Tusharjain-19/cardiosense_ai" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a>
                  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Twitter</a>
                  <a href="mailto:support@cardiosense.ai" className="hover:text-white transition-colors">Support</a>
                </div>
              </div>
            </div>
          </footer>
          <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
        </LanguageProvider>
      </body>
    </html>
  )
}
