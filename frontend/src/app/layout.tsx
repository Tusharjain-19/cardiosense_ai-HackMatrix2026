import './globals.css'
import type { Metadata } from 'next'
import Navigation from '@/components/Navigation'
import { Toaster } from 'react-hot-toast'
import { LanguageProvider } from '@/context/LanguageContext'
import InteractiveLoginBuddies from '@/components/InteractiveLoginBuddies'
import CardiosenseLogo from '@/components/CardiosenseLogo'

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
          <footer className="bg-slate-50 border-t border-slate-200 pt-12 pb-6 text-slate-600 text-sm relative overflow-hidden">
            {/* Interactive Corner Monsters */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-50">
              <InteractiveLoginBuddies isEmailFocused={false} isPasswordFocused={false} showPassword={false} isLoading={false} />
            </div>
            
            <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-10">
                {/* Brand & Mission */}
                <div className="space-y-4">
                  <div className="flex items-center">
                    <CardiosenseLogo size="md" variant="light" showText={true} />
                  </div>
                  <p className="text-slate-600 leading-relaxed text-xs">
                    Democratizing advanced cardiac screening through artificial intelligence. Our platform analyzes electrophysiological and optical waveforms to provide explainable insights and risk stratification.
                  </p>
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-md">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    <span className="text-xs font-bold text-blue-700">v1.0 Hackathon Build</span>
                  </div>
                </div>

                {/* Quick Links */}
                <div className="grid grid-cols-2 gap-8 md:col-span-2">
                  <div>
                    <h3 className="font-bold text-slate-900 mb-4 text-xs uppercase tracking-wider">Platform</h3>
                    <ul className="space-y-3 text-xs">
                      <li><a href="/dashboard" className="hover:text-teal-400 transition-colors">Dashboard</a></li>
                      <li><a href="/upload" className="hover:text-teal-400 transition-colors">Upload Signal (ECG/PPG)</a></li>
                      <li><a href="/history" className="hover:text-teal-400 transition-colors">History & Trends</a></li>
                      <li><a href="/doctor/patients" className="hover:text-teal-400 transition-colors">Doctor Portal</a></li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-slate-900 mb-4 text-xs uppercase tracking-wider">Legal & Compliance</h3>
                    <ul className="space-y-3 text-xs">
                      <li><a href="#" className="hover:text-teal-400 transition-colors">Privacy Policy</a></li>
                      <li><a href="#" className="hover:text-teal-400 transition-colors">Terms of Service</a></li>
                      <li><a href="#" className="hover:text-teal-400 transition-colors">Data Security (HIPAA)</a></li>
                      <li><a href="#" className="hover:text-teal-400 transition-colors">Cookie Policy</a></li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Warning Banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8">
                <h4 className="font-bold text-amber-800 text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
                  <span className="text-lg">⚠️</span> Important Medical Disclaimer
                </h4>
                <p className="text-amber-700 text-xs leading-relaxed">
                  Cardiosense AI is a research and screening prototype. The deep learning models, algorithms, and generated reports provided by this application <strong>do not constitute a formal medical diagnosis</strong>, medical advice, or a definitive clinical evaluation. The system is designed to assist, not replace, certified healthcare professionals. If you are experiencing chest pain, shortness of breath, or any medical emergency, please seek immediate medical attention or call your local emergency services.
                </p>
              </div>

              {/* Copyright */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200 text-xs">
                <p>&copy; {new Date().getFullYear()} Cardiosense AI. All rights reserved.</p>

                <div className="flex items-center gap-4 relative z-20">
                  <a href="#" className="hover:text-slate-900 transition-colors">Twitter</a>
                  <a href="#" className="hover:text-slate-900 transition-colors">GitHub</a>
                  <a href="#" className="hover:text-slate-900 transition-colors">Support</a>
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
