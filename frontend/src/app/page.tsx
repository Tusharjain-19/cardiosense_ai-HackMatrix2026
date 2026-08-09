'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/context/authContext'
import { Activity } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const { user } = useAuthStore()

  useEffect(() => {
    if (user) {
      router.replace('/dashboard')
    } else {
      router.replace('/login')
    }
  }, [user, router])

  return (
    <div className="min-h-screen bg-[#f9f9ff] flex flex-col items-center justify-center p-6 text-center">
      <div className="p-4 rounded-full bg-[#00605b]/10 mb-4 animate-bounce">
        <Activity className="w-10 h-10 text-[#00605b]" />
      </div>
      <h1 className="text-2xl font-extrabold text-[#00605b] mb-2 font-['Plus_Jakarta_Sans']">
        Cardiosense AI
      </h1>
      <p className="text-sm text-[#3e4947] font-medium">
        Loading Clinical Screening Dashboard...
      </p>
    </div>
  )
}
