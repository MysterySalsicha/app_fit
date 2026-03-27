'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import Link from 'next/link'

interface PlateConfig {
  availablePlatesKg: number[]
  barbellWeightKg: number
}

// ─── Algoritmo greedy: divide o peso restante por lado pelas anilhas disponíveis
function calculatePlates(
  targetKg: number,
  barbellKg: number,
  availablePlates: number[]
): { plate: number; count: number }[] | null {
  const weightPerSide = (targetKg - barbellKg) / 2
  if (weightPerSide < 0) return null // alvo menor que a barra

  const plates = [...availablePlates].sort((a, b) => b - a) // decrescente
  let remaining = weightPerSide
  const result: { plate: number; count: number }[] = []

  for (const plate of plates) {
    if (remaining <= 0) break
    const count = Math.floor(remaining / plate)
    if (count > 0) {
      result.push({ plate, count })
      remaining = Math.round((remaining - plate * count) * 1000) / 1000
    }
  }

  if (remaining > 0.001) return null // não é possível montar exatamente
  return result
}

// ─── Formatação bonita do peso
function fmt(n: number) {
  return Number.isInteger(n) ? `${n}` : `${n}`
}

const DEFAULT_PLATES = [20, 10, 5, 2.5, 1.25, 1, 0.5]

export default function PlateCalculatorPage() {
  const qc = useQueryClient()

  const { data: config, isLoading } = useQuery<PlateConfig>({
    queryKey: ['hunter', 'plate-config'],
    queryFn: () => api.get<PlateConfig>('api/hunter/plate-config'),
    staleTime: 5 * 60_000,
  })

  const saveMutation = useMutation({
    mutationFn: (dto: { availablePlatesKg: number[]; barbellWeightKg: number }) =>
      api.put('api/hunter/plate-config', dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hunter', 'plate-config'] }),
  })

  const [targetKg, setTargetKg]         = useState('')
  const [barbellKg, setBarbellKg]       = useState(20)
  const [plates, setPlates]             = useState<number[]>(DEFAULT_PLATES)
  const [showConfig, setShowConfig]     = useState(false)
  const [newPlate, setNewPlate]         = useState('')

  // Sincroniza com dados do servidor
  useEffect(() => {
    if (config) {
      setBarbellKg(config.barbellWeightKg)
      setPlates(config.availablePlatesKg)
    }
  }, [config])

  const target      = parseFloat(targetKg) || 0
  const calculation = target > 0 ? calculatePlates(target, barbellKg, plates) : null
  const isPossible  = calculation !== null
  const totalLoaded = calculation
    ? barbellKg + calculation.reduce((s, { plate, count }) => s + plate * count * 2, 0)
    : 0

  function handleAddPlate() {
    const v = parseFloat(newPlate)
    if (!v || v <= 0) return
    if (!plates.includes(v)) setPlates([...plates, v].sort((a, b) => b - a))
    setNewPlate('')
  }

  function handleRemovePlate(p: number) {
    setPlates(plates.filter((x) => x !== p))
  }

  function handleSaveConfig() {
    saveMutation.mutate({ availablePlatesKg: plates, barbellWeightKg: barbellKg })
    setShowConfig(false)
  }

  return (
    <div className="px-4 pt-4 pb-8 space-y-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Calculadora de Anilhas</h1>
        <Link
          href="/workout"
          className="text-xs text-muted-foreground border border-border rounded-lg px-3 py-1.5"
        >
          ← Voltar
        </Link>
      </div>

      {/* Narrativa */}
      <div className="system-notification">
        <p className="text-xs text-blue-400 mb-1 font-mono uppercase tracking-widest">Sistema</p>
        <p className="text-sm font-bold text-white mb-1">CALCULADORA DE ANILHAS</p>
        <p className="text-xs text-blue-200">
          &quot;Monte o equipamento, Caçador. O Sistema calculou a carga ideal.&quot;
        </p>
      </div>

      {/* Input de peso alvo */}
      <div className="hunter-card space-y-3">
        <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono">
          Peso Alvo (kg)
        </label>
        <input
          type="number"
          min={0}
          step={0.5}
          value={targetKg}
          onChange={(e) => setTargetKg(e.target.value)}
          placeholder="Ex: 102.5"
          className="w-full bg-background border border-border rounded-lg px-4 py-3 text-2xl font-bold text-foreground text-center focus:outline-none focus:border-primary"
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Barra: <strong className="text-foreground">{barbellKg} kg</strong></span>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="text-primary underline"
          >
            {showConfig ? 'Fechar config' : '⚙️ Configurar'}
          </button>
        </div>
      </div>

      {/* Configuração de anilhas */}
      {showConfig && (
        <div className="hunter-card space-y-3">
          <p className="text-sm font-bold text-foreground">Configuração da Academia</p>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Peso da barra (kg)</label>
            <input
              type="number"
              min={0}
              step={0.5}
              value={barbellKg}
              onChange={(e) => setBarbellKg(parseFloat(e.target.value) || 20)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Anilhas disponíveis (kg)</label>
            <div className="flex flex-wrap gap-1.5">
              {plates.map((p) => (
                <button
                  key={p}
                  onClick={() => handleRemovePlate(p)}
                  className="text-xs px-2 py-1 rounded-full bg-muted border border-border text-foreground hover:bg-red-900/30 hover:border-red-500/50 hover:text-red-400 transition-colors"
                >
                  {fmt(p)} kg ×
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <input
                type="number"
                min={0}
                step={0.25}
                value={newPlate}
                onChange={(e) => setNewPlate(e.target.value)}
                placeholder="Adicionar anilha..."
                className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                onKeyDown={(e) => e.key === 'Enter' && handleAddPlate()}
              />
              <button
                onClick={handleAddPlate}
                className="px-3 py-2 bg-primary/20 border border-primary/40 text-primary rounded-lg text-sm font-bold"
              >
                +
              </button>
            </div>
          </div>

          <button
            onClick={handleSaveConfig}
            disabled={saveMutation.isPending}
            className="w-full py-2 bg-primary text-white rounded-lg text-sm font-bold disabled:opacity-50"
          >
            {saveMutation.isPending ? 'Salvando...' : 'Salvar Configuração'}
          </button>
        </div>
      )}

      {/* Resultado */}
      {target > 0 && (
        <div className="hunter-card space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono">
              Resultado
            </p>
            <span className="text-xs font-bold text-foreground">
              Meta: {fmt(target)} kg
            </span>
          </div>

          {!isPossible ? (
            <div className="text-center py-4">
              <p className="text-2xl mb-1">⚠️</p>
              <p className="text-sm text-amber-400 font-medium">
                Não é possível montar exatamente {fmt(target)} kg
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Verifique as anilhas disponíveis ou ajuste o peso.
              </p>
            </div>
          ) : (
            <>
              {/* Visualização da barra */}
              <div className="flex items-center justify-center gap-1 py-2">
                <div className="w-3 h-10 bg-muted-foreground/40 rounded-l-sm" />
                {calculation?.map(({ plate, count }, i) =>
                  Array.from({ length: count }).map((_, j) => (
                    <div
                      key={`${i}-${j}`}
                      className="rounded-sm border"
                      style={{
                        width: `${Math.max(8, plate * 1.8)}px`,
                        height: `${Math.min(56, 24 + plate * 2)}px`,
                        backgroundColor: plateColor(plate) + '40',
                        borderColor: plateColor(plate),
                      }}
                    />
                  ))
                )}
                <div className="w-16 h-4 bg-muted-foreground/60 rounded" />
                {calculation?.slice().reverse().map(({ plate, count }, i) =>
                  Array.from({ length: count }).map((_, j) => (
                    <div
                      key={`r-${i}-${j}`}
                      className="rounded-sm border"
                      style={{
                        width: `${Math.max(8, plate * 1.8)}px`,
                        height: `${Math.min(56, 24 + plate * 2)}px`,
                        backgroundColor: plateColor(plate) + '40',
                        borderColor: plateColor(plate),
                      }}
                    />
                  ))
                )}
                <div className="w-3 h-10 bg-muted-foreground/40 rounded-r-sm" />
              </div>

              {/* Lista de anilhas por lado */}
              <div className="space-y-1 border-t border-border pt-3">
                <p className="text-xs text-muted-foreground font-medium mb-2">Por lado:</p>
                {calculation?.map(({ plate, count }) => (
                  <div key={plate} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full border"
                        style={{
                          backgroundColor: plateColor(plate) + '40',
                          borderColor: plateColor(plate),
                        }}
                      />
                      <span className="text-sm text-foreground font-medium">
                        {fmt(plate)} kg
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      × {count} anilha{count > 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="text-xs text-muted-foreground">Total na barra</span>
                <span className="text-base font-bold text-primary">{fmt(totalLoaded)} kg</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Empty state */}
      {!target && (
        <div className="hunter-card text-center py-8">
          <p className="text-4xl mb-3">🏋️</p>
          <p className="text-sm text-muted-foreground">
            Digite o peso alvo para calcular as anilhas.
          </p>
        </div>
      )}
    </div>
  )
}

// Mapa de cores por anilha (padrão olímpico)
function plateColor(kg: number): string {
  if (kg >= 25) return '#ef4444'   // vermelho
  if (kg >= 20) return '#3b82f6'   // azul
  if (kg >= 15) return '#eab308'   // amarelo
  if (kg >= 10) return '#22c55e'   // verde
  if (kg >= 5)  return '#ffffff'   // branco
  if (kg >= 2)  return '#f97316'   // laranja
  if (kg >= 1)  return '#a78bfa'   // roxo claro
  return '#9ca3af'                  // cinza (fracionário)
}
