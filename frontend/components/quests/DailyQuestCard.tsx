'use client'

import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'

interface QuestModule {
  type: string
  label: string
  completed: boolean
}

interface Quest {
  id: string
  title: string
  questType: string
  xpReward: number
  crystalReward: number
  status: string
  expiresAt?: string
  modulesJson: string
}

function parseModules(json: string): QuestModule[] {
  try {
    const parsed = JSON.parse(json)
    if (Array.isArray(parsed)) return parsed
    return []
  } catch {
    return []
  }
}

function timeRemaining(expiresAt?: string): string {
  if (!expiresAt) return ''
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'Expirada'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  return `${h}h ${m}min`
}

export function DailyQuestCard() {
  const qc = useQueryClient()

  const { data: quests, isLoading } = useQuery<Quest[]>({
    queryKey: ['quests', 'daily'],
    queryFn: () => api.get<{ daily: Quest[] }>('api/quests').then(r => r.daily),
    staleTime: 60_000,
  })

  const completeMutation = useMutation({
    mutationFn: (questId: string) => api.post(`api/quests/${questId}/complete`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quests'] })
      qc.invalidateQueries({ queryKey: ['hunter', 'profile'] })
    },
  })

  if (isLoading) return <div className="hunter-card h-28 animate-pulse" />

  const activeQuests = (quests ?? []).filter(q => q.status === 'active')
  if (activeQuests.length === 0) return null

  const quest = activeQuests[0]
  const modules = parseModules(quest.modulesJson)
  const completed = modules.filter(m => m.completed).length
  const pct = modules.length > 0 ? Math.round((completed / modules.length) * 100) : 0

  return (
    <div className="hunter-card border border-amber-500/20">
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="text-xs text-amber-400 font-mono uppercase tracking-wider">⚔️ Daily Quest</span>
          <h3 className="text-sm font-semibold text-foreground mt-0.5">{quest.title}</h3>
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          {timeRemaining(quest.expiresAt)}
        </span>
      </div>

      {/* Módulos */}
      {modules.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {modules.map((mod, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center text-[9px]
                ${mod.completed ? 'bg-primary border-primary text-primary-foreground' : 'border-primary/40'}`}>
                {mod.completed && '✓'}
              </div>
              <span className={`text-xs ${mod.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                {mod.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Progresso */}
      <div className="w-full h-1.5 bg-muted rounded-full mb-3 overflow-hidden">
        <div
          className="h-full bg-amber-500 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {completed}/{modules.length} módulos
        </span>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-xp">+{quest.xpReward} XP</span>
          {quest.crystalReward > 0 && (
            <span className="text-xs font-mono text-purple-400">+{quest.crystalReward} 💎</span>
          )}
          <Link href="/quests" className="text-xs text-primary border border-primary/30 rounded-lg px-2 py-1">
            Ver todas
          </Link>
        </div>
      </div>
    </div>
  )
}
