'use client'

import { useState, useCallback } from 'react'
import { api } from '@/lib/api/client'

interface WaterTrackerProps {
  initialMl?: number
  targetMl?: number
  compact?: boolean
  onUpdate?: (newTotalMl: number) => void
}

export function WaterTracker({
  initialMl = 0,
  targetMl = 3500,
  compact = false,
  onUpdate,
}: WaterTrackerProps) {
  const [waterMl, setWaterMl] = useState(initialMl)
  const [loading, setLoading] = useState(false)

  const pct = Math.min(Math.round((waterMl / targetMl) * 100), 100)
  const targetL = (targetMl / 1000).toFixed(1)

  const addWater = useCallback(async (ml: number) => {
    // Optimistic update
    const next = Math.min(waterMl + ml, targetMl + 1000)
    setWaterMl(next)
    onUpdate?.(next)

    setLoading(true)
    try {
      const res = await api.post<{ totalTodayMl: number }>('api/nutrition/water', { amountMl: ml })
      setWaterMl(res.totalTodayMl)
      onUpdate?.(res.totalTodayMl)
    } catch {
      // Se falhar, mantém o valor otimista — vai sincronizar depois
    } finally {
      setLoading(false)
    }
  }, [waterMl, targetMl, onUpdate])

  if (compact) {
    return (
      <div className="hunter-card flex flex-col items-center gap-2">
        {/* Círculo de progresso */}
        <div className="relative w-16 h-16">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="26" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
            <circle
              cx="32"
              cy="32"
              r="26"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 26}`}
              strokeDashoffset={`${2 * Math.PI * 26 * (1 - pct / 100)}`}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-blue-400">{pct}%</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          {(waterMl / 1000).toFixed(1)}L / {targetL}L
        </p>
        <div className="flex gap-1">
          {[250, 500].map((ml) => (
            <button
              key={ml}
              onClick={() => addWater(ml)}
              disabled={loading}
              className="text-xs border border-border rounded-lg px-2 py-1 text-blue-400 disabled:opacity-50"
            >
              +{ml}ml
            </button>
          ))}
        </div>
      </div>
    )
  }

  const color = pct >= 100 ? '#22c55e' : pct >= 60 ? '#3b82f6' : '#f59e0b'

  return (
    <div className="hunter-card space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-foreground">💧 Água</h3>
        <span className="text-sm font-mono" style={{ color }}>
          {(waterMl / 1000).toFixed(2)}L
          <span className="text-muted-foreground text-xs"> / {targetL}L</span>
        </span>
      </div>

      {/* Barra */}
      <div className="h-3 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>

      {/* Copos visuais */}
      <div className="flex gap-1">
        {Array.from({ length: 8 }).map((_, i) => {
          const cupMl = targetMl / 8
          const filled = waterMl >= cupMl * (i + 1)
          const partial = !filled && waterMl > cupMl * i
          return (
            <div
              key={i}
              onClick={() => addWater(cupMl)}
              className="flex-1 h-6 rounded border cursor-pointer transition-all"
              style={{
                backgroundColor: filled ? color : partial ? `${color}44` : 'transparent',
                borderColor: filled ? color : 'hsl(var(--border))',
              }}
              title={`+${Math.round(cupMl)}ml`}
            />
          )
        })}
      </div>

      {/* Botões rápidos */}
      <div className="flex gap-2 flex-wrap">
        {[150, 250, 500, 750].map((ml) => (
          <button
            key={ml}
            onClick={() => addWater(ml)}
            disabled={loading}
            className="flex-1 py-2 text-xs border border-blue-700/50 rounded-lg text-blue-400 bg-blue-950/30 disabled:opacity-50 active:scale-95 transition-transform"
          >
            +{ml}ml
          </button>
        ))}
      </div>

      {pct >= 100 && (
        <p className="text-xs text-green-400 text-center">
          ✓ Meta de hidratação atingida! Iron Shadow aprovado.
        </p>
      )}
    </div>
  )
}
