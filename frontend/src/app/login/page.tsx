'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/context/authContext'
import CardiosenseLogo from '@/components/CardiosenseLogo'
import InteractiveLoginBuddies from '@/components/InteractiveLoginBuddies'
import CuteCardiacMascot from '@/components/CuteCardiacMascot'
import toast from 'react-hot-toast'
import { Lock, Mail, ArrowRight, UserCheck, Eye, EyeOff } from 'lucide-react'
import { UserRole } from '@/types'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailFocused, setIsEmailFocused] = useState(false)
  const [isPasswordFocused, setIsPasswordFocused] = useState(false)

  const router = useRouter()
  const login = useAuthStore((state) => state.login)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await login(email)
      toast.success('Signed in successfully!')
      router.push('/dashboard')
    } catch (error) {
      console.error(error)
      toast.error('Authentication failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickLogin = async (role: UserRole, demoEmail: string) => {
    setEmail(demoEmail)
    setIsLoading(true)
    try {
      await login(demoEmail, role)
      toast.success(`Logged in as ${role.toUpperCase()} persona!`)
      router.push(role === 'doctor' ? '/doctor/patients' : role === 'admin' ? '/admin' : '/dashboard')
    } catch (error) {
      console.error(error)
      toast.error('Quick login failed.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-200 flex items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden select-none">
      {/* Interactive Giant Monsters Surround Background */}
      <InteractiveLoginBuddies
        isEmailFocused={isEmailFocused}
        isPasswordFocused={isPasswordFocused}
        showPassword={showPassword}
        isLoading={isLoading}
        hasAnyInput={email.length > 0 || password.length > 0}
      />

      {/* Main Login Card Wrapper */}
      <div className="relative z-20 w-full max-w-md my-auto flex flex-col items-center">
        {/* Brand New Cute Medical Mascot ("Dr. Cardio") */}
        <CuteCardiacMascot
          isEmailFocused={isEmailFocused}
          isPasswordFocused={isPasswordFocused}
          showPassword={showPassword}
          isLoading={isLoading}
          hasAnyInput={email.length > 0 || password.length > 0}
        />

        {/* Login Card */}
        <div className="w-full bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-300 p-8 sm:p-10 pt-10">
          {/* Brand Header */}
          <div className="text-center mb-8">
            <div className="inline-flex justify-center mb-2">
              <CardiosenseLogo size="lg" />
            </div>
            <p className="text-slate-600 text-xs font-semibold mt-1">
              Clinical Signal Screening & Waveform Analytics
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1.5">
                Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setIsEmailFocused(true)}
                  onBlur={() => setIsEmailFocused(false)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition-all shadow-inner"
                  placeholder="you@cardiosense.ai"
                />
              </div>
            </div>

            {/* Password Field with Show/Hide Toggle */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1 focus:outline-none"
                >
                  {showPassword ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" /> Hide
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" /> Show
                    </>
                  )}
                </button>
              </div>

              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition-all shadow-inner"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                  title={showPassword ? 'Hide Password' : 'Show Password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-teal-700/25 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              {isLoading ? 'Authenticating...' : 'Sign In to Clinical Portal'}{' '}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Shortcuts */}
          <div className="mt-7 pt-6 border-t border-slate-200">
            <p className="text-xs font-bold text-slate-600 text-center mb-3 flex items-center justify-center gap-1.5">
              <UserCheck className="w-4 h-4 text-teal-700" /> One-Click Demo Sign-In Personas:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('patient', 'patient@cardiosense.ai')}
                className="px-2.5 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 hover:bg-blue-100 text-xs font-bold transition-all text-center"
              >
                Patient
                <span className="block text-[9px] font-normal text-blue-600">Rajesh Sharma</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('doctor', 'doctor@cardiosense.ai')}
                className="px-2.5 py-2 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 hover:bg-teal-100 text-xs font-bold transition-all text-center"
              >
                Doctor
                <span className="block text-[9px] font-normal text-teal-700">Dr. Rajesh Iyer</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin@cardiosense.ai')}
                className="px-2.5 py-2 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 hover:bg-purple-100 text-xs font-bold transition-all text-center"
              >
                Admin
                <span className="block text-[9px] font-normal text-purple-700">Arjun Mehta</span>
              </button>
            </div>
          </div>

          {/* Footer Link */}
          <div className="mt-6 text-center text-xs font-medium text-slate-500">
            Don't have an account?{' '}
            <Link href="/signup" className="text-teal-700 font-bold hover:underline">
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
