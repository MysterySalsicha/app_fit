'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'

// Tipos alinhados ao backend GET /api/workout/history
interface SessionRecord {
  id: string
  sessionDate: string
  dayLabel: string
  dungeonType: 'normal' | 'crisis' | 'red_gate' | 'hidden' | 'boss'
  totalDurationSeconds: number | null
  totalVolumeLoadKg: number | null
  xpEarned: number
  dungeonCleared: boolean
  prBeaten: boolean
}

interface HistoryResponse {
  sessions: SessionRecord[]
  total: number
  page: number
  pageSize: number
}

const DUNGEON_LABELS: Record<SessionRecord['dungeonType'], { label: string; color: string; icon: string }> = {
  normal:   { label: 'Normal',    color: 'text-muted-foreground',  icon: '⚔️' },
  crisis:   { label: 'Crise',     color: 'text-red-400',           icon: '🔥' },
  red_gate: { label: 'Red Gate',  color: 'text-red-500',           icon: '🚨' },
  hidden:   { label: 'Oculta',    color: 'text-purple-400',        icon: '🌀' },
  boss:     { label: 'Boss Raid', color: 'text-orange-400',        icon: '💀' },
}

function formatDuration(seconds: number | null) {
  if (!seconds) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}min` : `${m}min`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    weekday: 'short', day: '2-digit', month: 'short',
  })
}

// ─── Resumo semanal ────────────────────────────────────────────────────────
function WeeklySummary({ sessions }: { sessions: SessionRecord[] }) {
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const recent = sessions.filter((s) => new Date(s.sessionDate) >= weekAgo)

  const totalXp  = recent.reduce((a, s) => a + s.xpEarned, 0)
  const totalVol = recent.reduce((a, s) => a + (s.totalVolumeLoadKg ?? 0), 0)
  const cleared  = recent.filter((s) => s.dungeonCleared).length

  return (
    <div className="hunter-card">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Últimos 7 dias
      </h2>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-lg font-bold text-xp font-mono">+{totalXp.toLocaleString('pt-BR')}</p>
          <p className="text-xs text-muted-foreground">XP ganho</p>
        </div>
        <div>
          <p className="text-lg font-bold text-foreground font-mono">{cleared}</p>
          <p className="text-xs text-muted-foreground">Dungeons</p>
        </div>
        <div>
          <p className="text-lg font-bold text-foreground font-mono">
            {(totalVol / 1000).toFixed(1)}t
          </p>
          <p className="text-xs text-muted-foreground">Volume</p>
        </div>
      </div>
    </div>
  )
}

export default function WorkoutHistoryPage() {
  const [filter, setFilter] = useState<'all' | 'pr' | 'boss'>('all')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 20

  const { data, isLoading, isError } = useQuery<HistoryResponse>({
    queryKey: ['workout', 'history', page],
    queryFn: () => api.get(`api/workout/history?page=${page}&pageSize=${PAGE_SIZE}`),
    placeholderData: (prev) => prev,
  })

  const sessions = data?.sessions ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const filtered = sessions.filter((s) => {
    if (filter === 'pr') return s.prBeaten
    if (filter === 'boss') return s.dungeonType === 'boss' || s.dungeonType === 'crisis'
    return true
  })

  return (
    <div className="px-4 pt-4 pb-8 space-y-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Histórico</h1>
        <Link href="/workout" className="text-xs text-muted-foreground border border-border rounded-lg px-3 py-1.5">
          ← Treinos
        </Link>
      </div>

      {/* Resumo semanal */}
      {sessions.length > 0 && <WeeklySummary sessions={sessions} />}

      {/* Filtros */}
      <div className="flex gap-2">
        {[
          { key: 'all', label: 'Todos' },
          { key: 'pr', label: '🏆 PRs' },
          { key: 'boss', label: '🔥 Raids' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key as typeof filter)}
            className={`flex-1 py-2 text-xs font-medium rounded-xl transition-all ${
              filter === key
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Loading / Error */}
      {isLoading && (
        <div className="text-center text-muted-foreground text-sm py-12 animate-pulse">
          Carregando histórico…
        </div>
      )}

      {isError && (
        <div className="hunter-card border-destructive/30 text-center text-sm text-destructive py-6">
          Erro ao carregar histórico. Tente novamente.
        </div>
      )}

      {/* Lista de sessões */}
      {!isLoading && (
        <div className="space-y-3">
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">Nenhuma sessão encontrada.</p>
          )}

          {filtered.map((session) => {
            const dungeonKey = (session.dungeonType ?? 'normal') as SessionRecord['dungeonType']
            const dungeon = DUNGEON_LABELS[dungeonKey] ?? DUNGEON_LABELS.normal

            return (
              <div key={session.id} className="hunter-card space-y-3">
                {/* Row 1: Data + dungeon type */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{formatDate(session.sessionDate)}</p>
                    <p className="text-sm font-semibold text-foreground mt-0.5">
                      {session.dayLabel || '—'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs font-medium ${dungeon.color}`}>
                      {dungeon.icon} {dungeon.label}
                    </span>
                    {session.dungeonCleared ? (
                      <span className="text-xs text-green-400">✓ Cleared</span>
                    ) : (
                      <span className="text-xs text-red-400/70">✗ Incompleta</span>
                    )}
                  </div>
                </div>

                {/* Row 2: Stats */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
                  <div className="text-center">
                    <p className="text-sm font-bold font-mono text-foreground">
                      {formatDuration(session.totalDurationSeconds)}
                    </p>
                    <p className="text-xs text-muted-foreground">duração</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold font-mono text-foreground">
                      {session.totalVolumeLoadKg != null
                        ? `${(session.totalVolumeLoadKg / 1000).toFixed(1)}t`
                        : '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">volume</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold font-mono text-xp">
                      +{session.xpEarned.toLocaleString('pt-BR')}
                    </p>
                    <p className="text-xs text-muted-foreground">XP</p>
                  </div>
                </div>

                {/* PR badge */}
                {session.prBeaten && (
                  <div className="flex items-center gap-1.5 bg-amber-900/30 border border-amber-700/40 rounded-lg px-2.5 py-1.5">
                    <span className="text-amber-400 text-xs">🏆 Novo Personal Record nesta sessão</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="text-xs text-muted-foreground border border-border rounded-lg px-3 py-1.5 disabled:opacity-40"
          >
            ← Anterior
          </button>
          <span className="text-xs text-muted-foreground">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="text-xs text-muted-foreground border border-border rounded-lg px-3 py-1.5 disabled:opacity-40"
          >
            Próximo →
          </button>
        </div>
      )}
    </div>
  )
}
