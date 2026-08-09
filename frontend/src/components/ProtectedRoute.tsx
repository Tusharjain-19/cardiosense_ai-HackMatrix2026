'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/context/authContext'
import { UserRole } from '@/types'
import { Activity } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: UserRole
}

export default function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const [mounted, setMounted] = useState(false)
  const { user, isLoading } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !isLoading && !user) {
      router.push('/login')
    } else if (mounted && user && requiredRole && user.role !== requiredRole && user.role !== 'admin') {
      router.push('/dashboard')
    }
  }, [user, isLoading, requiredRole, router, mounted])

  if (!mounted || isLoading || !user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Activity className="w-10 h-10 text-blue-600 animate-heart mb-3" />
        <p className="text-slate-500 font-medium text-sm">Loading CardioAI Session...</p>
      </div>
    )
  }

  if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
    return null
  }

  return <>{children}</>
}
