'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home', icon: '🏠' },
  { href: '/workout', label: 'Treino', icon: '⚔️' },
  { href: '/hunter', label: 'Hunter', icon: '⭐' },
  { href: '/nutrition', label: 'Nutrição', icon: '🍎' },
  { href: '/body', label: 'Corpo', icon: '📊' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 px-1 py-1 rounded-lg transition-colors ${
              isActive
                ? 'text-primary'
                : 'text-muted-foreground'
            }`}
          >
            <span className="text-xl leading-none">{item.icon}</span>
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
