'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { motion } from 'framer-motion'

interface WorkoutDay {
  id: string
  dayNumber: number
  dayLabel: string
  muscleGroups: string
  isRestDay: boolean
  cardioRequired: boolean
  exercises?: { id: string }[]
}

interface WorkoutPlan {
  id: string
  name: string
  days: WorkoutDay[]
}

const DUNGEON_ICONS: Record<string, string> = {
  push: '⚔️',
  pull: '🏹',
  legs: '🦵',
  upper: '💪',
  lower: '🦶',
  cardio: '🏃',
  full: '🔥',
  rest: '🌙',
}

function getDungeonIcon(label: string): string {
  const lower = label.toLowerCase()
  if (lower.includes('push')) return DUNGEON_ICONS.push
  if (lower.includes('pull')) return DUNGEON_ICONS.pull
  if (lower.includes('legs') || lower.includes('perna')) return DUNGEON_ICONS.legs
  if (lower.includes('upper') || lower.includes('superior')) return DUNGEON_ICONS.upper
  if (lower.includes('lower') || lower.includes('inferior')) return DUNGEON_ICONS.lower
  if (lower.includes('cardio') || lower.includes('mobilidade')) return DUNGEON_ICONS.cardio
  if (lower.includes('rest') || lower.includes('descanso')) return DUNGEON_ICONS.rest
  return DUNGEON_ICONS.full
}

export default function WorkoutPage() {
  const { data: plans, isLoading, isError } = useQuery<WorkoutPlan[]>({
    queryKey: ['workout', 'plans'],
    queryFn: () => api.get<WorkoutPlan[]>('api/workout/plans'),
    staleTime: 60_000,
  })

  // Use the first (most recent) active plan
  const activePlan = plans?.[0]
  const days = activePlan?.days?.sort((a, b) => a.dayNumber - b.dayNumber) ?? []

  return (
    <div className="px-4 pt-4 pb-24 space-y-3 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold">Treinos</h1>
          {activePlan && (
            <p className="text-xs text-muted-foreground mt-0.5">{activePlan.name}</p>
          )}
        </div>
        <Link
          href="/workout/history"
          className="text-xs text-muted-foreground border border-border rounded-lg px-3 py-1.5"
        >
          Histórico
        </Link>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="hunter-card animate-pulse h-16 bg-muted/20" />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && !isLoading && (
        <div className="hunter-card border-destructive/40 text-center py-6">
          <p className="text-sm text-muted-foreground">
            Não foi possível carregar os treinos.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Verifique sua conexão e tente novamente.
          </p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && days.length === 0 && (
        <div className="system-notification text-center py-8">
          <p className="text-3xl mb-3">⚔️</p>
          <p className="text-sm font-bold text-white">NENHUM PLANO ENCONTRADO</p>
          <p className="text-xs text-blue-200 mt-1">
            Importe seu plano de treino para começar sua jornada.
          </p>
        </div>
      )}

      {/* Workout days */}
      {days.map((day, i) => (
        <motion.div
          key={day.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <Link href={day.isRestDay ? '#' : `/workout/${day.id}`}>
            <div
              className={`hunter-card flex items-center gap-3 cursor-pointer transition-all active:scale-95 ${
                day.isRestDay
                  ? 'opacity-40 cursor-default'
                  : 'hover:border-primary/50'
              }`}
            >
              {/* Icon */}
              <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center text-lg shrink-0">
                {getDungeonIcon(day.dayLabel)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {day.dayLabel}
                </p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {day.isRestDay
                    ? 'Dia de descanso'
                    : day.muscleGroups || `Dia ${day.dayNumber}`}
                </p>
              </div>

              {/* Right side */}
              {!day.isRestDay && (
                <div className="flex items-center gap-2 shrink-0">
                  {(day.exercises?.length ?? 0) > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {day.exercises!.length} ex
                    </span>
                  )}
                  <span className="text-primary">▶</span>
                </div>
              )}
            </div>
          </Link>
        </motion.div>
      ))}

      {/* Import plan button */}
      <Link href="/import">
        <div className="hunter-card border-dashed border-2 border-border flex items-center justify-center gap-2 py-4 text-muted-foreground text-sm cursor-pointer hover:border-primary/50 transition-colors mt-2">
          <span className="text-lg">+</span>
          <span>Importar plano de treino (.txt)</span>
        </div>
      </Link>
    </div>
  )
}
