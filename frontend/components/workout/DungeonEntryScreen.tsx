'use client'

import { motion } from 'framer-motion'

interface DungeonEntryScreenProps {
  dayId: string
  dayLabel?: string
  muscleGroups?: string
  exerciseCount?: number
  dungeonType?: 'normal' | 'crisis' | 'red_gate' | 'hidden' | 'boss'
  onStart: () => void
  isLoading?: boolean
}

const DUNGEON_TYPES = {
  normal:   { label: 'Dungeon Normal',   color: '#6366f1', icon: '⚔️',  xpBonus: 300 },
  crisis:   { label: 'Dungeon de Crise', color: '#ef4444', icon: '🔥',  xpBonus: 500 },
  red_gate: { label: 'Red Gate',         color: '#dc2626', icon: '🚨',  xpBonus: 800 },
  hidden:   { label: 'Dungeon Oculta',   color: '#a855f7', icon: '🌀',  xpBonus: 1200 },
  boss:     { label: 'Boss Raid',        color: '#f97316', icon: '💀',  xpBonus: 3000 },
}

export function DungeonEntryScreen({
  dayId,
  dayLabel = '—',
  muscleGroups = '',
  exerciseCount = 0,
  dungeonType = 'normal',
  onStart,
  isLoading = false,
}: DungeonEntryScreenProps) {
  const dungeon = DUNGEON_TYPES[dungeonType]

  return (
    <div className="dungeon-overlay">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center px-8 max-w-sm mx-auto space-y-6"
      >
        {/* Ícone pulsante */}
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-6xl"
        >
          {dungeon.icon}
        </motion.div>

        {/* Caixa do Sistema */}
        <div className="system-notification">
          <p className="text-xs text-blue-400 mb-1 font-mono uppercase tracking-widest">
            Sistema
          </p>
          <p className="text-base font-bold" style={{ color: dungeon.color }}>
            {dungeon.label} Detectada
          </p>

          {/* Detalhes do treino */}
          <div className="mt-3 space-y-1 text-left">
            <p className="text-sm text-blue-200">
              <span className="text-blue-400 font-semibold">Tipo:</span> {dayLabel}
            </p>
            {muscleGroups && (
              <p className="text-sm text-blue-200">
                <span className="text-blue-400 font-semibold">Músculos:</span> {muscleGroups}
              </p>
            )}
            <p className="text-sm text-blue-200">
              <span className="text-blue-400 font-semibold">Monstros:</span> {exerciseCount} exercícios
            </p>
            <p className="text-sm text-blue-200">
              <span className="text-blue-400 font-semibold">XP Bônus:</span>{' '}
              <span className="text-xp font-mono">+{dungeon.xpBonus}</span>
            </p>
          </div>

          <p className="text-sm text-blue-200 mt-3 italic">
            "O Sistema observa. Você irá enfrentá-la?"
          </p>
        </div>

        {/* Botões */}
        <div className="flex gap-3">
          <button
            onClick={() => window.history.back()}
            className="flex-1 py-3 border border-border rounded-xl text-muted-foreground text-sm"
            disabled={isLoading}
          >
            Não agora
          </button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onStart}
            disabled={isLoading}
            className="flex-1 py-3 rounded-xl font-bold text-white text-sm disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: dungeon.color }}
          >
            {isLoading ? (
              <span className="animate-pulse">Iniciando…</span>
            ) : (
              <>Entrar ⚔️</>
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}
