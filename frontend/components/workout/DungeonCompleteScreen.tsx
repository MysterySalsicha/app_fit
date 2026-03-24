'use client'

import { motion } from 'framer-motion'
import { useWorkoutStore } from '@/lib/stores/workoutStore'

interface DungeonCompleteScreenProps {
  /** Resultado retornado pela API (POST /api/workout/sessions/{id}/finish) */
  result?: {
    xpEarned?: number
    durationSeconds?: number
    volumeLoadKg?: number
    levelResult?: {
      leveledUp?: boolean
      newLevel?: number
      previousLevel?: number
    }
  } | null
  onDone?: () => void
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}min` : `${m}min`
}

export function DungeonCompleteScreen({ result, onDone }: DungeonCompleteScreenProps) {
  const { sessionSummary, totalVolumeLoad } = useWorkoutStore()

  const xpEarned     = result?.xpEarned     ?? sessionSummary?.xpGained ?? 0
  const durationSecs = result?.durationSeconds ?? null
  const volumeKg     = result?.volumeLoadKg  ?? totalVolumeLoad
  const leveledUp    = result?.levelResult?.leveledUp ?? false
  const newLevel     = result?.levelResult?.newLevel

  return (
    <div className="dungeon-overlay">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 max-w-sm mx-auto text-center space-y-6"
      >
        {/* Trophy animado */}
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-7xl"
        >
          {leveledUp ? '🆙' : '🏆'}
        </motion.div>

        {/* Level up banner */}
        {leveledUp && newLevel && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className="bg-amber-500/20 border border-amber-500/40 rounded-xl px-4 py-3"
          >
            <p className="text-amber-400 font-bold text-lg font-mono">LEVEL UP!</p>
            <p className="text-amber-300 text-sm">Nível {newLevel} atingido</p>
          </motion.div>
        )}

        {/* Sistema */}
        <div className="system-notification">
          <p className="text-xs text-blue-400 mb-1 font-mono uppercase tracking-widest">
            Sistema
          </p>
          <p className="text-xl font-bold text-white">Dungeon Cleared!</p>
          <p className="text-sm text-blue-200 mt-1">
            "Você provou ao Sistema que ainda tem mais."
          </p>
        </div>

        {/* Stats */}
        <div className="hunter-card text-left space-y-2">
          {durationSecs != null && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Duração</span>
              <span className="font-mono font-bold text-foreground">
                {formatDuration(durationSecs)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Volume Total</span>
            <span className="font-mono font-bold text-foreground">
              {volumeKg.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kg
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">XP Ganho</span>
            <span className="font-mono font-bold text-xp">
              +{xpEarned.toLocaleString('pt-BR')} XP
            </span>
          </div>
          {sessionSummary?.prBeaten && (
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-amber-400 font-bold text-center">
                ⭐ Novo PR! {sessionSummary.prExercises?.join(', ')}
              </p>
            </div>
          )}
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onDone}
          className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg"
        >
          Voltar ao Dashboard
        </motion.button>
      </motion.div>
    </div>
  )
}
