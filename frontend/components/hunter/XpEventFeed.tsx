'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface XpEvent {
  id: string
  eventType: string
  xpGained: number
  multiplier: number
  description: string
  createdAt: string
}

const EVENT_ICONS: Record<string, string> = {
  session:  '⚔️',
  quest:    '📜',
  streak:   '🔥',
  bonus:    '⭐',
  pr:       '🏆',
  dungeon:  '🏰',
  default:  '✨',
}

export function XpEventFeed() {
  const { data: events = [], isLoading } = useQuery<XpEvent[]>({
    queryKey: ['hunter', 'xp-history'],
    queryFn: () => api.get<XpEvent[]>('api/hunter/xp-history?days=1'),
    staleTime: 60_000,
  })

  if (isLoading) return <div className="hunter-card h-20 animate-pulse" />
  if (events.length === 0) return null

  return (
    <div className="hunter-card">
      <h3 className="text-sm font-semibold text-foreground mb-3">XP Recente</h3>
      <div className="space-y-2">
        {events.slice(0, 8).map((event) => (
          <div key={event.id} className="flex items-center justify-between">
            <div className="flex items-start gap-2">
              <span className="text-base leading-none mt-0.5">
                {EVENT_ICONS[event.eventType] ?? EVENT_ICONS.default}
              </span>
              <div>
                <p className="text-sm text-foreground leading-tight">{event.description}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true, locale: ptBR })}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0 ml-3">
              <p className="text-sm font-bold text-xp font-mono">
                +{event.xpGained.toLocaleString('pt-BR')} XP
              </p>
              {event.multiplier > 1 && (
                <p className="text-xs text-purple-400">×{event.multiplier}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
