'use client'

import { useEffect } from 'react'

/**
 * Next.js App Router Error Boundary — captura erros de renderização
 * dentro do grupo (app) e exibe uma tela amigável em vez de tela branca.
 *
 * O componente recebe `error` (o erro capturado) e `reset` (função para
 * tentar re-renderizar o segmento que falhou).
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log para monitoramento (substituir por Sentry/DataDog em produção)
    console.error('[HunterFit] Erro de renderização:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center space-y-6">
      {/* Ícone animado */}
      <div className="text-6xl animate-pulse">⚠️</div>

      {/* Caixa estilo "sistema" — coerente com o design RPG */}
      <div className="system-notification max-w-sm w-full">
        <p className="text-xs text-red-400 mb-1 font-mono uppercase tracking-widest">Sistema</p>
        <p className="text-lg font-bold text-white">ERRO INESPERADO</p>
        <p className="text-sm text-blue-200 mt-2">
          Algo deu errado nesta tela. Seus dados estão salvos.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <p className="text-xs text-red-300 mt-2 font-mono break-all">
            {error.message}
          </p>
        )}
      </div>

      {/* Ações */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={reset}
          className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm"
        >
          Tentar novamente
        </button>
        <a
          href="/dashboard"
          className="w-full py-3 border border-border rounded-xl text-muted-foreground text-sm text-center"
        >
          Voltar ao início
        </a>
      </div>

      <p className="text-xs text-muted-foreground">
        Se o erro persistir, tente recarregar o aplicativo.
      </p>
    </div>
  )
}
