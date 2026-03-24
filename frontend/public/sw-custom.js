/**
 * HunterFit Custom Service Worker Extension
 * ──────────────────────────────────────────
 * Este arquivo é importado pelo service worker gerado pelo next-pwa.
 * Adiciona suporte a Background Sync para enviar dados offline
 * quando a conexão for restaurada.
 *
 * Usa a Background Sync API (Chrome/Edge) quando disponível,
 * com fallback para o listener 'online' no cliente.
 */

const SYNC_TAG = 'hunterfit-sync'

// ─── Background Sync ──────────────────────────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(syncPendingData())
  }
})

async function syncPendingData() {
  // Abre o IndexedDB e drena a fila de pending sync
  // O drainQueue() real está no lib/db/sync.ts (executado no contexto da página)
  // Aqui apenas postamos uma mensagem para todos os clientes ativos
  const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' })
  clients.forEach((client) => {
    client.postMessage({ type: 'TRIGGER_SYNC' })
  })
}

// ─── Push Notifications ───────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = { title: 'HunterFit', body: event.data.text() }
  }

  const options = {
    body:    payload.body    ?? 'Você tem uma nova notificação',
    icon:    payload.icon    ?? '/icons/icon-192x192.png',
    badge:   payload.badge   ?? '/icons/badge-72x72.png',
    tag:     payload.tag     ?? 'hunterfit',
    data:    payload.data    ?? {},
    actions: payload.actions ?? [],
    vibrate: [200, 100, 200],
  }

  event.waitUntil(
    self.registration.showNotification(payload.title ?? 'HunterFit', options)
  )
})

// ─── Notification Click ───────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url ?? '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return self.clients.openWindow(url)
    })
  )
})
