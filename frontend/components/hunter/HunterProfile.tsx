'use client'

import { useHunterStore } from '@/lib/stores/hunterStore'
import { getRankColor, getRankGlow } from '@/lib/utils/rankUtils'

export function HunterProfile() {
  const { profile } = useHunterStore()

  if (!profile) return null

  const xpPercent = Math.round((profile.currentXp / profile.xpToNextLevel) * 100)
  const rankColor = getRankColor(profile.hunterRank)
  const rankGlow = getRankGlow(profile.hunterRank)

  return (
    <div
      className="hunter-card"
      style={{ '--glow-color': rankGlow } as React.CSSProperties}
    >
      {/* Rank + Nome */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`rank-${profile.hunterRank.toLowerCase()} text-base`}>
              Rank {profile.hunterRank}
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              #{profile.hunterSubRank}
            </span>
          </div>
          <h2 className="text-lg font-bold text-foreground">{profile.name}</h2>
          <p className="text-xs text-muted-foreground">{profile.hunterClass}</p>
        </div>

        <div className="text-right">
          <p className="text-2xl font-bold font-mono" style={{ color: rankColor }}>
            Lv.{profile.hunterLevel}
          </p>
          <p className="text-xs text-muted-foreground">
            {profile.currentXp.toLocaleString('pt-BR')} XP
          </p>
        </div>
      </div>

      {/* XP Bar */}
      <div className="space-y-1">
        <div className="xp-bar">
          <div
            className="xp-bar-fill"
            style={{ width: `${xpPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground font-mono">
          <span>{profile.currentXp.toLocaleString('pt-BR')}</span>
          <span>{xpPercent}%</span>
          <span>{profile.xpToNextLevel.toLocaleString('pt-BR')}</span>
        </div>
      </div>

      {/* Título equipado */}
      {profile.equippedTitle && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-center text-amber-400 font-mono">
            『{profile.equippedTitle}』
          </p>
        </div>
      )}
    </div>
  )
}
