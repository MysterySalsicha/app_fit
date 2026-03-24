import { create } from 'zustand'

interface RestTimerState {
  isRunning: boolean
  secondsLeft: number
  totalSeconds: number
  intervalId: ReturnType<typeof setInterval> | null

  startTimer: (seconds: number) => void
  skipTimer: () => void
  addSeconds: (seconds: number) => void
  tick: () => void
}

export const useRestTimerStore = create<RestTimerState>((set, get) => ({
  isRunning: false,
  secondsLeft: 0,
  totalSeconds: 0,
  intervalId: null,

  startTimer: (seconds) => {
    // Limpa timer anterior
    const prev = get().intervalId
    if (prev) clearInterval(prev)

    const intervalId = setInterval(() => {
      get().tick()
    }, 1000)

    set({
      isRunning: true,
      secondsLeft: seconds,
      totalSeconds: seconds,
      intervalId,
    })

    // Notificação Web quando terminar (se suportado)
    if ('Notification' in window && Notification.permission === 'granted') {
      setTimeout(() => {
        new Notification('HunterFit', {
          body: 'Descanso encerrado. Próxima série!',
          icon: '/icons/icon-192.png',
        })
      }, seconds * 1000)
    }
  },

  skipTimer: () => {
    const { intervalId } = get()
    if (intervalId) clearInterval(intervalId)
    set({ isRunning: false, secondsLeft: 0, intervalId: null })
  },

  addSeconds: (seconds) => {
    set((state) => ({
      secondsLeft: state.secondsLeft + seconds,
      totalSeconds: state.totalSeconds + seconds,
    }))
  },

  tick: () => {
    const { secondsLeft, intervalId } = get()
    if (secondsLeft <= 1) {
      if (intervalId) clearInterval(intervalId)
      set({ isRunning: false, secondsLeft: 0, intervalId: null })
    } else {
      set({ secondsLeft: secondsLeft - 1 })
    }
  },
}))
