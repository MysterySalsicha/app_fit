'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { WaterTracker } from '@/components/nutrition/WaterTracker'

// ─── Tipos ───────────────────────────────────────────────────────────────────
interface MacroTotals {
  kcalConsumed: number
  proteinG: number
  carbsG: number
  fatG: number
  waterMl: number
}

interface MacroTargets {
  kcal: number
  proteinG: number
  carbsG: number
  fatG: number
  waterMl: number
}

interface Meal {
  id: string
  name: string
  time: string
  kcal: number
  proteinG: number
  carbsG: number
  fatG: number
}

interface TodayResponse {
  totals: MacroTotals
  targets: MacroTargets
  meals: Meal[]
}

// Fallbacks offline — usados antes do fetch terminar
const EMPTY_TOTALS: MacroTotals = { kcalConsumed: 0, proteinG: 0, carbsG: 0, fatG: 0, waterMl: 0 }
const DEFAULT_TARGETS: MacroTargets = { kcal: 2450, proteinG: 180, carbsG: 220, fatG: 70, waterMl: 3500 }

// ─── Barra de macro ───────────────────────────────────────────────────────────
function MacroBar({
  label,
  consumed,
  target,
  unit,
  color,
}: {
  label: string
  consumed: number
  target: number
  unit: string
  color: string
}) {
  const pct = Math.min(Math.round((consumed / target) * 100), 100)
  const over = consumed > target

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-foreground font-medium">{label}</span>
        <span style={{ color: over ? '#ef4444' : color }}>
          {consumed.toFixed(0)}/{target}{unit}
          {over && ' ⚠️'}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            backgroundColor: over ? '#ef4444' : color,
          }}
        />
      </div>
    </div>
  )
}

// ─── Card de refeição ─────────────────────────────────────────────────────────
function MealCard({ meal, onDelete }: { meal: Meal; onDelete: (id: string) => void }) {
  return (
    <div className="hunter-card flex items-center gap-3">
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{meal.name}</p>
        <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
          <span>{meal.time}</span>
          <span>·</span>
          <span className="text-orange-400">{meal.kcal} kcal</span>
          <span>·</span>
          <span className="text-green-400">P {meal.proteinG}g</span>
          <span>·</span>
          <span className="text-blue-400">C {meal.carbsG}g</span>
          <span>·</span>
          <span className="text-amber-400">G {meal.fatG}g</span>
        </div>
      </div>
      <button
        onClick={() => onDelete(meal.id)}
        className="text-muted-foreground/50 hover:text-destructive text-lg leading-none px-1"
      >
        ×
      </button>
    </div>
  )
}

// ─── Form de adicionar refeição ───────────────────────────────────────────────
function AddMealForm({ onAdd }: { onAdd: (meal: Omit<Meal, 'id' | 'time'>) => void }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', kcal: '', protein: '', carbs: '', fat: '' })

  const handle = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.kcal) return
    onAdd({
      name: form.name,
      kcal: parseInt(form.kcal) || 0,
      proteinG: parseFloat(form.protein) || 0,
      carbsG: parseFloat(form.carbs) || 0,
      fatG: parseFloat(form.fat) || 0,
    })
    setForm({ name: '', kcal: '', protein: '', carbs: '', fat: '' })
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full hunter-card border-dashed flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground hover:border-primary/50 transition-colors cursor-pointer"
      >
        + Adicionar refeição
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="hunter-card space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Nova refeição</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-muted-foreground text-lg">×</button>
      </div>

      <input
        value={form.name}
        onChange={handle('name')}
        placeholder="Ex: Almoço — arroz, frango, salada"
        className="w-full bg-input border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        required
      />

      <div className="grid grid-cols-2 gap-2">
        {[
          { key: 'kcal',    label: 'Calorias (kcal)' },
          { key: 'protein', label: 'Proteína (g)'    },
          { key: 'carbs',   label: 'Carboidratos (g)'},
          { key: 'fat',     label: 'Gordura (g)'     },
        ].map(({ key, label }) => (
          <div key={key} className="space-y-1">
            <label className="text-xs text-muted-foreground">{label}</label>
            <input
              type="number"
              inputMode="decimal"
              value={form[key as keyof typeof form]}
              onChange={handle(key as keyof typeof form)}
              placeholder="0"
              className="w-full bg-input border border-border rounded-lg px-2 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2.5 border border-border rounded-xl text-sm text-muted-foreground">
          Cancelar
        </button>
        <button type="submit" className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold">
          Salvar
        </button>
      </div>
    </form>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function NutritionPage() {
  const qc = useQueryClient()

  // Busca dados de hoje
  const { data, isLoading } = useQuery<TodayResponse>({
    queryKey: ['nutrition', 'today'],
    queryFn: () => api.get<TodayResponse>('api/nutrition/today'),
    staleTime: 60_000,
  })

  const totals  = data?.totals  ?? EMPTY_TOTALS
  const targets = data?.targets ?? DEFAULT_TARGETS
  const meals   = data?.meals   ?? []

  // Mutação: logar refeição
  const logMeal = useMutation({
    mutationFn: (payload: { mealName: string; kcalConsumed: number; proteinG: number; carbsG: number; fatG: number }) =>
      api.post('api/nutrition/log', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nutrition', 'today'] }),
  })

  // Mutação: deletar refeição
  const deleteMeal = useMutation({
    mutationFn: (id: string) => api.delete(`api/nutrition/log/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nutrition', 'today'] }),
  })

  const handleAdd = (meal: Omit<Meal, 'id' | 'time'>) => {
    logMeal.mutate({
      mealName:     meal.name,
      kcalConsumed: meal.kcal,
      proteinG:     meal.proteinG,
      carbsG:       meal.carbsG,
      fatG:         meal.fatG,
    })
  }

  const kcalRemaining = targets.kcal - totals.kcalConsumed

  return (
    <div className="px-4 pt-4 pb-8 space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Nutrição</h1>
        <Link
          href="/nutrition/import"
          className="text-xs text-muted-foreground border border-border rounded-lg px-3 py-1.5"
        >
          📸 IA Import
        </Link>
      </div>

      {/* Resumo do dia */}
      <div className="hunter-card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Hoje</p>
            <p className="text-3xl font-bold font-mono text-foreground">
              {isLoading ? '—' : totals.kcalConsumed}
            </p>
            <p className="text-xs text-muted-foreground">/ {targets.kcal} kcal</p>
          </div>
          <div className="text-right">
            <p className={`text-sm font-bold ${kcalRemaining >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {kcalRemaining >= 0 ? `−${kcalRemaining}` : `+${Math.abs(kcalRemaining)}`} kcal
            </p>
            <p className="text-xs text-muted-foreground">
              {kcalRemaining >= 0 ? 'disponível' : 'acima da meta'}
            </p>
          </div>
        </div>

        {/* Barras de macro */}
        <div className="space-y-3">
          <MacroBar label="Proteína"     consumed={totals.proteinG} target={targets.proteinG} unit="g" color="#22c55e" />
          <MacroBar label="Carboidratos" consumed={totals.carbsG}   target={targets.carbsG}   unit="g" color="#3b82f6" />
          <MacroBar label="Gordura"      consumed={totals.fatG}     target={targets.fatG}     unit="g" color="#f59e0b" />
        </div>
      </div>

      {/* Água */}
      <WaterTracker
        initialMl={totals.waterMl}
        targetMl={targets.waterMl}
      />

      {/* Refeições do dia */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Refeições de hoje</h2>
          <span className="text-xs text-muted-foreground">{meals.length} registros</span>
        </div>

        {meals.map((meal) => (
          <MealCard
            key={meal.id}
            meal={meal}
            onDelete={(id) => deleteMeal.mutate(id)}
          />
        ))}

        <AddMealForm onAdd={handleAdd} />
      </div>

      {/* Alertas de macro */}
      {totals.proteinG < targets.proteinG * 0.5 && meals.length > 0 && (
        <div className="hunter-card border-amber-700/40 bg-amber-950/20">
          <p className="text-xs text-amber-400">
            ⚠️ Proteína abaixo de 50% da meta — você vai ficar sem matéria-prima para crescer.
          </p>
        </div>
      )}
      {totals.kcalConsumed > targets.kcal + 200 && (
        <div className="hunter-card border-red-700/40 bg-red-950/20">
          <p className="text-xs text-red-400">
            ⚠️ Acima de {targets.kcal + 200} kcal — deficit calórico comprometido.
          </p>
        </div>
      )}

      {/* Link para histórico */}
      <Link
        href="/nutrition/history"
        className="block text-center text-xs text-muted-foreground border border-border rounded-xl py-3"
      >
        📊 Ver histórico de nutrição →
      </Link>
    </div>
  )
}
