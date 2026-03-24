'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api/client'
import { AiImageUploader } from '@/components/ai/AiImageUploader'

interface ExtractedBody {
  weightKg?: number
  bodyFatPct?: number
  muscleMassKg?: number
  waterPct?: number
  boneMassKg?: number
  visceralFatLevel?: number
  bmi?: number
  basalMetabolicRate?: number
  waistCm?: number
}

interface ScanResponse {
  extracted: ExtractedBody & { rawJson: string }
  isValid: boolean
  validationWarning?: string
}

export default function BodyImportPage() {
  const router = useRouter()
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null)
  const [form, setForm] = useState<ExtractedBody>({})
  const [rawJson, setRawJson] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleCapture = async (base64: string, mimeType: string) => {
    setScanning(true)
    setError('')
    setScanResult(null)

    try {
      const res = await api.post<ScanResponse>('api/ai/body/scan', { base64Image: base64, mimeType })
      setScanResult(res)
      setForm({ ...res.extracted })
      setRawJson(res.extracted.rawJson ?? '')
    } catch (err) {
      setError('Erro ao analisar imagem. Verifique a qualidade da foto e tente novamente.')
    } finally {
      setScanning(false)
    }
  }

  const handleConfirm = async () => {
    setSaving(true)
    setError('')
    try {
      await api.post('api/ai/body/confirm', { ...form, notes, rawJson })
      setSuccess(true)
      setTimeout(() => router.push('/body'), 1500)
    } catch {
      setError('Erro ao salvar. Tente novamente.')
      setSaving(false)
    }
  }

  const fields: { key: keyof ExtractedBody; label: string; unit: string }[] = [
    { key: 'weightKg',          label: 'Peso',              unit: 'kg'      },
    { key: 'bodyFatPct',        label: '% Gordura',          unit: '%'       },
    { key: 'muscleMassKg',      label: 'Massa Muscular',     unit: 'kg'      },
    { key: 'waterPct',          label: '% Água',             unit: '%'       },
    { key: 'boneMassKg',        label: 'Massa Óssea',        unit: 'kg'      },
    { key: 'visceralFatLevel',  label: 'Gordura Visceral',   unit: 'nível'   },
    { key: 'bmi',               label: 'IMC',                unit: ''        },
    { key: 'basalMetabolicRate',label: 'TMB',                unit: 'kcal'    },
  ]

  return (
    <div className="px-4 pt-4 pb-8 space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">📸 IA Scan — Corpo</h1>
        <Link href="/body" className="text-xs text-muted-foreground border border-border rounded-lg px-3 py-1.5">
          ← Voltar
        </Link>
      </div>

      <div className="hunter-card text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">Como usar:</p>
        <p>1. Tire uma foto da tela da balança de bioimpedância</p>
        <p>2. A IA extrai os dados automaticamente</p>
        <p>3. Revise os valores antes de confirmar</p>
        <p className="text-amber-400">⚠️ Nunca salva sem a sua aprovação</p>
      </div>

      <AiImageUploader onCapture={handleCapture} isLoading={scanning} />

      {error && (
        <div className="bg-destructive/15 border border-destructive/30 text-destructive text-sm rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {scanResult && !success && (
        <div className="space-y-4">
          {scanResult.validationWarning && (
            <div className="hunter-card border-amber-700/40 bg-amber-950/20">
              <p className="text-xs text-amber-400">⚠️ {scanResult.validationWarning}</p>
            </div>
          )}

          <div className="hunter-card space-y-2">
            <h2 className="text-sm font-semibold text-foreground">Dados extraídos — revise antes de salvar</h2>

            <div className="grid grid-cols-2 gap-2">
              {fields.map(({ key, label, unit }) => (
                <div key={key} className="space-y-1">
                  <label className="text-xs text-muted-foreground">
                    {label}{unit && ` (${unit})`}
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={form[key] ?? ''}
                    onChange={(e) => setForm((p) => ({
                      ...p,
                      [key]: e.target.value ? parseFloat(e.target.value) : undefined,
                    }))}
                    className="w-full bg-input border border-border rounded-lg px-2 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              ))}
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Observações (opcional)</label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: medição em jejum"
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <button
            onClick={handleConfirm}
            disabled={saving}
            className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm disabled:opacity-60 active:scale-95 transition-transform"
          >
            {saving ? 'Salvando...' : '✓ Confirmar e Salvar Medição'}
          </button>
        </div>
      )}

      {success && (
        <div className="hunter-card border-green-700/50 bg-green-950/20 text-center py-6 space-y-2">
          <p className="text-3xl">✅</p>
          <p className="text-sm font-bold text-green-400">Medição salva com sucesso!</p>
          <p className="text-xs text-muted-foreground">Redirecionando...</p>
        </div>
      )}
    </div>
  )
}
