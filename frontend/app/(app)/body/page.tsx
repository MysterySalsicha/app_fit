'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { api } from '@/lib/api/client'

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface BodyMeasurement {
  id: string
  measuredAt: string
  weightKg?: number
  bodyFatPct?: number
  muscleMassKg?: number
  waterPct?: number
  waistCm?: number
  bmi?: number
  visceralFatLevel?: number
  basalMetabolicRate?: number
  source: string
  aiValidated: boolean
}

interface BodyAlert {
  type: string
  severity: 'info' | 'warning' | 'danger'
  message: string
}

interface HistoryResponse {
  measurements: BodyMeasurement[]
  latest?: BodyMeasurement
  stats?: {
    weightDelta: number
    bodyFatDelta: number
    muscleDelta: number
    periodDays: number
  }
}

// ─── Tooltip personalizado ────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-lg p-2 text-xs space-y-1">
      <p className="text-muted-foreground">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: <span className="font-mono font-bold">{p.value?.toFixed(1)}</span>
        </p>
      ))}
    </div>
  )
}

// ─── Mini stat card ───────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  unit,
  delta,
  color = '#a1a1aa',
}: {
  label: string
  value?: number | null
  unit: string
  delta?: number | null
  color?: string
}) {
  if (value === undefined || value === null) return null
  const hasDelta = delta !== undefined && delta !== null && delta !== 0
  const positive = delta !== undefined && delta !== null && delta > 0

  return (
    <div className="hunter-card text-center py-3">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-xl font-bold font-mono" style={{ color }}>
        {value.toFixed(1)}<span className="text-xs font-normal text-muted-foreground"> {unit}</span>
      </p>
      {hasDelta && (
        <p className={`text-xs mt-0.5 ${positive ? 'text-green-400' : 'text-red-400'}`}>
          {positive ? '+' : ''}{delta!.toFixed(1)} {unit}
        </p>
      )}
    </div>
  )
}

// ─── Form de nova medição ─────────────────────────────────────────────────────
function AddMeasurementForm({ onSuccess }: { onSuccess: (alerts: BodyAlert[]) => void }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    weightKg: '', bodyFatPct: '', muscleMassKg: '', waterPct: '',
    waistCm: '', visceralFatLevel: '', notes: '',
  })

  const handle = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }))

  const logMeasurement = useMutation({
    mutationFn: (payload: object) => api.post<{ alerts: BodyAlert[] }>('api/body', payload),
    onSuccess: (res) => {
      setOpen(false)
      setForm({ weightKg: '', bodyFatPct: '', muscleMassKg: '', waterPct: '', waistCm: '', visceralFatLevel: '', notes: '' })
      onSuccess(res.alerts ?? [])
    },
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const num = (v: string) => v ? parseFloat(v) : undefined
    logMeasurement.mutate({
      weightKg:         num(form.weightKg),
      bodyFatPct:       num(form.bodyFatPct),
      muscleMassKg:     num(form.muscleMassKg),
      waterPct:         num(form.waterPct),
      waistCm:          num(form.waistCm),
      visceralFatLevel: num(form.visceralFatLevel),
      notes:            form.notes || undefined,
      source:           'manual',
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full hunter-card border-dashed flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground hover:border-primary/50 transition-colors"
      >
        + Registrar medição
      </button>
    )
  }

  const fields = [
    { key: 'weightKg',         label: 'Peso (kg)',          placeholder: '80.5' },
    { key: 'bodyFatPct',       label: '% Gordura',          placeholder: '18.0' },
    { key: 'muscleMassKg',     label: 'Massa Muscular (kg)',placeholder: '38.0' },
    { key: 'waterPct',         label: '% Água',             placeholder: '55.0' },
    { key: 'waistCm',          label: 'Cintura (cm)',        placeholder: '82.0' },
    { key: 'visceralFatLevel', label: 'Gordura Visceral',   placeholder: '5' },
  ]

  return (
    <form onSubmit={submit} className="hunter-card space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Nova medição</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-muted-foreground text-lg">×</button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {fields.map(({ key, label, placeholder }) => (
          <div key={key} className="space-y-1">
            <label className="text-xs text-muted-foreground">{label}</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              value={form[key as keyof typeof form]}
              onChange={handle(key as keyof typeof form)}
              placeholder={placeholder}
              className="w-full bg-input border border-border rounded-lg px-2 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        ))}
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Observações</label>
        <input
          value={form.notes}
          onChange={handle('notes')}
          placeholder="Ex: medição em jejum, pós-competição..."
          className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2.5 border border-border rounded-xl text-sm text-muted-foreground">
          Cancelar
        </button>
        <button
          type="submit"
          disabled={logMeasurement.isPending}
          className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold disabled:opacity-60"
        >
          {logMeasurement.isPending ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────
export default function BodyPage() {
  const qc = useQueryClient()
  const [alerts, setAlerts] = useState<BodyAlert[]>([])
  const [activeChart, setActiveChart] = useState<'weight' | 'fat' | 'muscle' | 'waist'>('weight')

  const { data, isLoading } = useQuery<HistoryResponse>({
    queryKey: ['body', 'history'],
    queryFn: () => api.get<HistoryResponse>('api/body/history?days=90'),
    staleTime: 120_000,
  })

  const latest = data?.latest
  const stats  = data?.stats

  const chartData = (data?.measurements ?? []).map((m) => ({
    date:    new Date(m.measuredAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    Peso:    m.weightKg,
    '% Gordura': m.bodyFatPct,
    'Músculo':   m.muscleMassKg,
    'Cintura':   m.waistCm,
  }))

  const chartConfigs = {
    weight: { key: 'Peso',     color: '#a78bfa', unit: 'kg' },
    fat:    { key: '% Gordura',color: '#f97316', unit: '%'  },
    muscle: { key: 'Músculo',  color: '#22c55e', unit: 'kg' },
    waist:  { key: 'Cintura',  color: '#f59e0b', unit: 'cm' },
  }

  const cfg = chartConfigs[activeChart]

  const ALERT_COLORS: Record<string, string> = {
    info:    'text-blue-400 border-blue-700/40 bg-blue-950/20',
    warning: 'text-amber-400 border-amber-700/40 bg-amber-950/20',
    danger:  'text-red-400 border-red-700/40 bg-red-950/20',
  }

  return (
    <div className="px-4 pt-4 pb-8 space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Composição Corporal</h1>
        <Link
          href="/body/import"
          className="text-xs text-muted-foreground border border-border rounded-lg px-3 py-1.5"
        >
          📸 IA Scan
        </Link>
      </div>

      {/* Alertas gerados após nova medição */}
      {alerts.map((a, i) => (
        <div key={i} className={`hunter-card ${ALERT_COLORS[a.severity] ?? ALERT_COLORS.info}`}>
          <p className="text-xs">{a.type === 'muscle_loss' ? '⚠️' : a.severity === 'danger' ? '🚨' : 'ℹ️'} {a.message}</p>
        </div>
      ))}

      {/* Stats atuais */}
      {latest && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <StatCard label="Peso"          value={latest.weightKg}     unit="kg"  delta={stats?.weightDelta}    color="#a78bfa" />
            <StatCard label="% Gordura"     value={latest.bodyFatPct}   unit="%"   delta={stats?.bodyFatDelta}   color="#f97316" />
            <StatCard label="Massa Muscular"value={latest.muscleMassKg} unit="kg"  delta={stats?.muscleDelta}    color="#22c55e" />
            <StatCard label="IMC"           value={latest.bmi}          unit=""    color="#a1a1aa" />
          </div>
          {latest.basalMetabolicRate && (
            <div className="hunter-card flex items-center justify-between">
              <span className="text-xs text-muted-foreground">TMB (taxa metabólica basal)</span>
              <span className="text-sm font-mono font-bold text-foreground">
                {latest.basalMetabolicRate.toFixed(0)} kcal/dia
              </span>
            </div>
          )}
        </>
      )}

      {/* Seletor de gráfico */}
      <div className="flex gap-2">
        {(Object.keys(chartConfigs) as (keyof typeof chartConfigs)[]).map((k) => (
          <button
            key={k}
            onClick={() => setActiveChart(k)}
            className={`flex-1 py-1.5 text-xs font-medium rounded-xl transition-all ${
              activeChart === k
                ? 'text-foreground border-2'
                : 'bg-muted text-muted-foreground border border-transparent'
            }`}
            style={activeChart === k ? { borderColor: chartConfigs[k].color, color: chartConfigs[k].color } : {}}
          >
            {chartConfigs[k].key}
          </button>
        ))}
      </div>

      {/* Gráfico principal */}
      <div className="hunter-card">
        {isLoading ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
            Carregando...
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
            Nenhuma medição ainda
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradBody" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={cfg.color} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={cfg.color} stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey={cfg.key}
                stroke={cfg.color}
                fill="url(#gradBody)"
                strokeWidth={2}
                dot={{ r: 3, fill: cfg.color }}
                connectNulls
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Registrar nova medição */}
      <AddMeasurementForm
        onSuccess={(newAlerts) => {
          setAlerts(newAlerts)
          qc.invalidateQueries({ queryKey: ['body'] })
        }}
      />

      {/* Histórico de medições */}
      {(data?.measurements ?? []).length > 0 && (
        <div className="hunter-card space-y-2">
          <h2 className="text-sm font-semibold text-foreground">Histórico recente</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {[...(data?.measurements ?? [])].reverse().slice(0, 10).map((m) => (
              <div key={m.id} className="flex items-center justify-between text-xs border-b border-border/40 pb-2 last:border-0">
                <div>
                  <span className="text-muted-foreground">
                    {new Date(m.measuredAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </span>
                  {m.aiValidated && <span className="ml-2 text-primary">✦ IA</span>}
                </div>
                <div className="flex gap-3 font-mono">
                  {m.weightKg     && <span className="text-purple-400">{m.weightKg}kg</span>}
                  {m.bodyFatPct   && <span className="text-orange-400">{m.bodyFatPct}%G</span>}
                  {m.muscleMassKg && <span className="text-green-400">{m.muscleMassKg}kgM</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
