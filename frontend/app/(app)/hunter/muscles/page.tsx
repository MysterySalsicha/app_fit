'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { api } from '@/lib/api/client'

interface MuscleRankEntry {
  muscleGroup: string
  muscleNamePt: string
  muscleRank: string
  muscleRankNumeric: number
  totalVolume30d: number
  sessions30d: number
  bestExercisePrKg?: number
  bestExerciseName?: string
}

interface MuscleRankResponse {
  muscles: MuscleRankEntry[]
}

const RANK_ORDER = ['Untrained', 'Beginner', 'Intermediate', 'Advanced', 'Elite', 'Master', 'Legend']
const RANK_COLORS: Record<string, string> = {
  Untrained:    '#374151',
  Beginner:     '#6b7280',
  Intermediate: '#3b82f6',
  Advanced:     '#22c55e',
  Elite:        '#a855f7',
  Master:       '#f97316',
  Legend:       '#eab308',
}

// Grupos musculares com ícones e nomes PT-BR
const MUSCLE_GROUPS = [
  { key: 'chest',          namePt: 'Peito',         icon: '🫁' },
  { key: 'upper_back',     namePt: 'Costas (sup)',   icon: '🔙' },
  { key: 'lower_back',     namePt: 'Lombar',         icon: '💪' },
  { key: 'shoulders',      namePt: 'Ombros',         icon: '🦾' },
  { key: 'biceps',         namePt: 'Bíceps',         icon: '💪' },
  { key: 'triceps',        namePt: 'Tríceps',        icon: '💪' },
  { key: 'forearms',       namePt: 'Antebraços',     icon: '🖐️' },
  { key: 'core',           namePt: 'Core/Abdômen',   icon: '🔥' },
  { key: 'quadriceps',     namePt: 'Quadríceps',     icon: '🦵' },
  { key: 'hamstrings',     namePt: 'Posteriores',    icon: '🦵' },
  { key: 'glutes',         namePt: 'Glúteos',        icon: '🍑' },
  { key: 'calves',         namePt: 'Panturrilha',    icon: '🦵' },
  { key: 'hip_flexors',    namePt: 'Flexores do Q.', icon: '🦴' },
  { key: 'neck',           namePt: 'Pescoço',        icon: '🎯' },
  { key: 'inner_chest',    namePt: 'Peito Med.',     icon: '🫀' },
  { key: 'serratus',       namePt: 'Serrátil',       icon: '🗡️' },
  { key: 'rotator_cuff',   namePt: 'Manguito',       icon: '🔄' },
] as const

export default function MuscleRankPage() {
  const { data, isLoading } = useQuery<MuscleRankResponse>({
    queryKey: ['hunter', 'muscle-ranks'],
    queryFn: () => api.get<MuscleRankResponse>('api/hunter/muscle-ranks'),
    staleTime: 60_000,
  })

  const muscleMap = new Map(
    (data?.muscles ?? []).map((m) => [m.muscleGroup, m])
  )

  return (
    <div className="px-4 pt-4 pb-8 space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Rank Muscular</h1>
        <Link href="/hunter" className="text-xs text-muted-foreground border border-border rounded-lg px-3 py-1.5">
          ← Perfil
        </Link>
      </div>

      {/* Legenda de ranks */}
      <div className="hunter-card">
        <p className="text-xs text-muted-foreground mb-2">Escala de ranks</p>
        <div className="flex flex-wrap gap-1">
          {RANK_ORDER.map((rank) => (
            <span
              key={rank}
              className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
              style={{ backgroundColor: `${RANK_COLORS[rank]}20`, color: RANK_COLORS[rank] }}
            >
              {rank}
            </span>
          ))}
        </div>
      </div>

      {/* Grid de grupos musculares */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="hunter-card h-16 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {MUSCLE_GROUPS.map(({ key, namePt, icon }) => {
            const muscle = muscleMap.get(key)
            const rank   = muscle?.muscleRank ?? 'Untrained'
            const pct    = ((RANK_ORDER.indexOf(rank) / (RANK_ORDER.length - 1)) * 100).toFixed(0)
            const color  = RANK_COLORS[rank] ?? '#374151'
            const vol    = muscle?.totalVolume30d ?? 0

            return (
              <div key={key} className="hunter-card space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{icon}</span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{namePt}</p>
                      {muscle?.bestExerciseName && (
                        <p className="text-[10px] text-muted-foreground">
                          PR: {muscle.bestExerciseName} · {muscle.bestExercisePrKg}kg
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${color}20`, color }}
                    >
                      {rank}
                    </span>
                    {vol > 0 && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {(vol / 1000).toFixed(1)}t / 30d
                      </p>
                    )}
                  </div>
                </div>

                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
