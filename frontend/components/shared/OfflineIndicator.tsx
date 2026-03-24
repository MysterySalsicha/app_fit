'use client'

import { useEffect, useState } from 'react'
import { registerSyncListeners, getPendingCount } from '@/lib/db/sync'

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const [showSyncedBanner, setShowSyncedBanner] = useState(false)

  useEffect(() => {
    // Registra listeners de sync (idempotente)
    registerSyncListeners()

    // Estado inicial
    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true)

    const handleOnline = async () => {
      setIsOnline(true)
      setPendingCount(0)
    }

    const handleOffline = async () => {
      setIsOnline(false)
      const count = await getPendingCount()
      setPendingCount(count)
    }

    const handleSynced = (e: Event) => {
      const { synced } = (e as CustomEvent).detail
      if (synced > 0) {
        setShowSyncedBanner(true)
        setPendingCount(0)
        setTimeout(() => setShowSyncedBanner(false), 3000)
      }
    }

    window.addEventListener('online',          handleOnline)
    window.addEventListener('offline',         handleOffline)
    window.addEventListener('hunterfit:synced', handleSynced)

    return () => {
      window.removeEventListener('online',           handleOnline)
      window.removeEventListener('offline',          handleOffline)
      window.removeEventListener('hunterfit:synced', handleSynced)
    }
  }, [])

  if (isOnline && !showSyncedBanner) return null

  if (showSyncedBanner) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-green-900/90 text-green-300 text-xs py-1.5 text-center font-medium">
        ✓ Dados sincronizados com o servidor
      </div>
    )
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-900/90 text-amber-300 text-xs py-1.5 text-center font-medium">
      📡 Sem conexão — modo offline
      {pendingCount > 0 && ` · ${pendingCount} operação(ões) pendente(s)`}
    </div>
  )
}
