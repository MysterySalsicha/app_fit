'use client'

import { BottomNav } from '@/components/shared/BottomNav'
import { OfflineBanner } from '@/components/shared/OfflineBanner'
import { RestTimerPortal } from '@/components/workout/RestTimerPortal'
import { SystemNotification } from '@/components/shared/SystemNotification'
import { PenaltyZoneBanner } from '@/components/quests/PenaltyZoneBanner'
import { useHunterSync } from '@/lib/hooks/useHunterSync'

function AppLayoutInner({ children }: { children: React.ReactNode }) {
  // Sincroniza o perfil do Hunter da API para o Zustand store globalmente
  useHunterSync()

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <OfflineBanner />
      <PenaltyZoneBanner />
      <SystemNotification />

      <main className="flex-1 pb-20 overflow-y-auto">
        {children}
      </main>

      <RestTimerPortal />
      <BottomNav />
    </div>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppLayoutInner>{children}</AppLayoutInner>
}
