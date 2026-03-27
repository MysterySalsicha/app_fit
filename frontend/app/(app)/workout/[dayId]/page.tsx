'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { DungeonEntryScreen } from '@/components/workout/DungeonEntryScreen'
import { ExerciseCard } from '@/components/workout/ExerciseCard'
import { WorkoutTimer } from '@/components/workout/WorkoutTimer'
import { VolumeLoadCounter } from '@/components/workout/VolumeLoadCounter'
import { DungeonCompleteScreen } from '@/components/workout/DungeonCompleteScreen'
import { useWorkoutStore } from '@/lib/stores/workoutStore'
import { useHunterStore } from '@/lib/stores/hunterStore'
import { useParams, useRouter } from 'next/navigation'
import { enqueueSyncItem } from '@/lib/db/sync'
import { db } from '@/lib/db/schema'
import { dispatchSystemNotification } from '@/components/shared/SystemNotification'

// ─── Types ────────────────────────────────────────────────────────────────────

interface LastSession {
  date: string
  sets: Array<{ setNumber: number; weightKg: number | null; repsDone: number | null }>
}

interface ExerciseData {
  id: string
  name: string
  sets: number
  reps: string
  restSeconds: number
  gifUrl?: string
  notes?: string
  primaryMuscleGroup?: string
  lastSession: LastSession | null
}

interface DayData {
  planId: string
  dayId: string
  dayLabel: string
  muscleGroups: string
  isRestDay: boolean
  exercises: ExerciseData[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapLastSession(ex: ExerciseData): { weight: number; reps: number } | null {
  if (!ex.lastSession?.sets?.length) return null
  const best = ex.lastSession.sets.reduce((prev, cur) => {
    const prevV = (prev.weightKg ?? 0) * (prev.repsDone ?? 0)
    const curV  = (cur.weightKg  ?? 0) * (cur.repsDone  ?? 0)
    return curV > prevV ? cur : prev
  }, ex.lastSession.sets[0])
  return { weight: best.weightKg ?? 0, reps: best.repsDone ?? 0 }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WorkoutFocusPage() {
  const { dayId } = useParams<{ dayId: string }>()
  const router = useRouter()
  const qc = useQueryClient()
  const { isActive, isComplete, startSession, finishSession, totalVolumeLoad } = useWorkoutStore()
  const { addXp } = useHunterStore()

  // sessionId criado quando o usuário confirma entrar na Dungeon
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [finishResult, setFinishResult] = useState<any>(null)

  // ── Busca os exercícios do dia específico pelo dayId da URL
  // Se dayId for "today" usa o endpoint de hoje, caso contrário usa o endpoint por id
  const { data: dayData, isLoading } = useQuery<DayData>({
    queryKey: ['workout', 'day', dayId],
    queryFn: () =>
      dayId === 'today'
        ? api.get<DayData>('api/workout/today')
        : api.get<DayData>(`api/workout/days/${dayId}`),
    enabled: !isActive && !isComplete,
    staleTime: 5 * 60_000,
  })

  // ── Iniciar sessão (POST /api/workout/sessions)
  const startMutation = useMutation({
    mutationFn: () => api.post<{ sessionId: string }>('api/workout/sessions', {
      dayId: dayData?.dayId ?? dayId,
      dungeonType: 'normal',
    }),
    onSuccess: (data) => {
      setSessionId(data.sessionId)
      startSession()
    },
  })

  // ── Finalizar sessão (POST /api/workout/sessions/{id}/finish)
  const finishMutation = useMutation({
    mutationFn: () => api.post<any>(`api/workout/sessions/${sessionId}/finish`),
    onSuccess: async (result) => {
      setFinishResult(result)
      // Atualiza XP no store local para animação imediata
      if (result.xpEarned) addXp(result.xpEarned)
      finishSession()
      qc.invalidateQueries({ queryKey: ['hunter', 'profile'] })
      qc.invalidateQueries({ queryKey: ['workout', 'history'] })
      // Notifica skills desbloqueadas durante esse treino
      if (result.newSkillsUnlocked?.length) {
        result.newSkillsUnlocked.forEach((skillId: string) => {
          dispatchSystemNotification({
            type: 'skill_unlock',
            title: 'Nova Skill Desbloqueada! 💫',
            message: skillId
              .replace(/_/g, ' ')
              .replace(/\b\w/g, (c: string) => c.toUpperCase()),
          })
        })
        // Invalida a lista de skills para que a página Hunter atualize
        qc.invalidateQueries({ queryKey: ['hunter', 'skills'] })
      }
    },
  })

  // ── Log de série offline-first
  const handleLogSet = useCallback(async (
    exerciseId: string,
    setNumber: number,
    weight: number,
    reps: number
  ) => {
    if (!sessionId) return

    const volumeLoad = weight * reps

    // 1) Persiste set no Dexie (IndexedDB) — sobrevive ao fechar o app
    const setId = crypto.randomUUID()
    await db.exerciseSets.put({
      id: setId,
      sessionId,
      exerciseId,
      setNumber,
      weightKg: weight,
      repsDone: reps,
      volumeLoadKg: volumeLoad,
      completed: true,
      completedAt: new Date().toISOString(),
    })

    // 2) Enfileira na fila de sync para enviar ao backend quando online
    await enqueueSyncItem(
      `api/workout/sessions/${sessionId}/sets`,
      'POST',
      { exerciseId, setNumber, weightKg: weight, repsDone: reps },
      'create'
    )

    // 3) Atualiza store local para feedback visual imediato
    useWorkoutStore.getState().logSet(exerciseId, setNumber, weight, reps)
  }, [sessionId])

  // ─── DungeonEntry ───────────────────────────────────────────────────────────
  if (!isActive && !isComplete) {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-muted-foreground text-sm animate-pulse">Carregando dungeon…</div>
        </div>
      )
    }

    return (
      <DungeonEntryScreen
        dayId={dayId}
        dayLabel={dayData?.dayLabel ?? '—'}
        muscleGroups={dayData?.muscleGroups ?? ''}
        exerciseCount={dayData?.exercises?.length ?? 0}
        onStart={() => startMutation.mutate()}
        isLoading={startMutation.isPending}
      />
    )
  }

  // ─── DungeonComplete ────────────────────────────────────────────────────────
  if (isComplete) {
    return (
      <DungeonCompleteScreen
        result={finishResult}
        onDone={() => {
          useWorkoutStore.getState().resetSession()
          router.push('/dashboard')
        }}
      />
    )
  }

  // ─── Active Workout ─────────────────────────────────────────────────────────
  const exercises = dayData?.exercises ?? []

  return (
    <div className="px-4 pt-4 pb-8 space-y-3 max-w-lg mx-auto">
      {/* Header fixo */}
      <div className="flex items-center justify-between sticky top-0 bg-background py-2 z-10 border-b border-border">
        <WorkoutTimer />
        <VolumeLoadCounter />
      </div>

      {/* Label do treino */}
      {dayData && (
        <div className="text-xs text-muted-foreground px-1">
          <span className="text-foreground font-semibold">{dayData.dayLabel}</span>
          {' · '}
          {dayData.muscleGroups}
        </div>
      )}

      {/* Exercícios */}
      <div className="space-y-3">
        {exercises.map((ex) => (
          <ExerciseCard
            key={ex.id}
            exerciseId={ex.id}
            name={ex.name}
            sets={ex.sets}
            repsTarget={ex.reps}
            restSeconds={ex.restSeconds}
            muscleGroup={ex.primaryMuscleGroup ?? ''}
            gifUrl={ex.gifUrl}
            notes={ex.notes}
            lastSessionSummary={mapLastSession(ex)}
            onSetLogged={handleLogSet}
          />
        ))}
      </div>

      {/* Finalizar */}
      <button
        onClick={() => finishMutation.mutate()}
        disabled={finishMutation.isPending}
        className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg mt-6 active:scale-95 transition-transform disabled:opacity-60"
      >
        {finishMutation.isPending ? 'Finalizando…' : '⚔️ Finalizar Dungeon'}
      </button>
    </div>
  )
}
