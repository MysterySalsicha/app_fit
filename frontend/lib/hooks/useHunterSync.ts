/**
 * useHunterSync — sincroniza o perfil do Hunter da API com o Zustand store.
 * Deve ser chamado no layout principal para manter o store sempre atualizado.
 */
import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { useHunterStore, type HunterProfile } from '@/lib/stores/hunterStore'
import { useAuthStore } from '@/lib/stores/authStore'

export function useHunterSync() {
  const { user } = useAuthStore()
  const { setProfile } = useHunterStore()

  const { data, isSuccess } = useQuery<HunterProfile & { name: string }>({
    queryKey: ['hunter', 'profile'],
    queryFn: () => api.get<HunterProfile & { name: string }>('api/hunter/profile'),
    enabled: !!user,
    staleTime: 30_000,   // 30s — perfil muda pouco, não precisa de polling
    gcTime: 300_000,     // 5min no cache
  })

  useEffect(() => {
    if (isSuccess && data) {
      setProfile({
        ...data,
        // Garante que o nome vem do user auth se o profile não tiver
        name: (data as any).name ?? user?.name ?? '',
      } as HunterProfile)
    }
  }, [isSuccess, data, setProfile, user])
}
