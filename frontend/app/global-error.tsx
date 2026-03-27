'use client'

/**
 * Global Error Boundary — captura erros que ocorrem no root layout.
 * Deve incluir <html> e <body> pois substitui o root layout quando ativado.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="pt-BR">
      <body style={{ background: '#09090b', color: '#fafafa', fontFamily: 'sans-serif' }}>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center', gap: '24px' }}>
          <div style={{ fontSize: '48px' }}>⚡</div>
          <div>
            <p style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>HunterFit — Erro Crítico</p>
            <p style={{ fontSize: '14px', color: '#a1a1aa' }}>
              O aplicativo encontrou um erro inesperado.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={reset}
              style={{ padding: '12px 24px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Tentar novamente
            </button>
            <button
              onClick={() => window.location.href = '/'}
              style={{ padding: '12px 24px', background: 'transparent', color: '#a1a1aa', border: '1px solid #27272a', borderRadius: '12px', cursor: 'pointer' }}
            >
              Recarregar
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
