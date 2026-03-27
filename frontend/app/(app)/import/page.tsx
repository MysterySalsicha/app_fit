'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api/client'

// Tipos de preview do parser
interface ParsedExercise {
  name: string
  sets: number
  reps: string
  restSeconds: number
}

interface ParsedDay {
  dayNumber: number
  dayLabel: string
  muscleGroups: string
  isRestDay: boolean
  exercises: ParsedExercise[]
}

interface ParsedPlan {
  name: string
  days: ParsedDay[]
}

// ─── Templates pré-definidos ───────────────────────────────────────────────

interface WorkoutTemplate {
  id: string
  label: string
  badge: string
  description: string
  txt: string
}

const TEMPLATES: WorkoutTemplate[] = [
  {
    id: 'fullbody_3x',
    label: 'Full Body 3×',
    badge: 'Iniciante',
    description: '3 dias · Academia ou casa',
    txt: `DIA 1 - FULL BODY A
Agachamento Livre | 3x10-12 | Descanso: 90s
Supino Reto com Barra | 3x10-12 | Descanso: 90s
Remada Curvada | 3x10-12 | Descanso: 90s
Desenvolvimento Ombro | 3x10-12 | Descanso: 75s
Rosca Direta | 3x12-15 | Descanso: 60s
Tríceps Testa | 3x12-15 | Descanso: 60s

DIA 2 - DESCANSO

DIA 3 - FULL BODY B
Leg Press 45° | 3x12-15 | Descanso: 90s
Supino Inclinado Haltere | 3x10-12 | Descanso: 75s
Puxada na Polia Alta | 3x10-12 | Descanso: 75s
Elevação Lateral | 3x12-15 | Descanso: 60s
Rosca Martelo | 3x12-15 | Descanso: 60s
Tríceps Polia Alta | 3x12-15 | Descanso: 60s

DIA 4 - DESCANSO

DIA 5 - FULL BODY C
Stiff | 3x10-12 | Descanso: 90s
Crucifixo com Haltere | 3x12-15 | Descanso: 75s
Remada Unilateral | 3x10-12 | Descanso: 75s
Desenvolvimento Haltere | 3x12-15 | Descanso: 60s
Rosca Concentrada | 3x12-15 | Descanso: 60s
Mergulho Banco | 3x12-15 | Descanso: 60s

DIA 6 - DESCANSO
DIA 7 - DESCANSO`,
  },
  {
    id: 'upper_lower_4x',
    label: 'Upper/Lower 4×',
    badge: 'Iniciante+',
    description: '4 dias · Academia',
    txt: `DIA 1 - UPPER A (Peito/Ombros)
Supino Reto com Barra | 4x8-12 | Descanso: 90s
Supino Inclinado Haltere | 3x10-12 | Descanso: 75s
Desenvolvimento Ombro | 4x8-12 | Descanso: 90s
Elevação Lateral | 3x12-15 | Descanso: 60s
Tríceps Polia Alta | 3x12-15 | Descanso: 60s

DIA 2 - LOWER A (Quadríceps/Glúteos)
Agachamento Livre | 4x8-12 | Descanso: 120s
Leg Press 45° | 4x10-12 | Descanso: 90s
Extensão de Joelho | 3x12-15 | Descanso: 60s
Cadeira Flexora | 3x12-15 | Descanso: 60s
Panturrilha em Pé | 4x15-20 | Descanso: 45s

DIA 3 - DESCANSO

DIA 4 - UPPER B (Costas/Bíceps)
Barra Fixa Supinada | 4x6-10 | Descanso: 120s
Remada Curvada com Barra | 4x8-12 | Descanso: 90s
Puxada na Polia Alta | 3x10-12 | Descanso: 75s
Rosca Direta com Barra | 3x10-12 | Descanso: 60s
Rosca Martelo | 2x12-15 | Descanso: 60s

DIA 5 - LOWER B (Posterior/Glúteos)
Stiff com Haltere | 4x10-12 | Descanso: 90s
Agachamento Sumô | 3x12-15 | Descanso: 75s
Afundo com Haltere | 3x12 | Descanso: 75s
Mesa Flexora | 3x12-15 | Descanso: 60s
Panturrilha Sentado | 3x15-20 | Descanso: 45s

DIA 6 - DESCANSO
DIA 7 - DESCANSO`,
  },
  {
    id: 'ppl_5x',
    label: 'PPL 5×',
    badge: 'Intermediário',
    description: '5 dias · Push/Pull/Legs',
    txt: `DIA 1 - PUSH (Peito/Ombro/Tríceps)
Supino Reto com Barra | 4x6-10 | Descanso: 120s
Supino Inclinado Haltere | 3x10-12 | Descanso: 90s
Crossover Polia | 3x12-15 | Descanso: 60s
Desenvolvimento Ombro | 4x8-12 | Descanso: 90s
Elevação Lateral | 4x12-15 | Descanso: 60s
Tríceps Francês | 3x10-12 | Descanso: 60s
Tríceps Polia Alta | 3x12-15 | Descanso: 60s

DIA 2 - PULL (Costas/Bíceps)
Barra Fixa Pronada | 4x6-10 | Descanso: 120s
Remada Curvada com Barra | 4x8-10 | Descanso: 90s
Remada Unilateral Haltere | 3x10-12 | Descanso: 75s
Puxada Aberta | 3x12-15 | Descanso: 75s
Rosca Direta com Barra | 4x10-12 | Descanso: 60s
Rosca Martelo | 3x12-15 | Descanso: 60s

DIA 3 - LEGS (Quadríceps/Posterior/Glúteos)
Agachamento Livre | 4x6-10 | Descanso: 120s
Leg Press 45° | 4x10-12 | Descanso: 90s
Extensão de Joelho | 3x12-15 | Descanso: 60s
Stiff com Haltere | 4x10-12 | Descanso: 90s
Mesa Flexora | 3x12-15 | Descanso: 60s
Panturrilha em Pé | 4x15-20 | Descanso: 45s

DIA 4 - PUSH B (Peito/Ombro/Tríceps)
Supino Declinado | 4x8-12 | Descanso: 90s
Crucifixo com Haltere | 3x12-15 | Descanso: 75s
Desenvolvimento Arnold | 3x10-12 | Descanso: 90s
Elevação Frontal | 3x12-15 | Descanso: 60s
Tríceps Coice | 3x12-15 | Descanso: 60s

DIA 5 - PULL B (Costas/Bíceps)
Remada Cavalinho | 4x8-12 | Descanso: 90s
Puxada Triângulo | 3x10-12 | Descanso: 75s
Serrote Haltere | 3x10-12 | Descanso: 75s
Rosca Concentrada | 3x12-15 | Descanso: 60s
Rosca Spider | 3x12-15 | Descanso: 60s

DIA 6 - DESCANSO
DIA 7 - DESCANSO`,
  },
  {
    id: 'ppl_6x',
    label: 'PPL 6×',
    badge: 'Avançado',
    description: '6 dias · Push/Pull/Legs 2×',
    txt: `DIA 1 - PUSH A (Peito foco)
Supino Reto com Barra | 5x5 | Descanso: 120s
Supino Inclinado Haltere | 4x10-12 | Descanso: 90s
Crossover Polia | 3x12-15 | Descanso: 60s
Desenvolvimento Ombro | 4x8-12 | Descanso: 90s
Elevação Lateral | 4x15 | Descanso: 60s
Tríceps Francês | 4x10-12 | Descanso: 60s

DIA 2 - PULL A (Costas foco)
Barra Fixa | 5x5 | Descanso: 120s
Remada Curvada | 4x8-10 | Descanso: 90s
Puxada Aberta | 3x12-15 | Descanso: 75s
Rosca Direta | 4x10-12 | Descanso: 60s
Rosca Martelo | 3x12-15 | Descanso: 60s

DIA 3 - LEGS A (Quadríceps foco)
Agachamento Livre | 5x5 | Descanso: 120s
Leg Press 45° | 4x10-12 | Descanso: 90s
Hack Squat | 3x12-15 | Descanso: 90s
Extensão de Joelho | 3x15 | Descanso: 60s
Panturrilha em Pé | 5x15-20 | Descanso: 45s

DIA 4 - PUSH B (Ombro foco)
Desenvolvimento com Barra | 5x5 | Descanso: 120s
Supino Declinado | 4x8-12 | Descanso: 90s
Elevação Lateral | 5x15 | Descanso: 60s
Crucifixo Inclinado | 3x12-15 | Descanso: 75s
Tríceps Polia Alta | 4x12-15 | Descanso: 60s

DIA 5 - PULL B (Bíceps foco)
Remada Cavalinho | 4x8-12 | Descanso: 90s
Puxada Supinada | 4x10-12 | Descanso: 90s
Rosca Concentrada | 4x12-15 | Descanso: 60s
Rosca Spider | 3x12-15 | Descanso: 60s
Face Pull | 3x15 | Descanso: 60s

DIA 6 - LEGS B (Posterior foco)
Stiff | 5x5 | Descanso: 120s
Agachamento Sumô | 4x10-12 | Descanso: 90s
Mesa Flexora | 4x12-15 | Descanso: 60s
Afundo com Haltere | 3x12 | Descanso: 75s
Panturrilha Sentado | 4x15-20 | Descanso: 45s

DIA 7 - DESCANSO`,
  },
]

// Template de exemplo para o usuário (mantido para compatibilidade)
const TEMPLATE_EXAMPLE = TEMPLATES[1].txt

// Parser local (espelha a lógica do backend para preview imediato)
function parseWorkoutTxt(txt: string): ParsedPlan {
  const dayHeaderRegex = /^(?:DIA\s*)?(\d+)\s*[-–—:]\s*(.+)/im
  const exerciseRegex = /^(.+?)\s*\|\s*(\d+)x([\d-]+)(?:\s*\|\s*[Dd]escanso:\s*(\d+)s?)?/m

  const plan: ParsedPlan = { name: 'Plano Importado', days: [] }
  const lines = txt.split('\n').map((l) => l.trim()).filter((l) => l.length > 0)

  let currentDay: ParsedDay | null = null

  for (const line of lines) {
    // Cabeçalho de dia
    const dayMatch = line.match(dayHeaderRegex)
    if (dayMatch) {
      currentDay = {
        dayNumber: parseInt(dayMatch[1]),
        dayLabel: dayMatch[2].trim(),
        muscleGroups: dayMatch[2].trim(),
        isRestDay: /descanso|rest/i.test(dayMatch[2]),
        exercises: [],
      }
      plan.days.push(currentDay)
      continue
    }

    // Exercício
    if (currentDay && !currentDay.isRestDay) {
      const exMatch = line.match(exerciseRegex)
      if (exMatch) {
        currentDay.exercises.push({
          name: exMatch[1].trim(),
          sets: parseInt(exMatch[2]),
          reps: exMatch[3],
          restSeconds: exMatch[4] ? parseInt(exMatch[4]) : 60,
        })
      }
    }
  }

  return plan
}

// ─── Componente de preview de um dia ──────────────────────────────────────
function DayPreview({ day }: { day: ParsedDay }) {
  const [open, setOpen] = useState(false)

  return (
    <div className={`rounded-xl border transition-all ${day.isRestDay ? 'border-muted/50 opacity-60' : 'border-border'}`}>
      <button
        onClick={() => !day.isRestDay && setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
            {day.dayNumber}
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">{day.dayLabel}</p>
            {!day.isRestDay && (
              <p className="text-xs text-muted-foreground">{day.exercises.length} exercícios</p>
            )}
            {day.isRestDay && (
              <p className="text-xs text-muted-foreground">Dia de descanso</p>
            )}
          </div>
        </div>
        {!day.isRestDay && (
          <span className="text-muted-foreground text-xs">{open ? '▲' : '▼'}</span>
        )}
      </button>

      {open && !day.isRestDay && (
        <div className="px-3 pb-3 space-y-1 border-t border-border pt-2">
          {day.exercises.map((ex, i) => (
            <div key={i} className="flex items-center justify-between text-xs py-1">
              <span className="text-foreground">{ex.name}</span>
              <span className="text-muted-foreground font-mono">
                {ex.sets}×{ex.reps} · {ex.restSeconds}s
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Tipos do parser de dieta ──────────────────────────────────────────────

interface ParsedMeal {
  number: number
  name: string
  suggestedTime?: string
  kcal: number
  proteinG: number
  carbsG: number
  fatG: number
  foods: string[]
}

interface DietPreview {
  meals: ParsedMeal[]
  totals: { kcal: number; proteinG: number; carbsG: number; fatG: number }
  macrosSumValid: boolean
  ignoredLines: number
}

export default function ImportPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'workout' | 'diet'>('workout')

  // — Workout state —
  const [txt, setTxt] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [preview, setPreview] = useState<ParsedPlan | null>(null)
  const [planName, setPlanName] = useState('Meu Plano de Treino')
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // — Diet state —
  const [dietTxt, setDietTxt] = useState('')
  const [dietPreview, setDietPreview] = useState<DietPreview | null>(null)
  const [isDietParsing, setIsDietParsing] = useState(false)
  const [isDietImporting, setIsDietImporting] = useState(false)
  const [dietError, setDietError] = useState('')
  const [dietSuccess, setDietSuccess] = useState(false)

  const applyTemplate = (t: WorkoutTemplate) => {
    setSelectedTemplate(t.id)
    setTxt(t.txt)
    setPlanName(t.label)
    setPreview(null)
    setError('')
  }

  const handleParse = () => {
    if (!txt.trim()) {
      setError('Cole seu plano de treino no campo acima ou escolha um template.')
      return
    }
    setError('')
    const parsed = parseWorkoutTxt(txt)
    if (parsed.days.length === 0) {
      setError('Não foi possível identificar nenhum dia de treino. Use o formato do exemplo.')
      return
    }
    setPreview(parsed)
  }

  const handleImport = async () => {
    if (!preview) return
    setIsImporting(true)
    setError('')

    try {
      // Chama o backend que re-parsea o TXT e persiste
      await api.post('api/import/workout', { rawTxt: txt, name: planName })
      setSuccess(true)
      setTimeout(() => router.push('/workout'), 1500)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao importar')
      setIsImporting(false)
    }
  }

  // ── Diet handlers ────────────────────────────────────────────────────────

  const handleDietParse = async () => {
    if (!dietTxt.trim()) {
      setDietError('Cole seu plano alimentar no campo acima.')
      return
    }
    setDietError('')
    setIsDietParsing(true)
    try {
      const result = await api.post<DietPreview>('api/import/diet/preview', { rawTxt: dietTxt })
      if (!result.meals || result.meals.length === 0) {
        setDietError('Nenhuma refeição reconhecida. Use o formato do exemplo.')
        return
      }
      setDietPreview(result)
    } catch (err: unknown) {
      setDietError(err instanceof Error ? err.message : 'Erro ao parsear')
    } finally {
      setIsDietParsing(false)
    }
  }

  const handleDietImport = async () => {
    if (!dietPreview) return
    setIsDietImporting(true)
    setDietError('')
    try {
      await api.post('api/import/diet', { rawTxt: dietTxt })
      setDietSuccess(true)
      setTimeout(() => router.push('/nutrition'), 1500)
    } catch (err: unknown) {
      setDietError(err instanceof Error ? err.message : 'Erro ao importar')
      setIsDietImporting(false)
    }
  }

  return (
    <div className="px-4 pt-4 pb-8 space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Importar</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl">
        {(['workout', 'diet'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              activeTab === tab
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'workout' ? '⚔️ Treino' : '🥗 Dieta'}
          </button>
        ))}
      </div>

      {/* ─── ABA DIETA ──────────────────────────────────────────────────────── */}
      {activeTab === 'diet' && (
        <div className="space-y-4">
          <details className="hunter-card">
            <summary className="text-xs text-muted-foreground cursor-pointer select-none">
              📋 Ver formato aceito
            </summary>
            <div className="font-mono text-xs bg-muted/40 rounded-lg p-2 space-y-0.5 text-[11px] mt-2">
              <p className="text-blue-400">Refeição 1 - Café da manhã (07h)</p>
              <p>Ovos mexidos com aveia</p>
              <p className="text-green-400">Proteína: 30g · Carbs: 45g · Gordura: 12g · 410kcal</p>
              <p className="text-blue-400 mt-1">Refeição 2 - Almoço (12h)</p>
              <p>Frango grelhado, arroz, feijão, salada</p>
              <p className="text-green-400">P: 50g · C: 80g · G: 15g · 655kcal</p>
              <p className="text-amber-400 mt-1">Total: P: 180g · C: 220g · G: 70g · 2450kcal</p>
            </div>
          </details>

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Cole seu plano alimentar aqui</label>
            <textarea
              value={dietTxt}
              onChange={(e) => { setDietTxt(e.target.value); setDietPreview(null) }}
              placeholder="Refeição 1 - Café da manhã..."
              rows={10}
              className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground font-mono placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">{dietTxt.length} caracteres</p>
          </div>

          {dietError && (
            <div className="bg-destructive/15 border border-destructive/30 text-destructive text-sm rounded-lg px-3 py-2">
              {dietError}
            </div>
          )}

          {!dietPreview && !dietSuccess && (
            <button
              onClick={handleDietParse}
              disabled={isDietParsing}
              className="w-full py-3.5 bg-primary/20 text-primary border border-primary/30 rounded-xl font-bold text-sm active:scale-95 transition-transform disabled:opacity-60"
            >
              {isDietParsing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  Analisando...
                </span>
              ) : '🔍 Pré-visualizar plano alimentar'}
            </button>
          )}

          {dietPreview && !dietSuccess && (
            <div className="space-y-3">
              {/* Totais */}
              <div className="hunter-card">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono mb-2">Totais</p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: 'Kcal',  value: dietPreview.totals.kcal,     unit: '' },
                    { label: 'Prot',  value: dietPreview.totals.proteinG, unit: 'g' },
                    { label: 'Carbs', value: dietPreview.totals.carbsG,   unit: 'g' },
                    { label: 'Gord',  value: dietPreview.totals.fatG,     unit: 'g' },
                  ].map(({ label, value, unit }) => (
                    <div key={label}>
                      <p className="text-lg font-bold text-foreground">{Math.round(value)}{unit}</p>
                      <p className="text-[10px] text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>
                {!dietPreview.macrosSumValid && (
                  <p className="text-xs text-amber-400 mt-2">
                    ⚠️ Soma dos macros difere do total declarado em mais de 10 kcal
                  </p>
                )}
              </div>

              {/* Refeições */}
              <div className="space-y-2">
                {dietPreview.meals.map((meal) => (
                  <div key={meal.number} className="hunter-card space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-foreground">
                        {meal.number}. {meal.name}
                        {meal.suggestedTime && (
                          <span className="text-xs text-muted-foreground ml-1">({meal.suggestedTime})</span>
                        )}
                      </p>
                      <span className="text-xs font-bold text-primary">{meal.kcal} kcal</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      P: {meal.proteinG.toFixed(0)}g · C: {meal.carbsG.toFixed(0)}g · G: {meal.fatG.toFixed(0)}g
                    </p>
                    {meal.foods.length > 0 && (
                      <p className="text-[11px] text-muted-foreground/60 italic">
                        {meal.foods.slice(0, 2).join(', ')}{meal.foods.length > 2 ? '...' : ''}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setDietPreview(null)}
                  className="flex-1 py-2.5 border border-border text-muted-foreground rounded-xl text-sm font-medium"
                >
                  Editar texto
                </button>
                <button
                  onClick={handleDietImport}
                  disabled={isDietImporting}
                  className="flex-1 py-2.5 bg-primary text-white rounded-xl font-bold text-sm active:scale-95 transition-transform disabled:opacity-60"
                >
                  {isDietImporting ? 'Importando...' : '🥗 Importar dieta'}
                </button>
              </div>
            </div>
          )}

          {dietSuccess && (
            <div className="hunter-card border-green-700/50 bg-green-950/20 text-center py-6 space-y-2">
              <p className="text-3xl">✅</p>
              <p className="text-sm font-bold text-green-400">Plano alimentar importado!</p>
              <p className="text-xs text-muted-foreground">Redirecionando para Nutrição...</p>
            </div>
          )}
        </div>
      )}

      {/* ─── ABA TREINO (existente) ─────────────────────────────────────────── */}
      {activeTab === 'workout' && (<>

      {/* Templates pré-definidos */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono">
          ⚡ Escolha um template pronto — ou cole o seu abaixo
        </p>
        <div className="grid grid-cols-2 gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => applyTemplate(t)}
              className={`text-left p-3 rounded-xl border transition-all ${
                selectedTemplate === t.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-muted/10 hover:border-primary/40'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${
                  t.badge === 'Iniciante' ? 'bg-green-500/20 text-green-400' :
                  t.badge === 'Iniciante+' ? 'bg-blue-500/20 text-blue-400' :
                  t.badge === 'Intermediário' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {t.badge}
                </span>
              </div>
              <p className="text-sm font-bold text-foreground">{t.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Divisor */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">ou cole seu próprio</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Formato aceito — colapsável para não poluir */}
      <details className="hunter-card">
        <summary className="text-xs text-muted-foreground cursor-pointer select-none">
          📋 Ver formato aceito
        </summary>
        <div className="font-mono text-xs bg-muted/40 rounded-lg p-2 space-y-0.5 text-[11px] mt-2">
          <p className="text-blue-400">DIA 1 - PUSH (Peito/Ombro)</p>
          <p>Supino Reto | <span className="text-green-400">4x8-12</span> | <span className="text-amber-400">Descanso: 90s</span></p>
          <p className="text-blue-400 mt-1">DIA 2 - PULL [Costas/Bíceps]</p>
          <p>Remada Curvada | <span className="text-green-400">4x8-10</span></p>
          <p className="text-muted-foreground mt-1">DIA 7 - DESCANSO</p>
        </div>
      </details>

      {/* Textarea */}
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">
          {selectedTemplate ? 'Template selecionado (edite se quiser)' : 'Cole seu plano aqui'}
        </label>
        <textarea
          value={txt}
          onChange={(e) => { setTxt(e.target.value); setPreview(null) }}
          placeholder="DIA 1 - PUSH..."
          rows={10}
          className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground font-mono placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
        />
        <p className="text-xs text-muted-foreground text-right">{txt.length} caracteres</p>
      </div>

      {error && (
        <div className="bg-destructive/15 border border-destructive/30 text-destructive text-sm rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {/* Botão preview */}
      {!preview && (
        <button
          onClick={handleParse}
          className="w-full py-3.5 bg-primary/20 text-primary border border-primary/30 rounded-xl font-bold text-sm active:scale-95 transition-transform"
        >
          🔍 Pré-visualizar plano
        </button>
      )}

      {/* Preview */}
      {preview && !success && (
        <div className="space-y-4">
          {/* Nome do plano */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Nome do plano</label>
            <input
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              className="w-full bg-input border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Dias detectados */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">
                {preview.days.length} dias detectados
              </p>
              <button
                onClick={() => setPreview(null)}
                className="text-xs text-muted-foreground underline"
              >
                Editar texto
              </button>
            </div>
            {preview.days.map((day) => (
              <DayPreview key={day.dayNumber} day={day} />
            ))}
          </div>

          {/* Confirmar importação */}
          <button
            onClick={handleImport}
            disabled={isImporting}
            className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm active:scale-95 transition-transform disabled:opacity-60"
          >
            {isImporting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Importando...
              </span>
            ) : (
              '⚔️ Importar para o Sistema'
            )}
          </button>
        </div>
      )}

      {success && (
        <div className="hunter-card border-green-700/50 bg-green-950/20 text-center py-6 space-y-2">
          <p className="text-3xl">✅</p>
          <p className="text-sm font-bold text-green-400">Plano importado com sucesso!</p>
          <p className="text-xs text-muted-foreground">Redirecionando para Treinos...</p>
        </div>
      )}
      </>)}
    </div>
  )
}
