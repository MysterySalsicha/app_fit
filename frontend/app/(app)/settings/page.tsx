'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/stores/authStore'
import { useRouter, useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'
import { usePushNotifications } from '@/lib/hooks/usePushNotifications'

type ReminderType = 'trt' | 'supplement' | 'water' | 'meal' | 'workout' | 'cardio'

interface ReminderConfig {
  type: ReminderType
  label: string
  icon: string
  time: string
  days: number[]
  enabled: boolean
}

const REMINDER_DEFAULTS: ReminderConfig[] = [
  { type: 'workout',    label: 'Treino',         icon: '⚔️',  time: '18:00', days: [1,2,3,4,5],   enabled: true },
  { type: 'cardio',     label: 'Cardio',          icon: '💨',  time: '06:30', days: [1,2,3,4,5,6,7], enabled: true },
  { type: 'water',      label: 'Água (90min)',     icon: '💧',  time: '08:00', days: [1,2,3,4,5,6,7], enabled: true },
  { type: 'meal',       label: 'Refeição',        icon: '🍎',  time: '12:00', days: [1,2,3,4,5,6,7], enabled: false },
  { type: 'trt',        label: 'TRT',             icon: '💉',  time: '08:00', days: [1,4],           enabled: false },
  { type: 'supplement', label: 'Suplementos',     icon: '💊',  time: '07:00', days: [1,2,3,4,5,6,7], enabled: false },
]

const DAYS_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export default function SettingsPage() {
  const { user, logout } = useAuthStore()
  const router  = useRouter()
  const params  = useSearchParams()
  const qc      = useQueryClient()

  const [reminders, setReminders] = useState<ReminderConfig[]>(REMINDER_DEFAULTS)
  const [saved, setSaved] = useState(false)
  const [stravaMsg, setStravaMsg] = useState<string | null>(null)

  const { status: pushStatus, subscribe } = usePushNotifications()

  // Show Strava connect success message from OAuth redirect
  useEffect(() => {
    if (params.get('strava') === 'connected') {
      setStravaMsg('✓ Strava conectado com sucesso!')
      qc.invalidateQueries({ queryKey: ['strava', 'status'] })
    }
  }, [params, qc])

  // ── Strava status ────────────────────────────────────────────────────────
  const { data: stravaStatus } = useQuery({
    queryKey: ['strava', 'status'],
    queryFn: () => api.get('api/strava/status').then(r => r.data),
  })

  // ── Nutrition targets ────────────────────────────────────────────────────
  const { data: targets } = useQuery({
    queryKey: ['nutrition', 'targets'],
    queryFn: () => api.get('api/nutrition/targets').then(r => r.data),
  })

  const [kcalTarget,    setKcalTarget]    = useState(2450)
  const [proteinTarget, setProteinTarget] = useState(180)
  const [carbsTarget,   setCarbsTarget]   = useState(220)
  const [fatTarget,     setFatTarget]     = useState(70)
  const [waterTarget,   setWaterTarget]   = useState(3500)

  useEffect(() => {
    if (!targets) return
    setKcalTarget(targets.kcal ?? 2450)
    setProteinTarget(targets.protein ?? 180)
    setCarbsTarget(targets.carbs ?? 220)
    setFatTarget(targets.fat ?? 70)
    setWaterTarget(targets.water ?? 3500)
  }, [targets])

  const saveTargetsMutation = useMutation({
    mutationFn: () => api.put('api/nutrition/targets', {
      dailyKcalTarget:    kcalTarget,
      dailyProteinGTarget: proteinTarget,
      dailyCarbsGTarget:  carbsTarget,
      dailyFatGTarget:    fatTarget,
      dailyWaterMlTarget: waterTarget,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nutrition', 'targets'] })
      qc.invalidateQueries({ queryKey: ['nutrition', 'today'] })
    },
  })

  // ── Strava disconnect ────────────────────────────────────────────────────
  const disconnectStravaMutation = useMutation({
    mutationFn: () => api.delete('api/strava/disconnect'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['strava', 'status'] }),
  })

  // ── Save reminders ────────────────────────────────────────────────────────
  const handleSaveReminders = async () => {
    const prefs = JSON.stringify(reminders.filter(r => r.enabled))
    await api.put('api/reminders', { preferences: prefs })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const toggleReminder = (idx: number) =>
    setReminders(prev => prev.map((r, i) => i === idx ? { ...r, enabled: !r.enabled } : r))

  const toggleDay = (reminderIdx: number, day: number) =>
    setReminders(prev => prev.map((r, i) => {
      if (i !== reminderIdx) return r
      const days = r.days.includes(day) ? r.days.filter(d => d !== day) : [...r.days, day].sort()
      return { ...r, days }
    }))

  const handleLogout = () => { logout(); router.push('/login') }

  return (
    <div className="px-4 pt-4 pb-8 space-y-6 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-foreground">Configurações</h1>

      {stravaMsg && (
        <div className="bg-green-900/40 border border-green-500/40 text-green-300 text-sm px-4 py-3 rounded-xl">
          {stravaMsg}
        </div>
      )}

      {/* Perfil */}
      <section className="hunter-card space-y-3">
        <h2 className="text-sm font-semibold text-foreground">👤 Perfil</h2>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Nome</span>
            <span className="font-medium">{user?.name ?? '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">E-mail</span>
            <span className="font-medium">{user?.email ?? '—'}</span>
          </div>
        </div>
      </section>

      {/* Metas Nutricionais */}
      <section className="hunter-card space-y-4">
        <h2 className="text-sm font-semibold text-foreground">🎯 Metas Diárias</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Calorias (kcal)', value: kcalTarget, setter: setKcalTarget, max: 6000 },
            { label: 'Proteína (g)',    value: proteinTarget, setter: setProteinTarget, max: 400 },
            { label: 'Carboidrato (g)', value: carbsTarget, setter: setCarbsTarget, max: 600 },
            { label: 'Gordura (g)',     value: fatTarget, setter: setFatTarget, max: 300 },
          ].map(({ label, value, setter, max }) => (
            <div key={label} className="space-y-1">
              <label className="text-xs text-muted-foreground">{label}</label>
              <input
                type="number"
                value={value}
                onChange={e => setter(Number(e.target.value))}
                min={0} max={max}
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground"
              />
            </div>
          ))}
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Água (ml)</label>
          <input
            type="number"
            value={waterTarget}
            onChange={e => setWaterTarget(Number(e.target.value))}
            min={500} max={10000} step={250}
            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground"
          />
        </div>
        <button
          onClick={() => saveTargetsMutation.mutate()}
          disabled={saveTargetsMutation.isPending}
          className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold disabled:opacity-60"
        >
          {saveTargetsMutation.isPending ? 'Salvando…' : saveTargetsMutation.isSuccess ? '✓ Metas salvas!' : 'Salvar metas'}
        </button>
      </section>

      {/* Notificações Push */}
      <section className="hunter-card space-y-3">
        <h2 className="text-sm font-semibold text-foreground">🔔 Notificações Push</h2>
        {pushStatus === 'subscribed' && (
          <p className="text-xs text-green-400">✓ Notificações push ativadas</p>
        )}
        {pushStatus === 'denied' && (
          <p className="text-xs text-red-400">Bloqueado no navegador — habilite nas configurações do dispositivo</p>
        )}
        {pushStatus === 'unsupported' && (
          <p className="text-xs text-muted-foreground">Notificações não suportadas neste dispositivo</p>
        )}
        {(pushStatus === 'default' || pushStatus === 'loading') && (
          <button
            onClick={subscribe}
            disabled={pushStatus === 'loading'}
            className="w-full py-2.5 bg-primary/20 text-primary border border-primary/30 rounded-xl text-sm font-medium disabled:opacity-50"
          >
            {pushStatus === 'loading' ? 'Ativando…' : 'Ativar notificações push'}
          </button>
        )}
      </section>

      {/* Lembretes */}
      <section className="hunter-card space-y-4">
        <h2 className="text-sm font-semibold text-foreground">⏰ Lembretes</h2>
        {reminders.map((reminder, idx) => (
          <div
            key={reminder.type}
            className={`space-y-2 pb-3 ${idx < reminders.length - 1 ? 'border-b border-border' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>{reminder.icon}</span>
                <span className="text-sm font-medium">{reminder.label}</span>
              </div>
              <button
                onClick={() => toggleReminder(idx)}
                className={`w-10 h-5 rounded-full transition-all relative ${reminder.enabled ? 'bg-primary' : 'bg-muted'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${reminder.enabled ? 'right-0.5' : 'left-0.5'}`} />
              </button>
            </div>
            {reminder.enabled && (
              <div className="space-y-2 pl-6">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-12">Horário</span>
                  <input
                    type="time"
                    defaultValue={reminder.time}
                    className="bg-input border border-border rounded-lg px-2 py-1 text-xs text-foreground"
                  />
                </div>
                <div className="flex gap-1">
                  {DAYS_LABELS.map((day, d) => (
                    <button
                      key={d}
                      onClick={() => toggleDay(idx, d + 1)}
                      className={`w-7 h-7 rounded-lg text-[10px] font-medium transition-all ${
                        reminder.days.includes(d + 1) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {day[0]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        <button
          onClick={handleSaveReminders}
          className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${saved ? 'bg-green-700 text-white' : 'bg-primary text-primary-foreground'}`}
        >
          {saved ? '✓ Salvo!' : 'Salvar lembretes'}
        </button>
      </section>

      {/* Strava */}
      <section className="hunter-card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">🏃 Strava</h2>
          {stravaStatus?.connected && (
            <span className="text-xs text-green-400 font-medium">Conectado</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Conecte o Strava para validar o cardio automaticamente e alimentar o Fang da Shadow Army.
        </p>
        {stravaStatus?.connected ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Atleta #{stravaStatus.athleteId} · Expira: {stravaStatus.expiresAt ? new Date(stravaStatus.expiresAt).toLocaleDateString() : '—'}
            </p>
            <button
              onClick={() => disconnectStravaMutation.mutate()}
              disabled={disconnectStravaMutation.isPending}
              className="text-xs text-destructive underline disabled:opacity-50"
            >
              Desconectar Strava
            </button>
          </div>
        ) : (
          <button
            onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL ?? ''}/api/strava/auth`}
            className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            🏃 Conectar Strava
          </button>
        )}
      </section>

      {/* Zona de Perigo */}
      <section className="hunter-card space-y-3 border-destructive/30">
        <h2 className="text-sm font-semibold text-destructive">⚠️ Zona de Perigo</h2>
        <button
          onClick={handleLogout}
          className="w-full py-3 border border-border rounded-xl text-sm text-muted-foreground active:scale-95 transition-transform"
        >
          Sair da conta
        </button>
      </section>
    </div>
  )
}
