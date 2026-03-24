'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { useState } from 'react'
import { api } from '@/lib/api/client'

// ─── Classes (spec seção 17) ──────────────────────────────────────────────────
const HUNTER_CLASSES = [
  {
    id: 'Balance Warrior',
    icon: '⚖️',
    color: '#a78bfa',
    description: 'Equilíbrio entre força, resistência e agilidade.',
    bonuses: ['STR +5%', 'VIT +5%', 'AGI +5%'],
    ideal: 'Iniciantes e atletas completos',
    requirement: 'Nenhum',
  },
  {
    id: 'Berserker',
    icon: '🔥',
    color: '#ef4444',
    description: 'Máximo volume de treino e carga. Dor é progresso.',
    bonuses: ['STR +20%', 'XP +15% em treinos pesados'],
    ideal: 'Foco em hipertrofia e força máxima',
    requirement: 'STR ≥ 30',
  },
  {
    id: 'Iron Body',
    icon: '🛡️',
    color: '#22c55e',
    description: 'Saúde, resistência e longevidade. Ferro por dentro.',
    bonuses: ['VIT +20%', 'Penalidade reduzida em 50%'],
    ideal: 'Foco em saúde e consistência',
    requirement: 'VIT ≥ 25',
  },
  {
    id: 'Shadow Runner',
    icon: '💨',
    color: '#38bdf8',
    description: 'Velocidade, cardio e mobilidade. Fang sempre ativo.',
    bonuses: ['AGI +20%', 'XP +25% em cardio'],
    ideal: 'Atletas de endurance e cardio',
    requirement: 'AGI ≥ 20',
  },
  {
    id: 'Mind Master',
    icon: '🔮',
    color: '#a855f7',
    description: 'Mente sã em corpo são. Foco e disciplina máximos.',
    bonuses: ['INT +20%', 'XP +10% em quests completadas'],
    ideal: 'Foco em disciplina e nutrição perfeita',
    requirement: 'INT ≥ 25',
  },
  {
    id: 'Absolute Warrior',
    icon: '👑',
    color: '#eab308',
    description: 'A classe suprema. Domínio em todos os aspectos.',
    bonuses: ['Todos atributos +10%', 'XP +20% em tudo'],
    ideal: 'Hunters em Rank A ou superior',
    requirement: 'Rank A+, todos stats ≥ 50',
  },
] as const

interface HunterClassResponse {
  currentClass: string
  classChangesThisMonth: number
}

export default function HunterClassesPage() {
  const qc = useQueryClient()
  const [selected, setSelected] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const { data } = useQuery<HunterClassResponse>({
    queryKey: ['hunter', 'class'],
    queryFn: () => api.get<HunterClassResponse>('api/hunter/class'),
    staleTime: 60_000,
  })

  const changeClass = useMutation({
    mutationFn: (newClass: string) => api.post('api/hunter/class', { hunterClass: newClass }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hunter'] })
      setShowConfirm(false)
      setSelected(null)
    },
  })

  const current = data?.currentClass ?? 'Balance Warrior'
  const changesLeft = Math.max(0, 1 - (data?.classChangesThisMonth ?? 0))

  return (
    <div className="px-4 pt-4 pb-8 space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Classes do Hunter</h1>
        <Link href="/hunter" className="text-xs text-muted-foreground border border-border rounded-lg px-3 py-1.5">
          ← Perfil
        </Link>
      </div>

      <div className="hunter-card text-xs text-muted-foreground">
        Classe atual: <span className="text-foreground font-bold">{current}</span>
        {changesLeft === 0
          ? ' · Mudança mensal já utilizada'
          : ' · 1 mudança disponível este mês'}
      </div>

      {/* Classes */}
      <div className="space-y-3">
        {HUNTER_CLASSES.map((cls) => {
          const isCurrent  = cls.id === current
          const isSelected = cls.id === selected
          return (
            <div
              key={cls.id}
              onClick={() => !isCurrent && setSelected(cls.id)}
              className={`hunter-card cursor-pointer transition-all ${
                isCurrent
                  ? 'border-2 opacity-100'
                  : isSelected
                  ? 'border-2'
                  : 'hover:border-border/80 opacity-80'
              }`}
              style={{ borderColor: isCurrent || isSelected ? cls.color : undefined }}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{cls.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold" style={{ color: cls.color }}>{cls.id}</p>
                    {isCurrent && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                        style={{ backgroundColor: `${cls.color}20`, color: cls.color }}>
                        ATUAL
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{cls.description}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {cls.bonuses.map((b) => (
                      <span key={b} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{b}</span>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">Req: {cls.requirement}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Botão de confirmação */}
      {selected && selected !== current && (
        <div className="hunter-card border-primary/40 space-y-3">
          <p className="text-sm text-foreground">
            Mudar para <span className="font-bold">{selected}</span>?
          </p>
          {changesLeft === 0 ? (
            <p className="text-xs text-red-400">Você já usou sua mudança mensal.</p>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setSelected(null)}
                className="flex-1 py-2.5 border border-border rounded-xl text-sm text-muted-foreground"
              >
                Cancelar
              </button>
              <button
                onClick={() => changeClass.mutate(selected)}
                disabled={changeClass.isPending}
                className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold disabled:opacity-60"
              >
                {changeClass.isPending ? 'Mudando...' : 'Confirmar'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
