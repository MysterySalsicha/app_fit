'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'

// 17 grupos musculares conforme spec seção 15
const MUSCLE_GROUPS = [
  { key: 'chest', name: 'Peito', icon: '💪' },
  { key: 'back_lat', name: 'Costas (Lat)', icon: '🔙' },
  { key: 'back_mid', name: 'Costas (Mid)', icon: '🔙' },
  { key: 'shoulders', name: 'Ombros', icon: '🏋️' },
  { key: 'biceps', name: 'Bíceps', icon: '💪' },
  { key: 'triceps', name: 'Tríceps', icon: '💪' },
  { key: 'forearms', name: 'Antebraços', icon: '🤜' },
  { key: 'quads', name: 'Quadríceps', icon: '🦵' },
  { key: 'hamstrings', name: 'Isquiotibiais', icon: '🦵' },
  { key: 'glutes', name: 'Glúteos', icon: '🍑' },
  { key: 'calves', name: 'Panturrilha', icon: '🦵' },
  { key: 'abs', name: 'Abdômen', icon: '🔶' },
  { key: 'obliques', name: 'Oblíquos', icon: '🔶' },
  { key: 'traps', name: 'Trapézio', icon: '🏋️' },
  { key: 'neck', name: 'Pescoço', icon: '🦒' },
  { key: 'hip_flexors', name: 'Flexores do Quadril', icon: '🦵' },
  { key: 'cardio', name: 'Cardio (AGI)', icon: '❤️' },
]

// Ranks musculares (spec seção 15)
export const MUSCLE_RANKS = [
  'Untrained', 'Beginner', 'Novice', 'Intermediate',
  'Advanced', 'Elite', 'Master', 'Grandmaster',
  'National', 'World Class', 'Legendary', 'Mythic',
  'Transcendent', 'Divine', 'Absolute', 'Legend',
]

function getRankBadgeClass(rank: string) {
  const idx = MUSCLE_RANKS.indexOf(rank)
  if (idx <= 0) return 'text-gray-500'
  if (idx <= 2) return 'text-green-400'
  if (idx <= 5) return 'text-blue-400'
  if (idx <= 8) return 'text-purple-400'
  if (idx <= 11) return 'text-orange-400'
  return 'text-yellow-400'
}

interface MuscleRankMapProps {
  preview?: boolean
}

export function MuscleRankMap({ preview = false }: MuscleRankMapProps) {
  const { data } = useQuery<{ muscles: { muscleGroup: string; muscleRank: string }[] }>({
    queryKey: ['hunter', 'muscles'],
    queryFn: () => api.get('api/hunter/muscle-ranks'),
    staleTime: 5 * 60 * 1000, // 5 min
  })

  // Build lookup map: muscleGroup → rankValue
  // Backend retorna "muscleRank" (não "muscleRankValue")
  const rankMap: Record<string, string> = {}
  for (const m of data?.muscles ?? []) {
    rankMap[m.muscleGroup] = m.muscleRank
  }

  const displayGroups = preview ? MUSCLE_GROUPS.slice(0, 6) : MUSCLE_GROUPS

  return (
    <div className="hunter-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Rank Muscular</h3>
        <span className="text-xs text-muted-foreground">17 grupos</span>
      </div>

      <div className="space-y-2">
        {displayGroups.map((muscle) => {
          const rank = rankMap[muscle.key] ?? 'Untrained'
          const rankClass = getRankBadgeClass(rank)

          return (
            <div key={muscle.key} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <span className="text-sm">{muscle.icon}</span>
                <span className="text-sm text-foreground">{muscle.name}</span>
              </div>
              <span className={`text-xs font-mono font-semibold ${rankClass}`}>
                {rank}
              </span>
            </div>
          )
        })}

        {preview && (
          <p className="text-xs text-center text-muted-foreground pt-2">
            +{MUSCLE_GROUPS.length - 6} grupos • Ver tudo →
          </p>
        )}
      </div>
    </div>
  )
}
