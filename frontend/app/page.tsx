'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/authStore'

export default function RootPage() {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    router.replace(isAuthenticated ? '/dashboard' : '/login')
  }, [isAuthenticated, router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="text-4xl">⚔️</div>
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    </div>
  )
}
