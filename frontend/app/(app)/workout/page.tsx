import { Suspense } from 'react'
import Link from 'next/link'

// TODO: fetch from API/Dexie
const mockWorkoutDays = [
  { id: '1', label: 'Push A — Peito, Ombro, Tríceps', dayNumber: 1, isRestDay: false },
  { id: '2', label: 'Pull A — Costas, Bíceps', dayNumber: 2, isRestDay: false },
  { id: '3', label: 'Legs A — Quadríceps, Glúteo', dayNumber: 3, isRestDay: false },
  { id: '4', label: 'Upper — Força', dayNumber: 4, isRestDay: false },
  { id: '5', label: 'Lower — Força', dayNumber: 5, isRestDay: false },
  { id: '6', label: 'Cardio + Mobilidade', dayNumber: 6, isRestDay: false },
  { id: '7', label: 'Descanso', dayNumber: 7, isRestDay: true },
]

export default function WorkoutPage() {
  return (
    <div className="px-4 pt-4 pb-6 space-y-3 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Treinos</h1>
        <Link
          href="/workout/history"
          className="text-xs text-muted-foreground border border-border rounded-lg px-3 py-1.5"
        >
          Histórico
        </Link>
      </div>

      {mockWorkoutDays.map((day) => (
        <Link key={day.id} href={day.isRestDay ? '#' : `/workout/${day.id}`}>
          <div
            className={`hunter-card flex items-center gap-3 cursor-pointer transition-all active:scale-95 ${
              day.isRestDay ? 'opacity-50 cursor-default' : 'hover:border-primary/50'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
              {day.dayNumber}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{day.label}</p>
              {day.isRestDay && (
                <p className="text-xs text-muted-foreground">Dia de descanso</p>
              )}
            </div>
            {!day.isRestDay && (
              <div className="text-primary text-lg">▶</div>
            )}
          </div>
        </Link>
      ))}

      {/* Import de plano */}
      <Link href="/import">
        <div className="hunter-card border-dashed border-2 border-border flex items-center justify-center gap-2 py-4 text-muted-foreground text-sm cursor-pointer hover:border-primary/50 transition-colors">
          <span>+</span>
          <span>Importar plano de treino (.txt)</span>
        </div>
      </Link>
    </div>
  )
}
