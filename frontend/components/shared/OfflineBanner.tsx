'use client'

import { useEffect, useState } from 'react'
import { registerSyncListeners, getPendingCount } from '@/lib/db/sync'

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [syncedMsg, setSyncedMsg] = useState(false)

  useEffect(() => {
    registerSyncListeners() // idempotente

    const init = async () => {
      const offline = typeof navigator !== 'undefined' ? !navigator.onLine : false
      setIsOffline(offline)
      if (offline) {
        const cnt = await getPendingCount()
        setPendingCount(cnt)
      }
    }
    init()

    const handleOffline = async () => {
      setIsOffline(true)
      const cnt = await getPendingCount()
      setPendingCount(cnt)
    }

    const handleOnline = () => {
      setIsOffline(false)
    }

    const handleSynced = (e: Event) => {
      const { synced } = (e as CustomEvent<{ synced: number; failed: number }>).detail
      if (synced > 0) {
        setSyncedMsg(true)
        setPendingCount(0)
        setTimeout(() => setSyncedMsg(false), 3000)
      }
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    window.addEventListener('hunterfit:synced', handleSynced)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('hunterfit:synced', handleSynced)
    }
  }, [])

  if (syncedMsg) {
    return (
      <div className="w-full py-1.5 px-4 text-center text-xs font-medium bg-green-950 border-b border-green-800 text-green-300 z-50">
        ✓ Dados sincronizados com o servidor
      </div>
    )
  }

  if (!isOffline) return null

  return (
    <div className="w-full py-1.5 px-4 text-center text-xs font-medium bg-amber-950 border-b border-amber-800 text-amber-300 z-50">
      📡 Modo Offline — dados sincronizarão quando conectar
      {pendingCount > 0 && ` (${pendingCount} pendente${pendingCount > 1 ? 's' : ''})`}
    </div>
  )
}
