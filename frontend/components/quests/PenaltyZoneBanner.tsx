'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'

interface PenaltyStatus {
  isInPenalty: boolean
  penaltyLevel?: number
  message?: string
  expiresAt?: string | null
}

export function PenaltyZoneBanner() {
  const { data } = useQuery<PenaltyStatus>({
    queryKey: ['hunter', 'penalty'],
    queryFn: () => api.get('api/hunter/penalty-status'),
    staleTime: 60 * 1000, // 1 min
  })

  if (!data?.isInPenalty) return null

  return (
    <div className="penalty-banner">
      ⚠️ Zona de Penalidade — Complete a Quest de Resgate antes de perder o rank!
    </div>
  )
}
