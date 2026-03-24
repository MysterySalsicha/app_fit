'use client'

// TODO: verificar penalty zone via hunterStore
const IS_IN_PENALTY = false

export function PenaltyZoneBanner() {
  if (!IS_IN_PENALTY) return null

  return (
    <div className="penalty-banner">
      ⚠️ Zona de Penalidade — Complete a Quest de Resgate antes de perder o rank!
    </div>
  )
}
