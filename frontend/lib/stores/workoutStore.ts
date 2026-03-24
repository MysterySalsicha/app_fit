import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface SetData {
  exerciseId: string
  setNumber: number
  weight: number
  reps: number
  completed: boolean
  completedAt?: Date
  volumeLoad: number
}

export interface SessionSummary {
  durationStr: string
  volumeLoad: number
  xpGained: number
  prBeaten: boolean
  prExercises?: string[]
}

interface WorkoutState {
  isActive: boolean
  isComplete: boolean
  sessionStartedAt: Date | null
  sets: SetData[]
  totalVolumeLoad: number
  prevSessionVolumeLoad: number | null
  sessionSummary: SessionSummary | null

  startSession: () => void
  finishSession: () => void
  resetSession: () => void
  logSet: (exerciseId: string, setNumber: number, weight: number, reps: number) => void
  getExerciseSets: (exerciseId: string) => SetData[]
  getSetData: (exerciseId: string, setNumber: number) => SetData | undefined
  getLastSessionData: (exerciseId: string) => { weight: number; reps: number } | null
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      isActive: false,
      isComplete: false,
      sessionStartedAt: null,
      sets: [],
      totalVolumeLoad: 0,
      prevSessionVolumeLoad: null,
      sessionSummary: null,

      startSession: () => {
        set({
          isActive: true,
          isComplete: false,
          sessionStartedAt: new Date(),
          sets: [],
          totalVolumeLoad: 0,
          sessionSummary: null,
        })
      },

      finishSession: () => {
        const state = get()
        const started = state.sessionStartedAt
        const durationSec = started
          ? Math.floor((Date.now() - started.getTime()) / 1000)
          : 0

        const hours = Math.floor(durationSec / 3600)
        const mins = Math.floor((durationSec % 3600) / 60)
        const durationStr = hours > 0
          ? `${hours}h ${mins}min`
          : `${mins}min`

        // TODO: calcular XP real via xpCalc.ts
        const xpGained = Math.floor(state.totalVolumeLoad * 0.5)

        const summary: SessionSummary = {
          durationStr,
          volumeLoad: state.totalVolumeLoad,
          xpGained,
          prBeaten: false,
          prExercises: [],
        }

        set({
          isActive: false,
          isComplete: true,
          sessionSummary: summary,
        })
      },

      resetSession: () => {
        set({
          isActive: false,
          isComplete: false,
          sessionStartedAt: null,
          sets: [],
          totalVolumeLoad: 0,
          sessionSummary: null,
        })
      },

      logSet: (exerciseId, setNumber, weight, reps) => {
        const volumeLoad = weight * reps
        const newSet: SetData = {
          exerciseId,
          setNumber,
          weight,
          reps,
          completed: true,
          completedAt: new Date(),
          volumeLoad,
        }

        set((state) => {
          // Remove set anterior se existir
          const filtered = state.sets.filter(
            (s) => !(s.exerciseId === exerciseId && s.setNumber === setNumber)
          )
          const updatedSets = [...filtered, newSet]
          const total = updatedSets.reduce((acc, s) => acc + s.volumeLoad, 0)

          return { sets: updatedSets, totalVolumeLoad: total }
        })
      },

      getExerciseSets: (exerciseId) => {
        return get().sets.filter((s) => s.exerciseId === exerciseId)
      },

      getSetData: (exerciseId, setNumber) => {
        return get().sets.find(
          (s) => s.exerciseId === exerciseId && s.setNumber === setNumber
        )
      },

      // TODO: buscar do Dexie (último treino deste exercício)
      getLastSessionData: (_exerciseId) => null,
    }),
    {
      name: 'hunterfit-workout-session',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        isActive: state.isActive,
        sessionStartedAt: state.sessionStartedAt,
        sets: state.sets,
        totalVolumeLoad: state.totalVolumeLoad,
      }),
    }
  )
)
