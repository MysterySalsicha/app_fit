'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { api } from '@/lib/api/client'
import { dispatchSystemNotification } from '@/components/shared/SystemNotification'

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface QuestModule {
  moduleType: string
  targetValue: number
  currentValue: number
  unit: string
}

interface Quest {
  id: string
  questType: 'daily' | 'main' | 'emergency' | 'penalty_rescue' | 'rank_test'
  title: string
  description?: string
  narrative?: string
  status: 'active' | 'completed' | 'failed'
  xpReward: number
  statPointsReward: number
  crystalReward: number
  modules: QuestModule[]
  expiresAt?: string
}

interface QuestsResponse {
  daily: Quest[]
  main: Quest[]
  emergency: Quest[]
  penaltyRescue?: Quest
}

// Configurações visuais por tipo
const QUEST_CONFIGS = {
  daily:         { icon: '📋', color: '#3b82f6', label: 'Diária'        },
  main:          { icon: '⚔️', color: '#a855f7', label: 'Principal'     },
  emergency:     { icon: '🚨', color: '#ef4444', label: 'Emergência'    },
  penalty_rescue:{ icon: '💀', color: '#f97316', label: 'Resgate'       },
  rank_test:     { icon: '👑', color: '#eab308', label: 'Teste de Rank' },
} as const

// ─── Card de quest ────────────────────────────────────────────────────────────
function QuestCard({
  quest,
  onComplete,
  completing,
}: {
  quest: Quest
  onComplete: (id: string) => void
  completing: boolean
}) {
  const cfg = QUEST_CONFIGS[quest.questType] ?? QUEST_CONFIGS.daily
  const isCompleted = quest.status === 'completed'
  const isFailed    = quest.status === 'failed'

  // Verifica se todos os módulos estão completos
  const allComplete = quest.modules.every((m) => m.currentValue >= m.targetValue)

  // Tempo restante
  let timeLeft = ''
  if (quest.expiresAt) {
    const diff = new Date(quest.expiresAt).getTime() - Date.now()
    if (diff > 0) {
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      timeLeft = h > 0 ? `${h}h ${m}min` : `${m}min`
    } else {
      timeLeft = 'Expirada'
    }
  }

  return (
    <div
      className={`hunter-card space-y-3 transition-opacity ${isCompleted ? 'opacity-60' : isFailed ? 'opacity-40' : ''}`}
      style={{ borderColor: isCompleted ? '#22c55e40' : isFailed ? '#ef444440' : `${cfg.color}30` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{cfg.icon}</span>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold text-foreground">{quest.title}</p>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                style={{ backgroundColor: `${cfg.color}20`, color: cfg.color }}
              >
                {cfg.label}
              </span>
            </div>
            {quest.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{quest.description}</p>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          {isCompleted && <span className="text-xs text-green-400">✓ Completa</span>}
          {isFailed    && <span className="text-xs text-red-400">✗ Falhou</span>}
          {!isCompleted && !isFailed && timeLeft && (
            <span className="text-xs text-muted-foreground">{timeLeft}</span>
          )}
        </div>
      </div>

      {/* Narrative */}
      {quest.narrative && (
        <p className="text-xs text-muted-foreground/70 italic border-l-2 border-primary/30 pl-2">
          "{quest.narrative}"
        </p>
      )}

      {/* Módulos (objetivos) */}
      {quest.modules.length > 0 && (
        <div className="space-y-1.5">
          {quest.modules.map((mod, i) => {
            const pct = Math.min(Math.round((mod.currentValue / mod.targetValue) * 100), 100)
            const done = mod.currentValue >= mod.targetValue
            return (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground capitalize">
                    {done ? '✓ ' : ''}{mod.moduleType.replace(/_/g, ' ')}
                  </span>
                  <span className={done ? 'text-green-400' : 'text-foreground'}>
                    {mod.currentValue}/{mod.targetValue} {mod.unit}
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: done ? '#22c55e' : cfg.color }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Recompensas */}
      <div className="flex items-center gap-3 text-xs">
        <span className="text-yellow-400">⭐ +{quest.xpReward.toLocaleString('pt-BR')} XP</span>
        {quest.statPointsReward > 0 && <span className="text-purple-400">+{quest.statPointsReward} pts</span>}
        {quest.crystalReward > 0    && <span className="text-blue-400">💎 +{quest.crystalReward}</span>}
      </div>

      {/* Botão de completar */}
      {!isCompleted && !isFailed && allComplete && (
        <button
          onClick={() => onComplete(quest.id)}
          disabled={completing}
          className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold disabled:opacity-60 active:scale-95 transition-transform"
        >
          {completing ? 'Recebendo recompensa...' : '⚔️ Completar Quest'}
        </button>
      )}
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function QuestsPage() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery<QuestsResponse>({
    queryKey: ['quests'],
    queryFn: () => api.get<QuestsResponse>('api/quests'),
    staleTime: 60_000,
  })

  const completeQuest = useMutation({
    mutationFn: (questId: string) => api.post(`api/quests/${questId}/complete`, {}),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ['quests'] })
      qc.invalidateQueries({ queryKey: ['hunter'] })
      if (res.xpGained) {
        dispatchSystemNotification({
          type: 'xp',
          title: 'Quest Completada!',
          message: `+${res.xpGained.toLocaleString('pt-BR')} XP ganhos`,
        })
      }
    },
  })

  const allQuests = [
    ...(data?.penaltyRescue ? [data.penaltyRescue] : []),
    ...(data?.emergency ?? []),
    ...(data?.daily ?? []),
    ...(data?.main ?? []),
  ]

  const active    = allQuests.filter((q) => q.status === 'active')
  const completed = allQuests.filter((q) => q.status === 'completed')

  return (
    <div className="px-4 pt-4 pb-8 space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Quests</h1>
        <Link href="/hunter" className="text-xs text-muted-foreground border border-border rounded-lg px-3 py-1.5">
          Hunter →
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="hunter-card h-32 animate-pulse" />
          ))}
        </div>
      ) : active.length === 0 && completed.length === 0 ? (
        <div className="hunter-card text-center py-10 text-muted-foreground text-sm">
          Nenhuma quest ativa. Volte amanhã para novas missões!
        </div>
      ) : (
        <>
          {/* Quests ativas */}
          {active.length > 0 && (
            <div className="space-y-3">
              {active.map((q) => (
                <QuestCard
                  key={q.id}
                  quest={q}
                  onComplete={(id) => completeQuest.mutate(id)}
                  completing={completeQuest.isPending}
                />
              ))}
            </div>
          )}

          {/* Quests completadas */}
          {completed.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Completadas hoje ({completed.length})
              </h2>
              {completed.map((q) => (
                <QuestCard
                  key={q.id}
                  quest={q}
                  onComplete={() => {}}
                  completing={false}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
