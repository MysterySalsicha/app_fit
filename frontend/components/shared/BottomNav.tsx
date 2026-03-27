'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'

// Quests substituem "Corpo" na nav principal — Corpo fica acessível pelo Hunter ou Settings
const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home',    icon: '🏠' },
  { href: '/workout',   label: 'Treino',  icon: '⚔️' },
  { href: '/hunter',    label: 'Hunter',  icon: '⭐' },
  { href: '/quests',    label: 'Quests',  icon: '📋' },
  { href: '/nutrition', label: 'Nutrição', icon: '🍎' },
]

export function BottomNav() {
  const pathname = usePathname()

  // Dot de notificação nas quests (quests ativas não completadas)
  const { data: quests } = useQuery<{ daily: any[]; main: any[]; emergency: any[] }>({
    queryKey: ['quests', 'nav'],
    queryFn: () => api.get('api/quests'),
    staleTime: 3 * 60_000,
    retry: false,
  })

  const activeQuestCount = [
    ...(quests?.daily     ?? []),
    ...(quests?.main      ?? []),
    ...(quests?.emergency ?? []),
  ].filter((q) => q.status === 'active').length

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname.startsWith(item.href)
        const showDot = item.href === '/quests' && activeQuestCount > 0 && !isActive

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 px-1 py-1 rounded-lg transition-colors relative ${
              isActive ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <span className="text-xl leading-none relative">
              {item.icon}
              {showDot && (
                <span className="absolute -top-0.5 -right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </span>
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
