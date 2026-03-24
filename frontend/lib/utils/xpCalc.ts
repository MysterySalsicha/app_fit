/**
 * Sistema de XP — HunterFit
 * Baseado na spec seção 17
 */

export type ExerciseCategory =
  | 'compound_heavy'   // Supino, Agachamento, Deadlift, OHP
  | 'compound_medium'  // Remada, Leg Press, Hack Squat
  | 'bodyweight'       // Pull-up, Dip, Push-up
  | 'isolation'        // Curl, Extensão, Lateral

// XP base por série por categoria (spec seção 17)
const XP_BASE: Record<ExerciseCategory, number> = {
  compound_heavy: 15,
  compound_medium: 10,
  bodyweight: 12,
  isolation: 7,
}

// Bônus por tipo de dungeon
const DUNGEON_BONUS: Record<string, number> = {
  normal: 0,
  crisis: 0.5,    // +50%
  red_gate: 1.0,  // +100%
  hidden: 0.75,   // +75%
  boss: 2.0,      // +200%
}

interface XpCalcOptions {
  category: ExerciseCategory
  weightKg: number
  reps: number
  sets: number
  prBeaten?: boolean
  dungeonType?: string
  skillMultiplier?: number
  eventMultiplier?: number
}

/**
 * Calcula XP de uma série individual.
 * Fórmula base: XP_base × (1 + weight_kg/100) × reps_factor
 */
export function calcSetXp(
  category: ExerciseCategory,
  weightKg: number,
  reps: number
): number {
  const base = XP_BASE[category]
  const weightFactor = 1 + weightKg / 100
  const repsFactor = reps >= 12 ? 1.1 : reps >= 8 ? 1.0 : 0.9
  return Math.floor(base * weightFactor * repsFactor)
}

/**
 * Calcula XP total de uma sessão de treino.
 */
export function calcSessionXp(options: XpCalcOptions): {
  rawXp: number
  finalXp: number
  multiplier: number
  breakdown: string
} {
  const {
    category,
    weightKg,
    reps,
    sets,
    prBeaten = false,
    dungeonType = 'normal',
    skillMultiplier = 1.0,
    eventMultiplier = 1.0,
  } = options

  // XP raw = soma das séries
  const setXp = calcSetXp(category, weightKg, reps)
  let rawXp = setXp * sets

  // Bônus de PR
  if (prBeaten) {
    rawXp += Math.floor(rawXp * 0.5) // +50% no PR
  }

  // Bônus de dungeon
  const dungeonBonus = DUNGEON_BONUS[dungeonType] ?? 0

  // Multiplicador total
  const multiplier = (1 + dungeonBonus) * skillMultiplier * eventMultiplier

  const finalXp = Math.floor(rawXp * multiplier)

  const breakdown =
    `Base: ${rawXp} XP` +
    (prBeaten ? ' (+PR)' : '') +
    (dungeonBonus > 0 ? ` × ${1 + dungeonBonus} (${dungeonType})` : '') +
    (skillMultiplier !== 1.0 ? ` × ${skillMultiplier} (skill)` : '') +
    (eventMultiplier !== 1.0 ? ` × ${eventMultiplier} (event)` : '')

  return { rawXp, finalXp, multiplier, breakdown }
}

/**
 * XP necessário para passar do nível atual para o próximo.
 */
export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.8))
}

/**
 * Retorna o nível e XP restante dado o total de XP acumulado.
 */
export function resolveLevel(totalXp: number): { level: number; remainingXp: number } {
  let level = 1
  let accumulated = 0

  while (true) {
    const needed = xpForLevel(level + 1)
    if (accumulated + needed > totalXp) {
      return { level, remainingXp: totalXp - accumulated }
    }
    accumulated += needed
    level++

    if (level > 9999) break // safety
  }

  return { level, remainingXp: 0 }
}
