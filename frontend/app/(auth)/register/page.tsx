'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/authStore'

type Step = 'identity' | 'body' | 'confirm'

export default function RegisterPage() {
  const router = useRouter()
  const { register, isLoading, error, clearError } = useAuthStore()

  const [step, setStep] = useState<Step>('identity')
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    heightCm: '',
  })
  const [localError, setLocalError] = useState('')

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [k]: e.target.value }))
    setLocalError('')
    clearError()
  }

  const goNext = () => {
    if (step === 'identity') {
      if (!form.name || !form.email || !form.password) {
        setLocalError('Preencha todos os campos.')
        return
      }
      if (form.password.length < 8) {
        setLocalError('Senha mínima: 8 caracteres.')
        return
      }
      if (form.password !== form.confirmPassword) {
        setLocalError('Senhas não coincidem.')
        return
      }
      setStep('body')
    } else if (step === 'body') {
      const h = parseFloat(form.heightCm)
      if (!h || h < 100 || h > 250) {
        setLocalError('Altura inválida (100–250 cm).')
        return
      }
      setStep('confirm')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    try {
      await register({
        email: form.email,
        password: form.password,
        name: form.name,
        heightCm: parseFloat(form.heightCm),
      })
      router.push('/dashboard')
    } catch {
      // error no store
    }
  }

  const displayError = localError || error

  const steps: Step[] = ['identity', 'body', 'confirm']
  const stepIdx = steps.indexOf(step)

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-10">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="text-4xl mb-2">⚔️</div>
        <h1 className="text-xl font-bold text-foreground">Criar conta</h1>
        <p className="text-xs text-muted-foreground font-mono mt-0.5">O Sistema convoca um novo Hunter.</p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-6">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i <= stepIdx
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {i < stepIdx ? '✓' : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className={`w-8 h-0.5 transition-all ${i < stepIdx ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="w-full max-w-sm">
        <div className="hunter-card space-y-5">
          {displayError && (
            <div className="bg-destructive/15 border border-destructive/30 text-destructive text-sm rounded-lg px-3 py-2">
              {displayError}
            </div>
          )}

          {/* Etapa 1: Identidade */}
          {step === 'identity' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">Identidade do Hunter</h2>
                <p className="text-xs text-muted-foreground">Como vamos te chamar?</p>
              </div>

              {(['name', 'email', 'password', 'confirmPassword'] as const).map((key) => (
                <div key={key} className="space-y-1.5">
                  <label className="text-xs text-muted-foreground capitalize">
                    {key === 'name' ? 'Nome' : key === 'email' ? 'E-mail' : key === 'password' ? 'Senha' : 'Confirmar senha'}
                  </label>
                  <input
                    type={key.includes('assword') ? 'password' : key === 'email' ? 'email' : 'text'}
                    value={form[key]}
                    onChange={set(key)}
                    placeholder={
                      key === 'name' ? 'Seu nome' :
                      key === 'email' ? 'hunter@email.com' :
                      '••••••••'
                    }
                    className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              ))}

              <button onClick={goNext} className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm active:scale-95 transition-transform">
                Próximo →
              </button>
            </div>
          )}

          {/* Etapa 2: Corpo */}
          {step === 'body' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">Dados físicos</h2>
                <p className="text-xs text-muted-foreground">O Sistema precisa de seu registro físico.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Altura (cm)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={form.heightCm}
                  onChange={set('heightCm')}
                  placeholder="193"
                  min={100}
                  max={250}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <p className="text-xs text-muted-foreground">Usado para cálculos de TDEE e BMI.</p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep('identity')} className="flex-1 py-3.5 border border-border rounded-xl text-sm text-muted-foreground">
                  ← Voltar
                </button>
                <button onClick={goNext} className="flex-1 py-3.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm active:scale-95 transition-transform">
                  Próximo →
                </button>
              </div>
            </div>
          )}

          {/* Etapa 3: Confirmação */}
          {step === 'confirm' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">Confirmar registro</h2>
                <p className="text-xs text-muted-foreground">O Sistema está pronto para criar seu perfil.</p>
              </div>

              <div className="bg-muted/40 rounded-xl p-3 space-y-2 text-sm">
                {[
                  ['Nome', form.name],
                  ['E-mail', form.email],
                  ['Altura', `${form.heightCm} cm`],
                  ['Rank inicial', 'E — Iniciante'],
                  ['Classe', 'Balance Warrior'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium text-foreground">{value}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep('body')} className="flex-1 py-3.5 border border-border rounded-xl text-sm text-muted-foreground">
                  ← Voltar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-3.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm active:scale-95 transition-transform disabled:opacity-60"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </span>
                  ) : (
                    '⚔️ Arise!'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Já tem conta?{' '}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
