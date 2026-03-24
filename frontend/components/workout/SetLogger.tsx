'use client'

import { useState } from 'react'
import { useWorkoutStore } from '@/lib/stores/workoutStore'
import { useRestTimerStore } from '@/lib/stores/restTimerStore'

interface SetLoggerProps {
  exerciseId: string
  setNumber: number
  repsTarget: string
  restSeconds: number
  lastWeight?: number
  lastReps?: number
  onSetLogged?: (exerciseId: string, setNumber: number, weight: number, reps: number) => void
}

export function SetLogger({
  exerciseId,
  setNumber,
  repsTarget,
  restSeconds,
  lastWeight,
  lastReps,
  onSetLogged,
}: SetLoggerProps) {
  const { logSet, getSetData } = useWorkoutStore()
  const { startTimer } = useRestTimerStore()

  const currentSet = getSetData(exerciseId, setNumber)

  const [weight, setWeight] = useState<string>(
    currentSet?.weight?.toString() ?? lastWeight?.toString() ?? ''
  )
  const [reps, setReps] = useState<string>(
    currentSet?.reps?.toString() ?? ''
  )

  const isCompleted = currentSet?.completed ?? false

  const handleComplete = () => {
    const w = parseFloat(weight)
    const r = parseInt(reps)

    if (!w || !r) return

    // 1) Atualiza store local (Volume Load + UI imediata)
    logSet(exerciseId, setNumber, w, r)
    // 2) Dispara para API/Dexie via callback do pai
    onSetLogged?.(exerciseId, setNumber, w, r)
    // 3) Inicia timer de descanso
    startTimer(restSeconds)
  }

  return (
    <div
      className={`flex items-center gap-2 p-2 rounded-lg transition-all ${
        isCompleted ? 'bg-green-950/30 opacity-70' : 'bg-muted/30'
      }`}
    >
      {/* Número da série */}
      <span className="w-5 text-xs font-mono text-muted-foreground text-center">
        {setNumber}
      </span>

      {/* Peso (kg) */}
      <div className="flex-1">
        <input
          type="number"
          inputMode="decimal"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder={lastWeight ? `${lastWeight}kg` : 'kg'}
          disabled={isCompleted}
          className="w-full bg-input border border-border rounded-lg px-2 py-1.5 text-sm text-center font-mono focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
        />
      </div>

      <span className="text-muted-foreground text-xs">×</span>

      {/* Reps */}
      <div className="flex-1">
        <input
          type="number"
          inputMode="numeric"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          placeholder={repsTarget}
          disabled={isCompleted}
          className="w-full bg-input border border-border rounded-lg px-2 py-1.5 text-sm text-center font-mono focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
        />
      </div>

      {/* Volume da série */}
      <span className="w-12 text-xs font-mono text-muted-foreground text-right">
        {weight && reps
          ? `${(parseFloat(weight) * parseInt(reps)).toFixed(0)}kg`
          : '—'}
      </span>

      {/* Botão confirmar */}
      <button
        onClick={handleComplete}
        disabled={isCompleted || !weight || !reps}
        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all active:scale-90 ${
          isCompleted
            ? 'bg-green-700 text-white'
            : 'bg-primary text-primary-foreground disabled:opacity-30'
        }`}
      >
        {isCompleted ? '✓' : '→'}
      </button>
    </div>
  )
}
