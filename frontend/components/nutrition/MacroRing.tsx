'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'

interface MacroRingProps {
  compact?: boolean
}

interface TodayResponse {
  totals: { kcalConsumed: number; proteinG: number; carbsG: number; fatG: number; waterMl: number }
  targets: { kcal: number; proteinG: number; carbsG: number; fatG: number; waterMl: number }
}

const DEFAULTS: TodayResponse = {
  totals:  { kcalConsumed: 0, proteinG: 0, carbsG: 0, fatG: 0, waterMl: 0 },
  targets: { kcal: 2450, proteinG: 180, carbsG: 220, fatG: 70, waterMl: 3500 },
}

function DonutSlice({
  pct,
  color,
  size = 64,
  strokeWidth = 6,
}: {
  pct: number
  color: string
  size?: number
  strokeWidth?: number
}) {
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.min(pct / 100, 1))

  return (
    <svg width={size} height={size} className="-rotate-90" viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-700"
      />
    </svg>
  )
}

export function MacroRing({ compact = false }: MacroRingProps) {
  const { data } = useQuery<TodayResponse>({
    queryKey: ['nutrition', 'today'],
    queryFn: () => api.get<TodayResponse>('api/nutrition/today'),
    staleTime: 60_000,
  })

  const totals  = data?.totals  ?? DEFAULTS.totals
  const targets = data?.targets ?? DEFAULTS.targets

  const kcalPct   = targets.kcal > 0 ? Math.round((totals.kcalConsumed / targets.kcal) * 100) : 0
  const proteinPct = targets.proteinG > 0 ? Math.round((totals.proteinG / targets.proteinG) * 100) : 0

  if (compact) {
    return (
      <div className="hunter-card flex flex-col items-center gap-2">
        <div className="relative w-16 h-16">
          <DonutSlice pct={kcalPct} color="#f97316" size={64} strokeWidth={6} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-orange-400">{kcalPct}%</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          {totals.kcalConsumed}/{targets.kcal} kcal
        </p>
        <p className="text-xs font-mono text-green-400">
          P {Math.round(totals.proteinG)}g
        </p>
      </div>
    )
  }

  const macros = [
    { label: 'Proteína',  key: 'proteinG', target: targets.proteinG, value: totals.proteinG, color: '#22c55e' },
    { label: 'Carbs',     key: 'carbsG',   target: targets.carbsG,   value: totals.carbsG,   color: '#3b82f6' },
    { label: 'Gordura',   key: 'fatG',     target: targets.fatG,     value: totals.fatG,     color: '#f59e0b' },
  ]

  return (
    <div className="hunter-card space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">🍎 Macros</h3>
        <span className="text-xs font-mono text-orange-400">
          {totals.kcalConsumed} / {targets.kcal} kcal
        </span>
      </div>
      {macros.map((macro) => {
        const pct = macro.target > 0 ? Math.round((macro.value / macro.target) * 100) : 0
        return (
          <div key={macro.key} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{macro.label}</span>
              <span style={{ color: macro.color }}>
                {Math.round(macro.value)}/{Math.round(macro.target)}g
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: macro.color }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
