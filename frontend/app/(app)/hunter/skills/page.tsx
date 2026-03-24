'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { api } from '@/lib/api/client'

interface HunterSkill {
  id: string
  skillKey: string
  skillName: string
  skillDescription: string
  skillRank: string   // Common → Rare → Epic → Legendary
  skillType: string   // passive | active | real
  unlockedAt: string
}

interface SkillsResponse {
  skills: HunterSkill[]
}

const SKILL_RANK_COLORS: Record<string, string> = {
  Common:    '#6b7280',
  Rare:      '#3b82f6',
  Epic:      '#a855f7',
  Legendary: '#eab308',
}

const SKILL_TYPE_ICONS: Record<string, string> = {
  passive: '🔷',
  active:  '⚡',
  real:    '🌟',
}

// Skills pré-definidas exibidas como "não desbloqueadas" (inspiração para o usuário)
const LOCKED_SKILLS = [
  { skillKey: 'iron_will',       skillName: 'Iron Will',        skillRank: 'Rare',      skillType: 'passive', skillDescription: '10 treinos seguidos — vontade de ferro.' },
  { skillKey: 'protein_master',  skillName: 'Protein Master',   skillRank: 'Epic',      skillType: 'passive', skillDescription: 'Meta de proteína por 30 dias consecutivos.' },
  { skillKey: 'shadow_sprint',   skillName: 'Shadow Sprint',    skillRank: 'Rare',      skillType: 'active',  skillDescription: '20 sessões de cardio.' },
  { skillKey: 'dungeon_breaker', skillName: 'Dungeon Breaker',  skillRank: 'Epic',      skillType: 'active',  skillDescription: 'Completar 5 Boss Raids.' },
  { skillKey: 'arise',           skillName: 'Arise',            skillRank: 'Legendary', skillType: 'real',    skillDescription: 'Alcançar Rank S.' },
  { skillKey: 'monarch',         skillName: 'Shadow Monarch',   skillRank: 'Legendary', skillType: 'real',    skillDescription: 'Shadow Army nível máximo em todos os shadow.' },
]

export default function HunterSkillsPage() {
  const { data, isLoading } = useQuery<SkillsResponse>({
    queryKey: ['hunter', 'skills'],
    queryFn: () => api.get<SkillsResponse>('api/hunter/skills'),
    staleTime: 60_000,
  })

  const unlocked = data?.skills ?? []
  const unlockedKeys = new Set(unlocked.map((s) => s.skillKey))

  return (
    <div className="px-4 pt-4 pb-8 space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Habilidades</h1>
        <Link href="/hunter" className="text-xs text-muted-foreground border border-border rounded-lg px-3 py-1.5">
          ← Perfil
        </Link>
      </div>

      {/* Habilidades desbloqueadas */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Desbloqueadas ({unlocked.length})
        </h2>
        {isLoading ? (
          <div className="hunter-card h-20 animate-pulse" />
        ) : unlocked.length === 0 ? (
          <div className="hunter-card text-center py-6 text-sm text-muted-foreground">
            Nenhuma habilidade ainda. Continue treinando!
          </div>
        ) : (
          unlocked.map((skill) => (
            <div key={skill.id} className="hunter-card" style={{ borderColor: `${SKILL_RANK_COLORS[skill.skillRank] ?? '#6b7280'}40` }}>
              <div className="flex items-start gap-3">
                <span className="text-xl">{SKILL_TYPE_ICONS[skill.skillType] ?? '⚡'}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-foreground">{skill.skillName}</p>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                      style={{
                        backgroundColor: `${SKILL_RANK_COLORS[skill.skillRank]}20`,
                        color: SKILL_RANK_COLORS[skill.skillRank],
                      }}
                    >
                      {skill.skillRank}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{skill.skillDescription}</p>
                  <p className="text-[10px] text-muted-foreground/50 mt-1">
                    Desbloqueada em {new Date(skill.unlockedAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Habilidades bloqueadas */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Disponíveis para desbloquear
        </h2>
        {LOCKED_SKILLS.filter((s) => !unlockedKeys.has(s.skillKey)).map((skill) => (
          <div key={skill.skillKey} className="hunter-card opacity-50">
            <div className="flex items-start gap-3">
              <span className="text-xl grayscale">{SKILL_TYPE_ICONS[skill.skillType] ?? '⚡'}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-muted-foreground">{skill.skillName}</p>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                    style={{
                      backgroundColor: `${SKILL_RANK_COLORS[skill.skillRank]}20`,
                      color: SKILL_RANK_COLORS[skill.skillRank],
                    }}
                  >
                    {skill.skillRank}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground/70 mt-0.5">{skill.skillDescription}</p>
              </div>
              <span className="text-muted-foreground/40 text-lg">🔒</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
