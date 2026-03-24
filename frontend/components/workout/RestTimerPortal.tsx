'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRestTimerStore } from '@/lib/stores/restTimerStore'

export function RestTimerPortal() {
  const { isRunning, secondsLeft, totalSeconds, skipTimer, addSeconds } = useRestTimerStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !isRunning) return null

  const pct = Math.round(((totalSeconds - secondsLeft) / totalSeconds) * 100)
  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60
  const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`

  const portal = (
    <div className="rest-timer-portal animate-in slide-in-from-bottom-4 duration-300">
      {/* Círculo de progresso */}
      <div className="relative w-12 h-12 flex-shrink-0">
        <svg className="w-12 h-12 -rotate-90" viewBox="0 0 44 44">
          <circle cx="22" cy="22" r="18" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
          <circle
            cx="22"
            cy="22"
            r="18"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="3"
            strokeDasharray={`${2 * Math.PI * 18}`}
            strokeDashoffset={`${2 * Math.PI * 18 * (1 - pct / 100)}`}
            className="transition-all duration-1000"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-mono font-bold">
          {timeStr}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-xs text-muted-foreground">Tempo de descanso</p>
        <div className="flex gap-2">
          <button
            onClick={() => addSeconds(15)}
            className="text-xs border border-border rounded-lg px-2 py-1 text-muted-foreground"
          >
            +15s
          </button>
          <button
            onClick={skipTimer}
            className="text-xs bg-primary text-primary-foreground rounded-lg px-3 py-1"
          >
            Pular
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(portal, document.body)
}
