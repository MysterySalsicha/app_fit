'use client'

import { useHunterStore } from '@/lib/stores/hunterStore'

type Shadow = {
  key: 'igris' | 'tank' | 'iron' | 'fang'
  name: string
  title: string
  streakType: string
  color: string
  icon: string
}

const SHADOWS: Shadow[] = [
  {
    key: 'igris',
    name: 'Igris',
    title: 'Knight',
    streakType: 'Treino',
    color: '#dc2626',
    icon: '⚔️',
  },
  {
    key: 'tank',
    name: 'Tank',
    title: 'Shield',
    streakType: 'Volume',
    color: '#16a34a',
    icon: '🛡️',
  },
  {
    key: 'iron',
    name: 'Iron',
    title: 'Mage',
    streakType: 'Nutrição',
    color: '#ca8a04',
    icon: '🔥',
  },
  {
    key: 'fang',
    name: 'Fang',
    title: 'Scout',
    streakType: 'Cardio',
    color: '#2563eb',
    icon: '💨',
  },
]

interface ShadowArmyProps {
  detailed?: boolean
}

export function ShadowArmy({ detailed = false }: ShadowArmyProps) {
  const { profile } = useHunterStore()

  if (!profile) return null

  const levels = {
    igris: profile.shadowIgrisLevel,
    tank: profile.shadowTankLevel,
    iron: profile.shadowIronLevel,
    fang: profile.shadowFangLevel,
  }

  return (
    <div className="hunter-card">
      <h3 className="text-sm font-semibold text-foreground mb-3">Shadow Army</h3>

      <div className="grid grid-cols-4 gap-2">
        {SHADOWS.map((shadow) => {
          const level = levels[shadow.key]
          const isActive = level > 0

          return (
            <div
              key={shadow.key}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                isActive ? 'bg-muted/80' : 'bg-muted/30 opacity-50'
              }`}
            >
              <div
                className={`text-2xl ${isActive ? '' : 'grayscale opacity-40'}`}
                style={{ filter: isActive ? `drop-shadow(0 0 6px ${shadow.color})` : undefined }}
              >
                {shadow.icon}
              </div>
              <p
                className="text-xs font-bold"
                style={{ color: isActive ? shadow.color : undefined }}
              >
                {shadow.name}
              </p>
              <p className="text-xs font-mono text-muted-foreground">
                Lv.{level}
              </p>
              {detailed && (
                <p className="text-[10px] text-center text-muted-foreground leading-tight">
                  {shadow.streakType}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
