'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { registerSyncListeners, drainOnStartup } from '@/lib/db/sync'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minuto
            retry: 2,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  useEffect(() => {
    // Registra listeners de online/offline (fire-and-forget)
    registerSyncListeners()
    // Drena fila de sync pendente de sessões anteriores
    drainOnStartup().catch(console.warn)
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
