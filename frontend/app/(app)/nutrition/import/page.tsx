'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { AiImageUploader } from '@/components/ai/AiImageUploader'

interface ExtractedNutrition {
  mealName?: string
  kcalPer100g?: number
  proteinPer100g?: number
  carbsPer100g?: number
  fatPer100g?: number
  servingSizeG?: number
  kcalPerServing?: number
  proteinPerServing?: number
  carbsPerServing?: number
  fatPerServing?: number
}

interface ScanResponse {
  extracted: ExtractedNutrition & { rawJson: string }
  isValid: boolean
  validationWarning?: string
}

// ─── Form de confirmação ──────────────────────────────────────────────────────
function ConfirmForm({
  extracted,
  onConfirm,
  saving,
}: {
  extracted: ScanResponse
  onConfirm: (data: { mealName: string; kcalConsumed: number; proteinG: number; carbsG: number; fatG: number }) => void
  saving: boolean
}) {
  const ex = extracted.extracted
  const [mealName,  setMealName]  = useState(ex.mealName ?? '')
  const [kcal,      setKcal]      = useState(ex.kcalPerServing ?? ex.kcalPer100g ?? 0)
  const [protein,   setProtein]   = useState(ex.proteinPerServing ?? ex.proteinPer100g ?? 0)
  const [carbs,     setCarbs]     = useState(ex.carbsPerServing ?? ex.carbsPer100g ?? 0)
  const [fat,       setFat]       = useState(ex.fatPerServing ?? ex.fatPer100g ?? 0)
  const [qty,       setQty]       = useState(ex.servingSizeG ?? 100)

  // Recalcula macros quando a quantidade muda
  const scale = qty / (ex.servingSizeG ?? 100)
  const scaledKcal    = Math.round((ex.kcalPerServing    ?? ex.kcalPer100g    ?? 0) * scale)
  const scaledProtein = +((ex.proteinPerServing ?? ex.proteinPer100g ?? 0) * scale).toFixed(1)
  const scaledCarbs   = +((ex.carbsPerServing   ?? ex.carbsPer100g   ?? 0) * scale).toFixed(1)
  const scaledFat     = +((ex.fatPerServing     ?? ex.fatPer100g     ?? 0) * scale).toFixed(1)

  return (
    <div className="space-y-4">
      {extracted.validationWarning && (
        <div className="hunter-card border-amber-700/40 bg-amber-950/20">
          <p className="text-xs text-amber-400">⚠️ {extracted.validationWarning}</p>
        </div>
      )}

      <div className="hunter-card space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Dados extraídos — ajuste se necessário</h2>

        {/* Nome */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Nome do alimento/refeição</label>
          <input
            value={mealName}
            onChange={(e) => setMealName(e.target.value)}
            placeholder="Ex: Frango grelhado"
            className="w-full bg-input border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Quantidade */}
        {ex.servingSizeG && (
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Quantidade consumida (g)</label>
            <input
              type="number"
              value={qty}
              onChange={(e) => setQty(parseFloat(e.target.value) || 100)}
              className="w-full bg-input border border-border rounded-lg px-2 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        )}

        {/* Macros escalados */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Calorias (kcal)', value: scaledKcal,    color: 'text-orange-400' },
            { label: 'Proteína (g)',    value: scaledProtein,  color: 'text-green-400'  },
            { label: 'Carboidratos (g)',value: scaledCarbs,    color: 'text-blue-400'   },
            { label: 'Gordura (g)',     value: scaledFat,      color: 'text-amber-400'  },
          ].map(({ label, value, color }) => (
            <div key={label} className="hunter-card text-center py-2">
              <p className={`text-lg font-bold font-mono ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => onConfirm({
          mealName:     mealName || 'Refeição',
          kcalConsumed: scaledKcal,
          proteinG:     scaledProtein,
          carbsG:       scaledCarbs,
          fatG:         scaledFat,
        })}
        disabled={saving}
        className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm disabled:opacity-60 active:scale-95 transition-transform"
      >
        {saving ? 'Salvando...' : '✓ Adicionar ao Registro de Hoje'}
      </button>
    </div>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────
export default function NutritionImportPage() {
  const router = useRouter()
  const qc = useQueryClient()
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleCapture = async (base64: string, mimeType: string) => {
    setScanning(true)
    setError('')
    setScanResult(null)

    try {
      const res = await api.post<ScanResponse>('api/ai/nutrition/scan', { base64Image: base64, mimeType })
      setScanResult(res)
    } catch {
      setError('Erro ao analisar imagem. Tente uma foto mais nítida do rótulo.')
    } finally {
      setScanning(false)
    }
  }

  const handleConfirm = async (data: {
    mealName: string; kcalConsumed: number; proteinG: number; carbsG: number; fatG: number
  }) => {
    setSaving(true)
    try {
      await api.post('api/ai/nutrition/confirm', data)
      await qc.invalidateQueries({ queryKey: ['nutrition', 'today'] })
      setSuccess(true)
      setTimeout(() => router.push('/nutrition'), 1500)
    } catch {
      setError('Erro ao salvar. Tente novamente.')
      setSaving(false)
    }
  }

  return (
    <div className="px-4 pt-4 pb-8 space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">📸 IA Import — Nutrição</h1>
        <Link href="/nutrition" className="text-xs text-muted-foreground border border-border rounded-lg px-3 py-1.5">
          ← Voltar
        </Link>
      </div>

      <div className="hunter-card text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">O que funciona:</p>
        <p>• Foto de rótulo nutricional de embalagem</p>
        <p>• Foto de prato/refeição (estimativa)</p>
        <p>• Screenshot de app de nutrição</p>
      </div>

      <AiImageUploader onCapture={handleCapture} isLoading={scanning} />

      {error && (
        <div className="bg-destructive/15 border border-destructive/30 text-destructive text-sm rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {scanResult && !success && (
        <ConfirmForm
          extracted={scanResult}
          onConfirm={handleConfirm}
          saving={saving}
        />
      )}

      {success && (
        <div className="hunter-card border-green-700/50 bg-green-950/20 text-center py-6 space-y-2">
          <p className="text-3xl">✅</p>
          <p className="text-sm font-bold text-green-400">Refeição registrada!</p>
          <p className="text-xs text-muted-foreground">Voltando para nutrição...</p>
        </div>
      )}
    </div>
  )
}
