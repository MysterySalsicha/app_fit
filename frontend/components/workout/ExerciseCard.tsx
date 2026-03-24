'use client'

import { useState } from 'react'
import { SetLogger } from './SetLogger'
import { useWorkoutStore } from '@/lib/stores/workoutStore'

interface ExerciseCardProps {
  exerciseId: string
  name: string
  sets: number
  repsTarget: string
  restSeconds: number
  muscleGroup: string
  gifUrl?: string
  notes?: string
  /** Dados da última sessão deste exercício (vem da API) */
  lastSessionSummary?: { weight: number; reps: number } | null
  /** Callback disparado após logSet para enviar para API/Dexie */
  onSetLogged?: (exerciseId: string, setNumber: number, weight: number, reps: number) => void
}

export function ExerciseCard({
  exerciseId,
  name,
  sets,
  repsTarget,
  restSeconds,
  muscleGroup,
  gifUrl,
  notes,
  lastSessionSummary,
  onSetLogged,
}: ExerciseCardProps) {
  const [expanded, setExpanded] = useState(false)
  const { getExerciseSets } = useWorkoutStore()

  const currentSets   = getExerciseSets(exerciseId)
  const completedCount = currentSets.filter((s) => s.completed).length
  const allDone       = completedCount >= sets

  return (
    <div
      className={`hunter-card transition-all ${
        allDone ? 'border-green-700/50 bg-green-950/20' : ''
      }`}
    >
      {/* Header */}
      <div
        className="flex items-start justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">{name}</h3>
            {allDone && <span className="text-green-400 text-xs">✓</span>}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {sets} séries · {repsTarget} reps · {restSeconds}s descanso
          </p>
          {lastSessionSummary && (
            <p className="text-xs text-indigo-400/70 mt-0.5">
              Último: {lastSessionSummary.weight}kg × {lastSessionSummary.reps}
            </p>
          )}
        </div>

        {/* Progresso dots */}
        <div className="flex items-center gap-1">
          {Array.from({ length: sets }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i < completedCount ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Set loggers (expandidos) */}
      {expanded && (
        <div className="mt-3 space-y-2 pt-3 border-t border-border">
          {Array.from({ length: sets }).map((_, i) => (
            <SetLogger
              key={i}
              exerciseId={exerciseId}
              setNumber={i + 1}
              repsTarget={repsTarget}
              restSeconds={restSeconds}
              lastWeight={lastSessionSummary?.weight}
              lastReps={lastSessionSummary?.reps}
              onSetLogged={onSetLogged}
            />
          ))}

          {notes && (
            <p className="text-xs text-muted-foreground italic pt-1">{notes}</p>
          )}
        </div>
      )}
    </div>
  )
}
