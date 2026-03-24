'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Notification {
  id: string
  title: string
  message: string
  type: 'level_up' | 'rank_up' | 'quest_complete' | 'pr' | 'skill_unlock'
}

// Global notification queue (simples — produção usaria Zustand ou EventEmitter)
type NotificationListener = (n: Notification) => void
const listeners: NotificationListener[] = []

export function dispatchSystemNotification(notification: Omit<Notification, 'id'>) {
  const n: Notification = { ...notification, id: crypto.randomUUID() }
  listeners.forEach((l) => l(n))
}

export function SystemNotification() {
  const [current, setCurrent] = useState<Notification | null>(null)

  useEffect(() => {
    const listener: NotificationListener = (n) => {
      setCurrent(n)
      setTimeout(() => setCurrent(null), 4000)
    }
    listeners.push(listener)
    return () => {
      const idx = listeners.indexOf(listener)
      if (idx !== -1) listeners.splice(idx, 1)
    }
  }, [])

  const icons: Record<Notification['type'], string> = {
    level_up: '⬆️',
    rank_up: '🌟',
    quest_complete: '✅',
    pr: '🏆',
    skill_unlock: '💫',
  }

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          className="system-notification"
        >
          <p className="text-xs text-blue-400 mb-1 font-mono uppercase tracking-widest">
            Sistema
          </p>
          <p className="text-base font-bold text-white">
            {icons[current.type]} {current.title}
          </p>
          <p className="text-sm text-blue-200 mt-1">{current.message}</p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
