'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import CardiosenseLogo from '@/components/CardiosenseLogo'
import { useAuthStore } from '@/context/authContext'
import { useLanguage } from '@/context/LanguageContext'
import LanguageSelector from '@/components/LanguageSelector'
import SettingsModal from '@/components/SettingsModal'
import toast from 'react-hot-toast'
import {
  Activity,
  UploadCloud,
  History,
  Stethoscope,
  ShieldAlert,
  LogOut,
  Menu,
  X,
  UserCheck,
  Settings,
  ChevronDown,
  User,
  Sparkles,
} from 'lucide-react'

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout, switchRole } = useAuthStore()
  const { t } = useLanguage()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const [mounted, setMounted] = useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !user || pathname === '/login' || pathname === '/signup') return null

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    router.replace('/login')
  }

  const isActive = (path: string) => pathname === path

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Compact Nav Links */}
          <div className="flex items-center gap-4 lg:gap-6 min-w-0">
            <Link
              href={user.role === 'doctor' ? '/doctor/patients' : user.role === 'admin' ? '/admin' : '/dashboard'}
              className="flex items-center hover:opacity-95 transition-opacity shrink-0"
            >
              <CardiosenseLogo size="md" />
            </Link>

            {/* Compact Nav Links — Never get cut off */}
            <nav className="hidden md:flex items-center gap-1.5 shrink-0">
              {/* PATIENT NAV */}
              {user.role === 'patient' && (
                <>
                  <Link
                    href="/dashboard"
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      isActive('/dashboard')
                        ? 'bg-teal-50 text-teal-900 border border-teal-200 shadow-sm'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Activity className="w-4 h-4 text-teal-600 shrink-0" />
                    {t('dashboard')}
                  </Link>

                  <Link
                    href="/upload"
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      isActive('/upload')
                        ? 'bg-teal-50 text-teal-900 border border-teal-200 shadow-sm'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <UploadCloud className="w-4 h-4 text-teal-600 shrink-0" />
                    {t('uploadNewSignal')}
                  </Link>

                  <Link
                    href="/dashboard?mode=hospital"
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200`}
                  >
                    <Activity className="w-4 h-4 text-emerald-600 shrink-0 animate-pulse" />
                    Hospital Mode
                  </Link>

                  <Link
                    href="/dashboard?mode=webcam"
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200`}
                  >
                    <UploadCloud className="w-4 h-4 text-sky-600 shrink-0" />
                    Webcam rPPG
                  </Link>

                  <Link
                    href="/history"
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      isActive('/history')
                        ? 'bg-[#00605b] text-white shadow-md'
                        : 'bg-teal-50 text-[#00605b] hover:bg-teal-100 border border-teal-200 shadow-sm'
                    }`}
                  >
                    <History className="w-4 h-4 shrink-0 text-[#00605b] group-hover:text-white" />
                    <span>{t('history')}</span>
                  </Link>
                </>
              )}

              {/* DOCTOR NAV */}
              {user.role === 'doctor' && (
                <>
                  <Link
                    href="/doctor/patients"
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      pathname.startsWith('/doctor') || isActive('/dashboard')
                        ? 'bg-emerald-50 text-emerald-950 border border-emerald-300 shadow-sm font-extrabold'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Stethoscope className="w-4 h-4 text-emerald-700 shrink-0" />
                    {t('doctorPortal')}
                  </Link>

                  <Link
                    href="/upload"
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      isActive('/upload')
                        ? 'bg-teal-50 text-teal-950 border border-teal-300 shadow-sm'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <UploadCloud className="w-4 h-4 text-teal-700 shrink-0" />
                    {t('uploadNewSignal')}
                  </Link>

                  <Link
                    href="/history"
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      isActive('/history')
                        ? 'bg-[#00605b] text-white shadow-md'
                        : 'bg-teal-50 text-[#00605b] hover:bg-teal-100 border border-teal-200 shadow-sm'
                    }`}
                  >
                    <History className="w-4 h-4 shrink-0" />
                    <span>{t('history')}</span>
                  </Link>
                </>
              )}

              {/* ADMIN NAV */}
              {user.role === 'admin' && (
                <>
                  <Link
                    href="/admin"
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      isActive('/admin') || isActive('/dashboard')
                        ? 'bg-purple-50 text-purple-950 border border-purple-300 shadow-sm font-extrabold'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4 text-purple-700 shrink-0" />
                    {t('adminPanel')}
                  </Link>

                  <Link
                    href="/history"
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      isActive('/history')
                        ? 'bg-purple-50 text-purple-950 border border-purple-300 shadow-sm'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <History className="w-4 h-4 text-purple-700 shrink-0" />
                    {t('history')}
                  </Link>
                </>
              )}
            </nav>
          </div>

          {/* Right Controls Bar */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">


            {/* Multi-Language Selector */}
            <LanguageSelector />

            {/* Persona Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold border border-slate-200 shrink-0">
              <button
                onClick={() => {
                  switchRole('patient')
                  router.push('/dashboard')
                }}
                className={`px-2 py-1 rounded-lg transition-all text-[11px] ${
                  user.role === 'patient'
                    ? 'bg-white text-teal-900 shadow-sm font-extrabold border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('patientMode')}
              </button>
              <button
                onClick={() => {
                  switchRole('doctor')
                  router.push('/doctor/patients')
                }}
                className={`px-2 py-1 rounded-lg transition-all text-[11px] ${
                  user.role === 'doctor'
                    ? 'bg-white text-emerald-900 shadow-sm font-extrabold border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('doctorMode')}
              </button>
              <button
                onClick={() => {
                  switchRole('admin')
                  router.push('/admin')
                }}
                className={`px-2 py-1 rounded-lg transition-all text-[11px] ${
                  user.role === 'admin'
                    ? 'bg-white text-purple-900 shadow-sm font-extrabold border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('adminMode')}
              </button>
            </div>

            {/* Profile & Settings Dropdown */}
            <div className="relative shrink-0 border-l border-slate-200 pl-2">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <div
                  className={`w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0 ${
                    user.role === 'doctor' ? 'bg-emerald-700' : user.role === 'admin' ? 'bg-purple-700' : 'bg-teal-700'
                  }`}
                >
                  {user.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)}
                </div>
                <div className="text-left hidden lg:block">
                  <p className="text-xs font-bold text-slate-900 leading-tight">
                    {user.name}
                  </p>
                  <p
                    className={`text-[10px] font-extrabold capitalize leading-tight ${
                      user.role === 'doctor' ? 'text-emerald-700' : user.role === 'admin' ? 'text-purple-700' : 'text-teal-700'
                    }`}
                  >
                    {user.role}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {/* User Dropdown Menu */}
              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-fadeIn"
                  onMouseLeave={() => setUserDropdownOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-slate-100">
                    <strong className="text-xs font-bold text-slate-900 block">{user.name}</strong>
                    <span className="text-[11px] text-slate-500">{user.email}</span>
                  </div>

                  <Link
                    href="/history"
                    onClick={() => setUserDropdownOpen(false)}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-[#00605b] hover:bg-teal-50 flex items-center gap-2 border-b border-slate-100"
                  >
                    <History className="w-4 h-4 text-[#00605b]" />
                    <span>Screening Records History</span>
                  </Link>

                  <button
                    onClick={() => {
                      setIsSettingsOpen(true)
                      setUserDropdownOpen(false)
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4 text-teal-700" />
                    Settings & Profile
                  </button>

                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-slate-100"
                  >
                    <LogOut className="w-4 h-4" />
                    {isLoggingOut ? 'Signing out...' : t('logout')}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu trigger */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white p-4 space-y-3 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <p className="font-semibold text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSelector />
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-800 capitalize">
                {user.role}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            {user.role === 'patient' && (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-slate-700 font-medium hover:bg-slate-100 text-xs"
                >
                  {t('dashboard')}
                </Link>
                <Link
                  href="/upload"
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-slate-700 font-medium hover:bg-slate-100 text-xs"
                >
                  {t('uploadNewSignal')}
                </Link>
                <Link
                  href="/history"
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-slate-700 font-medium hover:bg-slate-100 text-xs"
                >
                  {t('history')}
                </Link>
              </>
            )}

            {user.role === 'doctor' && (
              <>
                <Link
                  href="/doctor/patients"
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-emerald-800 font-bold hover:bg-emerald-50 text-xs"
                >
                  {t('doctorPortal')}
                </Link>
                <Link
                  href="/upload"
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-slate-700 font-medium hover:bg-slate-100 text-xs"
                >
                  {t('uploadNewSignal')}
                </Link>
                <Link
                  href="/history"
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-slate-700 font-medium hover:bg-slate-100 text-xs"
                >
                  {t('history')}
                </Link>
              </>
            )}

            {user.role === 'admin' && (
              <>
                <Link
                  href="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-purple-800 font-bold hover:bg-purple-50 text-xs"
                >
                  {t('adminPanel')}
                </Link>
                <Link
                  href="/history"
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-slate-700 font-medium hover:bg-slate-100 text-xs"
                >
                  {t('history')}
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => {
              setIsSettingsOpen(true)
              setMenuOpen(false)
            }}
            className="w-full mt-2 text-left px-3 py-2 text-slate-700 font-medium hover:bg-slate-100 rounded-lg flex items-center gap-2 text-xs"
          >
            <Settings className="w-4 h-4 text-teal-700" />
            Settings & Profile
          </button>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full text-left px-3 py-2 text-red-600 font-medium hover:bg-red-50 rounded-lg flex items-center gap-2 text-xs"
          >
            <LogOut className="w-4 h-4" />
            {isLoggingOut ? 'Signing out...' : t('logout')}
          </button>
        </div>
      )}

      {/* Settings Modal Dialog */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </header>
  )
}
