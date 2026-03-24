'use client'

import { useEffect, useState } from 'react'
import { useWorkoutStore } from '@/lib/stores/workoutStore'

export function WorkoutTimer() {
  const { sessionStartedAt } = useWorkoutStore()
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!sessionStartedAt) return

    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - sessionStartedAt.getTime()) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [sessionStartedAt])

  const hours = Math.floor(elapsed / 3600)
  const mins = Math.floor((elapsed % 3600) / 60)
  const secs = elapsed % 60

  const timeStr = hours > 0
    ? `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    : `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`

  return (
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
      <span className="text-sm font-mono font-bold text-foreground">{timeStr}</span>
    </div>
  )
}
