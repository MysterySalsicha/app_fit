import Dexie, { type Table } from 'dexie'

// ─── Tipos locais (espelho simplificado das entidades do backend) ───────────

export interface LocalWorkoutDay {
  id: string
  planId: string
  dayNumber: number
  dayLabel: string
  muscleGroups: string
  primaryMuscleGroup?: string
  isRestDay: boolean
  cardioRequired: boolean
  cardioMinMinutes: number
}

export interface LocalExercise {
  id: string
  dayId: string
  name: string
  sets: number
  reps: string
  restSeconds: number
  gifUrl?: string
  notes?: string
  orderIndex: number
  primaryMuscleGroup?: string
  lastSessionData?: {
    weight: number
    reps: number
    date: string
  }
}

export interface LocalWorkoutSession {
  id: string
  dayId: string
  sessionDate: string   // ISO date string
  startedAt?: string
  finishedAt?: string
  totalDurationSeconds?: number
  totalVolumeLoadKg?: number
  xpEarned: number
  prBeaten: boolean
  syncStatus: 'synced' | 'pending_sync' | 'offline'
  offlinePayload?: object
}

export interface LocalExerciseSet {
  id: string
  sessionId: string
  exerciseId: string
  setNumber: number
  weightKg?: number
  repsDone?: number
  volumeLoadKg?: number
  completed: boolean
  completedAt?: string
}

export interface LocalXpEvent {
  id: string
  eventType: string
  xpGained: number
  multiplier: number
  description: string
  createdAt: string
}

export interface LocalHunterProfile {
  id: string
  userId: string
  hunterRank: string
  hunterSubRank: number
  hunterLevel: number
  currentXp: number
  totalXpEver: number
  hunterClass: string
  statStr: number
  statVit: number
  statAgi: number
  statInt: number
  statPer: number
  statPointsAvailable: number
  shadowIgrisLevel: number
  shadowTankLevel: number
  shadowIronLevel: number
  shadowFangLevel: number
  manaCrystals: number
  immunityTokens: number
  updatedAt: string
}

export interface LocalMuscleRank {
  id: string
  muscleGroup: string
  muscleNamePt: string
  muscleRank: string
  muscleRankNumeric: number
  totalVolume30d: number
  sessions30d: number
  bestExercisePrKg?: number
  bestExerciseName?: string
  lastRankUp?: string
}

export interface LocalStreak {
  id: string
  streakType: 'workout' | 'diet' | 'cardio' | 'water'
  currentCount: number
  maxCount: number
  lastValidDate?: string
}

export interface LocalQuest {
  id: string
  questType: 'daily' | 'main' | 'emergency' | 'penalty_rescue' | 'rank_test'
  questKey?: string
  title: string
  description?: string
  narrative?: string
  status: 'active' | 'completed' | 'failed' | 'rescued'
  modulesJson: object
  xpReward: number
  statPointsReward: number
  crystalReward: number
  expiresAt?: string
}

// Fila de sync offline
export interface PendingSyncItem {
  id: string
  operation: 'create' | 'update' | 'delete'
  endpoint: string
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  payload: object
  createdAt: number
  retries: number
  maxRetries: number
}

// ─── HunterFit DB (Dexie) ──────────────────────────────────────────────────

export class HunterFitDB extends Dexie {
  workoutDays!: Table<LocalWorkoutDay>
  exercises!: Table<LocalExercise>
  workoutSessions!: Table<LocalWorkoutSession>
  exerciseSets!: Table<LocalExerciseSet>
  xpEvents!: Table<LocalXpEvent>
  hunterProfiles!: Table<LocalHunterProfile>
  muscleRanks!: Table<LocalMuscleRank>
  streaks!: Table<LocalStreak>
  quests!: Table<LocalQuest>
  pendingSync!: Table<PendingSyncItem>

  constructor() {
    super('HunterFitDB')

    this.version(1).stores({
      workoutDays:     'id, planId, dayNumber',
      exercises:       'id, dayId, name, primaryMuscleGroup',
      workoutSessions: 'id, dayId, sessionDate, syncStatus',
      exerciseSets:    'id, sessionId, exerciseId, setNumber',
      xpEvents:        'id, eventType, createdAt',
      hunterProfiles:  'id, userId',
      muscleRanks:     'id, muscleGroup',
      streaks:         'id, streakType',
      quests:          'id, questType, status',
    })

    // v2: adiciona fila de sync offline
    this.version(2).stores({
      workoutDays:     'id, planId, dayNumber',
      exercises:       'id, dayId, name, primaryMuscleGroup',
      workoutSessions: 'id, dayId, sessionDate, syncStatus',
      exerciseSets:    'id, sessionId, exerciseId, setNumber',
      xpEvents:        'id, eventType, createdAt',
      hunterProfiles:  'id, userId',
      muscleRanks:     'id, muscleGroup',
      streaks:         'id, streakType',
      quests:          'id, questType, status',
      pendingSync:     'id, createdAt, endpoint',
    })
  }
}

export const db = new HunterFitDB()
