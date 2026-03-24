import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type HunterRank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'National'
export type HunterClass =
  | 'Balance Warrior'
  | 'Berserker'
  | 'Iron Body'
  | 'Shadow Runner'
  | 'Mind Master'
  | 'Absolute Warrior'

export interface HunterProfile {
  id: string
  userId: string
  name: string
  hunterRank: HunterRank
  hunterSubRank: number
  hunterLevel: number
  currentXp: number
  xpToNextLevel: number
  totalXpEver: number
  hunterClass: HunterClass
  equippedTitle: string | null

  // Atributos
  statStr: number
  statVit: number
  statAgi: number
  statInt: number
  statPer: number
  statPointsAvailable: number

  // Shadow Army
  shadowIgrisLevel: number
  shadowTankLevel: number
  shadowIronLevel: number
  shadowFangLevel: number

  // Moedas
  manaCrystals: number
  immunityTokens: number
}

interface HunterState {
  profile: HunterProfile | null
  isLoading: boolean
  setProfile: (profile: HunterProfile) => void
  addXp: (amount: number, multiplier?: number) => void
  allocateStat: (stat: keyof Pick<HunterProfile, 'statStr' | 'statVit' | 'statAgi' | 'statInt' | 'statPer'>) => void
  updateShadow: (shadow: 'igris' | 'tank' | 'iron' | 'fang', level: number) => void
}

// XP necessário por nível — baseado na spec seção 17
function calcXpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.8))
}

export const useHunterStore = create<HunterState>()(
  persist(
    (set, get) => ({
      profile: null,
      isLoading: false,

      setProfile: (profile) => {
        const xpToNextLevel = calcXpForLevel(profile.hunterLevel + 1)
        set({ profile: { ...profile, xpToNextLevel } })
      },

      addXp: (amount, multiplier = 1.0) => {
        const state = get()
        if (!state.profile) return

        const gained = Math.floor(amount * multiplier)
        const newXp = state.profile.currentXp + gained

        // Level up logic
        let { hunterLevel, xpToNextLevel } = state.profile
        let remainingXp = newXp

        while (remainingXp >= xpToNextLevel) {
          remainingXp -= xpToNextLevel
          hunterLevel++
          xpToNextLevel = calcXpForLevel(hunterLevel + 1)
          // TODO: disparar animação de level up
        }

        set({
          profile: {
            ...state.profile,
            currentXp: remainingXp,
            hunterLevel,
            xpToNextLevel,
            totalXpEver: state.profile.totalXpEver + gained,
          },
        })
      },

      allocateStat: (stat) => {
        const state = get()
        if (!state.profile || state.profile.statPointsAvailable <= 0) return

        set({
          profile: {
            ...state.profile,
            [stat]: state.profile[stat] + 1,
            statPointsAvailable: state.profile.statPointsAvailable - 1,
          },
        })
      },

      updateShadow: (shadow, level) => {
        const state = get()
        if (!state.profile) return

        const keyMap = {
          igris: 'shadowIgrisLevel',
          tank: 'shadowTankLevel',
          iron: 'shadowIronLevel',
          fang: 'shadowFangLevel',
        } as const

        set({
          profile: {
            ...state.profile,
            [keyMap[shadow]]: level,
          },
        })
      },
    }),
    {
      name: 'hunterfit-hunter-profile',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
