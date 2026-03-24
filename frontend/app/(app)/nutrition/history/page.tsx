'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { api } from '@/lib/api/client'

interface DayEntry {
  date: string
  kcal: number
  proteinG: number
  carbsG: number
  fatG: number
  waterMl: number
}

interface HistoryResponse {
  days: DayEntry[]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-lg p-2 text-xs space-y-1">
      <p className="text-muted-foreground font-medium">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

export default function NutritionHistoryPage() {
  const { data, isLoading } = useQuery<HistoryResponse>({
    queryKey: ['nutrition', 'history'],
    queryFn: () => api.get<HistoryResponse>('api/nutrition/history?days=30'),
    staleTime: 300_000,
  })

  const chartData = (data?.days ?? []).map((d) => ({
    date:     formatDate(d.date),
    Kcal:     d.kcal,
    Proteína: Math.round(d.proteinG),
    Carbs:    Math.round(d.carbsG),
    Água:     Math.round(d.waterMl / 100) / 10, // litros
  }))

  return (
    <div className="px-4 pt-4 pb-8 space-y-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Histórico Nutricional</h1>
        <Link href="/nutrition" className="text-xs text-muted-foreground border border-border rounded-lg px-3 py-1.5">
          ← Nutrição
        </Link>
      </div>

      {isLoading ? (
        <div className="hunter-card text-center py-10 text-muted-foreground text-sm">
          Carregando histórico...
        </div>
      ) : chartData.length === 0 ? (
        <div className="hunter-card text-center py-10 text-muted-foreground text-sm">
          Nenhum registro ainda. Comece a logar suas refeições!
        </div>
      ) : (
        <>
          {/* Gráfico de Calorias */}
          <div className="hunter-card space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Calorias (últimos 30 dias)</h2>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradKcal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f97316" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="Kcal" stroke="#f97316" fill="url(#gradKcal)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico de Macros */}
          <div className="hunter-card space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Macros (g)</h2>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradProt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}   />
                  </linearGradient>
                  <linearGradient id="gradCarbs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Area type="monotone" dataKey="Proteína" stroke="#22c55e" fill="url(#gradProt)"  strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="Carbs"    stroke="#3b82f6" fill="url(#gradCarbs)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico de Água */}
          <div className="hunter-card space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Hidratação (L)</h2>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradWater" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#38bdf8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="Água" stroke="#38bdf8" fill="url(#gradWater)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Tabela dos últimos 7 dias */}
          <div className="hunter-card space-y-2">
            <h2 className="text-sm font-semibold text-foreground">Últimos 7 registros</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground border-b border-border">
                    <th className="text-left py-1.5 font-medium">Data</th>
                    <th className="text-right py-1.5 font-medium text-orange-400">Kcal</th>
                    <th className="text-right py-1.5 font-medium text-green-400">Prot</th>
                    <th className="text-right py-1.5 font-medium text-blue-400">Carbs</th>
                    <th className="text-right py-1.5 font-medium text-amber-400">Gord</th>
                    <th className="text-right py-1.5 font-medium text-cyan-400">Água</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.slice(-7).reverse().map((d, i) => (
                    <tr key={i} className="border-b border-border/40 last:border-0">
                      <td className="py-1.5 text-foreground">{d.date}</td>
                      <td className="py-1.5 text-right text-foreground font-mono">{d.Kcal}</td>
                      <td className="py-1.5 text-right text-foreground font-mono">{d.Proteína}g</td>
                      <td className="py-1.5 text-right text-foreground font-mono">{d.Carbs}g</td>
                      <td className="py-1.5 text-right text-foreground font-mono">—</td>
                      <td className="py-1.5 text-right text-foreground font-mono">{d.Água}L</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
