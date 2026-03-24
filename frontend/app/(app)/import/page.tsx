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

// Template de exemplo para o usuário
const TEMPLATE_EXAMPLE = `DIA 1 - PUSH (Peito/Ombro/Tríceps)
Supino Reto com Barra | 4x8-12 | Descanso: 90s
Supino Inclinado Haltere | 3x10-12 | Descanso: 75s
Desenvolvimento Ombro | 4x8-12 | Descanso: 90s
Elevação Lateral | 3x12-15 | Descanso: 60s
Tríceps Polia Alta | 3x12-15 | Descanso: 60s

DIA 2 - PULL [Costas/Bíceps]
Barra Fixa Supinada | 4x6-10 | Descanso: 120s
Remada Curvada com Barra | 4x8-12 | Descanso: 90s
Puxada na Polia Alta | 3x10-12 | Descanso: 75s
Rosca Direta com Barra | 3x10-12 | Descanso: 60s

DIA 3 - LEGS (Quadríceps/Glúteos)
Agachamento Livre | 4x6-10 | Descanso: 120s
Leg Press 45° | 4x10-12 | Descanso: 90s
Extensão de Joelho | 3x12-15 | Descanso: 60s
Cadeira Flexora | 3x12-15 | Descanso: 60s

DIA 7 - DESCANSO`

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

export default function ImportPage() {
  const router = useRouter()
  const [txt, setTxt] = useState('')
  const [preview, setPreview] = useState<ParsedPlan | null>(null)
  const [planName, setPlanName] = useState('Meu Plano de Treino')
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleParse = () => {
    if (!txt.trim()) {
      setError('Cole seu plano de treino no campo acima.')
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

  const useExample = () => {
    setTxt(TEMPLATE_EXAMPLE)
    setPreview(null)
    setError('')
    setSuccess(false)
  }

  return (
    <div className="px-4 pt-4 pb-8 space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Importar Treino</h1>
        <button onClick={useExample} className="text-xs text-primary border border-primary/30 rounded-lg px-3 py-1.5">
          Ver exemplo
        </button>
      </div>

      {/* Instruções */}
      <div className="hunter-card space-y-2 text-sm text-muted-foreground">
        <p className="font-medium text-foreground text-xs uppercase tracking-wide">Formato aceito</p>
        <div className="font-mono text-xs bg-muted/40 rounded-lg p-2 space-y-0.5 text-[11px]">
          <p className="text-blue-400">DIA 1 - PUSH (Peito/Ombro)</p>
          <p>Supino Reto | <span className="text-green-400">4x8-12</span> | <span className="text-amber-400">Descanso: 90s</span></p>
          <p className="text-blue-400 mt-1">DIA 2 - PULL [Costas/Bíceps]</p>
          <p>Remada Curvada | <span className="text-green-400">4x8-10</span></p>
        </div>
      </div>

      {/* Textarea */}
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Cole seu plano aqui</label>
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
    </div>
  )
}
