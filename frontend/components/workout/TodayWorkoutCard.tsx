'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { motion } from 'framer-motion'

interface TodayWorkout {
  dayId: string
  dayLabel: string
  muscleGroups: string
  isRestDay: boolean
  cardioRequired: boolean
  exercises: { id: string }[]
}

export function TodayWorkoutCard() {
  const { data, isLoading, isError } = useQuery<TodayWorkout>({
    queryKey: ['workout', 'today'],
    queryFn: () => api.get<TodayWorkout>('api/workout/today'),
    staleTime: 5 * 60_000,
    retry: 1,
  })

  // Loading skeleton
  if (isLoading) {
    return <div className="hunter-card h-20 animate-pulse bg-muted/20" />
  }

  // Erro ou sem plano — não mostra o card para não poluir o dashboard
  if (isError || !data) return null

  // Dia de descanso — card mais suave
  if (data.isRestDay) {
    return (
      <div className="hunter-card flex items-center gap-3 opacity-70">
        <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center text-xl shrink-0">
          🌙
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono">Hoje</p>
          <p className="text-sm font-semibold text-foreground">{data.dayLabel}</p>
          <p className="text-xs text-muted-foreground">Dia de descanso — recuperação ativa</p>
        </div>
      </div>
    )
  }

  // Treino ativo — card proeminente com CTA
  return (
    <Link href={`/workout/${data.dayId}`}>
      <motion.div
        whileTap={{ scale: 0.98 }}
        className="hunter-card border-primary/40 bg-primary/5 flex items-center gap-3 cursor-pointer hover:border-primary/70 transition-colors"
      >
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-xl shrink-0">
          ⚔️
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-primary uppercase tracking-wider font-mono font-bold">Treino de hoje</p>
          <p className="text-sm font-bold text-foreground truncate">{data.dayLabel}</p>
          <p className="text-xs text-muted-foreground truncate">
            {data.muscleGroups || 'Treino do dia'} · {data.exercises.length} exercício{data.exercises.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="shrink-0 flex flex-col items-center gap-0.5">
          <span className="text-primary text-lg leading-none">▶</span>
          <span className="text-xs text-primary font-bold">Entrar</span>
        </div>
      </motion.div>
    </Link>
  )
}
