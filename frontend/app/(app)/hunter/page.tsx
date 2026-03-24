import { Suspense } from 'react'
import { StatPanel } from '@/components/hunter/StatPanel'
import { ShadowArmy } from '@/components/hunter/ShadowArmy'
import { MuscleRankMap } from '@/components/hunter/MuscleRankMap'
import Link from 'next/link'

export default function HunterPage() {
  return (
    <div className="px-4 pt-4 pb-6 space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Perfil do Hunter</h1>
        <div className="flex gap-2">
          <Link
            href="/hunter/skills"
            className="text-xs text-muted-foreground border border-border rounded-lg px-3 py-1.5"
          >
            Skills
          </Link>
          <Link
            href="/hunter/muscles"
            className="text-xs text-muted-foreground border border-border rounded-lg px-3 py-1.5"
          >
            Músculos
          </Link>
        </div>
      </div>

      {/* Atributos RPG */}
      <Suspense fallback={<div className="hunter-card h-48 animate-pulse" />}>
        <StatPanel />
      </Suspense>

      {/* Shadow Army */}
      <Suspense fallback={<div className="hunter-card h-24 animate-pulse" />}>
        <ShadowArmy detailed />
      </Suspense>

      {/* Mapa muscular resumido */}
      <Suspense fallback={<div className="hunter-card h-64 animate-pulse" />}>
        <MuscleRankMap preview />
      </Suspense>
    </div>
  )
}
