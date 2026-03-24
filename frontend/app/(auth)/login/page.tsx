'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/authStore'

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading, error, clearError } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    try {
      await login(email, password)
      router.push('/dashboard')
    } catch {
      // error já setado no store
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      {/* Logo / título */}
      <div className="text-center mb-10">
        <div className="text-5xl mb-3">⚔️</div>
        <h1 className="text-2xl font-bold text-foreground">HunterFit</h1>
        <p className="text-sm text-muted-foreground mt-1 font-mono">Arise. Level Up. IRL.</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm">
        <div className="hunter-card space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Entrar</h2>
            <p className="text-xs text-muted-foreground">O Sistema aguarda sua presença.</p>
          </div>

          {error && (
            <div className="bg-destructive/15 border border-destructive/30 text-destructive text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">E-mail</label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="hunter@email.com"
                className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Senha</label>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Autenticando...
                </span>
              ) : (
                '⚔️ Entrar no Sistema'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Ainda não é um Hunter?{' '}
          <Link href="/register" className="text-primary font-medium hover:underline">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  )
}
