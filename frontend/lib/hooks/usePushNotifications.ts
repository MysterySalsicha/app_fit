'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api/client'

type PushStatus = 'unsupported' | 'denied' | 'default' | 'subscribed' | 'loading'

export function usePushNotifications() {
  const [status, setStatus] = useState<PushStatus>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported')
      return
    }

    if (Notification.permission === 'denied') {
      setStatus('denied')
      return
    }

    // Verifica se já está subscrito
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        setStatus(sub ? 'subscribed' : 'default')
      })
      .catch(() => setStatus('default'))
  }, [])

  const subscribe = useCallback(async () => {
    try {
      setStatus('loading')
      setError(null)

      // 1. Pede permissão ao usuário
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setStatus('denied')
        return false
      }

      // 2. Busca a VAPID public key do backend
      const { vapidPublicKey } = await api.get<{ vapidPublicKey: string }>('api/notification/vapid-key')

      // 3. Registra a subscription no service worker
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      })

      // 4. Envia ao backend
      const subJson = sub.toJSON()
      await api.post('api/notification/subscribe', {
        endpoint:  sub.endpoint,
        p256DhKey: subJson.keys?.p256dh ?? '',
        authKey:   subJson.keys?.auth   ?? '',
      })

      setStatus('subscribed')
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao ativar notificações'
      setError(msg)
      setStatus('default')
      return false
    }
  }, [])

  const unsubscribe = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await api.delete('api/notification/subscribe')
        await sub.unsubscribe()
      }
      setStatus('default')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao desativar notificações'
      setError(msg)
    }
  }, [])

  const sendTest = useCallback(async () => {
    await api.post('api/notification/test', {})
  }, [])

  return { status, error, subscribe, unsubscribe, sendTest }
}

// Converte VAPID public key de base64url para Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}
