import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { api, setToken, clearToken } from '@/lib/api/client'

interface AuthUser {
  userId: string
  email: string
  name: string
}

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
}

interface RegisterData {
  email: string
  password: string
  name: string
  heightCm: number
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const res = await api.postPublic<{ token: string; userId: string }>(
            'api/auth/login',
            { email, password }
          )
          setToken(res.token)
          // Buscar perfil completo
          const profile = await api.get<{ name: string; email: string }>('api/auth/me')
          set({
            user: { userId: res.userId, email, name: profile.name },
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Erro ao fazer login'
          set({ error: msg, isLoading: false })
          throw err
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null })
        try {
          const res = await api.postPublic<{ token: string; userId: string }>(
            'api/auth/register',
            {
              email: data.email,
              password: data.password,
              name: data.name,
              heightCm: data.heightCm,
            }
          )
          setToken(res.token)
          set({
            user: { userId: res.userId, email: data.email, name: data.name },
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Erro ao registrar'
          set({ error: msg, isLoading: false })
          throw err
        }
      },

      logout: async () => {
        // Revoga o token no servidor antes de limpá-lo localmente (SEC-3)
        try {
          await api.post('api/auth/logout')
        } catch {
          // Se falhar (ex: offline), continua com o logout local de qualquer forma
        }
        clearToken()
        set({ user: null, isAuthenticated: false, error: null })
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'hunterfit-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }),
    }
  )
)
