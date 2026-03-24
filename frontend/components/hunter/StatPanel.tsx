'use client'

import { useHunterStore } from '@/lib/stores/hunterStore'

type Stat = {
  key: 'str' | 'vit' | 'agi' | 'int' | 'per'
  label: string
  color: string
  description: string
}

const STATS: Stat[] = [
  { key: 'str', label: 'STR', color: '#ef4444', description: 'Força — Volume de treino pesado' },
  { key: 'vit', label: 'VIT', color: '#22c55e', description: 'Vitalidade — Consistência e recuperação' },
  { key: 'agi', label: 'AGI', color: '#3b82f6', description: 'Agilidade — Cardio e mobilidade' },
  { key: 'int', label: 'INT', color: '#a855f7', description: 'Inteligência — Nutrição e planejamento' },
  { key: 'per', label: 'PER', color: '#f97316', description: 'Percepção — PRs e melhoria de performance' },
]

export function StatPanel() {
  const { profile } = useHunterStore()

  if (!profile) return null

  const stats = {
    str: profile.statStr,
    vit: profile.statVit,
    agi: profile.statAgi,
    int: profile.statInt,
    per: profile.statPer,
  }

  const maxStat = Math.max(...Object.values(stats), 100)

  return (
    <div className="hunter-card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Atributos</h3>
        {profile.statPointsAvailable > 0 && (
          <button className="text-xs bg-primary/20 text-primary rounded-lg px-2 py-1 border border-primary/30">
            +{profile.statPointsAvailable} pts disponíveis
          </button>
        )}
      </div>

      <div className="space-y-3">
        {STATS.map((stat) => {
          const value = stats[stat.key]
          const pct = Math.round((value / maxStat) * 100)

          return (
            <div key={stat.key} className="stat-bar">
              <span
                className="w-8 text-xs font-bold font-mono"
                style={{ color: stat.color }}
              >
                {stat.label}
              </span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, backgroundColor: stat.color }}
                />
              </div>
              <span className="w-8 text-right text-xs font-mono text-muted-foreground">
                {value}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
