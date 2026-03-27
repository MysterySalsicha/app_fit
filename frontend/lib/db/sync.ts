/**
 * HunterFit Offline Sync Engine
 * ─────────────────────────────
 * Gerencia a fila de operações pendentes quando o usuário está offline.
 * Quando a conexão volta, drena a fila enviando os dados ao backend.
 *
 * Arquitetura:
 *   IndexedDB (Dexie)  ←→  SyncQueue  →  API Backend
 *
 * Cada item na fila tem:
 *   - id:        UUID local
 *   - operation: 'create' | 'update' | 'delete'
 *   - endpoint:  '/api/workout/session' etc.
 *   - payload:   dados da operação
 *   - createdAt: timestamp para ordenação FIFO
 *   - retries:   contador de tentativas falhas
 */

import { db } from './schema'
import { api } from '../api/client'

// ─── Tipos ────────────────────────────────────────────────────────────────────
export interface SyncItem {
  id:        string
  operation: 'create' | 'update' | 'delete'
  endpoint:  string
  payload:   Record<string, unknown>
  method:    'POST' | 'PUT' | 'PATCH' | 'DELETE'
  createdAt: number   // Date.now()
  retries:   number
  maxRetries: number
}

const SYNC_TABLE = 'pendingSync'

// ─── API ──────────────────────────────────────────────────────────────────────

/**
 * Enfileira uma operação para sincronização futura.
 * Deve ser chamada SEMPRE que uma mutação offline acontecer.
 */
export async function enqueueSyncItem(
  endpoint: string,
  method: SyncItem['method'],
  payload: Record<string, unknown>,
  operation: SyncItem['operation'] = 'create'
): Promise<void> {
  const item: SyncItem = {
    id:         crypto.randomUUID(),
    operation,
    endpoint,
    method,
    payload,
    createdAt:  Date.now(),
    retries:    0,
    maxRetries: 3,
  }

  await db.table(SYNC_TABLE).add(item)
  console.debug('[sync] enqueued:', endpoint, operation)
}

/**
 * Retorna o número de itens pendentes na fila.
 */
export async function getPendingCount(): Promise<number> {
  return db.table(SYNC_TABLE).count()
}

/**
 * Drena a fila: envia todos os itens pendentes ao backend em ordem FIFO.
 * Retorna o número de itens sincronizados com sucesso.
 */
export async function drainQueue(): Promise<{ synced: number; failed: number }> {
  const items: SyncItem[] = await db
    .table(SYNC_TABLE)
    .orderBy('createdAt')
    .toArray()

  let synced = 0
  let failed = 0

  for (const item of items) {
    try {
      await sendItem(item)
      await db.table(SYNC_TABLE).delete(item.id)
      synced++
      console.debug('[sync] synced:', item.endpoint)
    } catch (err) {
      const updatedRetries = item.retries + 1
      if (updatedRetries >= item.maxRetries) {
        // Descarta após maxRetries falhas — evita loop infinito
        await db.table(SYNC_TABLE).delete(item.id)
        console.warn('[sync] discarded after max retries:', item.endpoint)
      } else {
        await db.table(SYNC_TABLE).update(item.id, { retries: updatedRetries })
      }
      failed++
      console.warn('[sync] failed:', item.endpoint, err)
    }
  }

  return { synced, failed }
}

/**
 * Envia um único item para o backend.
 */
async function sendItem(item: SyncItem): Promise<void> {
  switch (item.method) {
    case 'POST':
      await api.post(item.endpoint, item.payload)
      break
    case 'PUT':
      await api.put(item.endpoint, item.payload)
      break
    case 'PATCH':
      await api.patch(item.endpoint, item.payload)
      break
    case 'DELETE':
      await api.delete(item.endpoint)
      break
  }
}

// ─── Listener de conectividade ────────────────────────────────────────────────

let syncListenerRegistered = false

/**
 * Registra listeners de online/offline no window.
 * Deve ser chamado uma única vez na inicialização do app.
 */
export function registerSyncListeners(): void {
  if (typeof window === 'undefined' || syncListenerRegistered) return
  syncListenerRegistered = true

  window.addEventListener('online', async () => {
    console.info('[sync] connection restored — draining queue...')
    const { synced, failed } = await drainQueue()
    if (synced > 0) {
      console.info(`[sync] ✓ ${synced} items synced, ${failed} failed`)
      // Dispara evento customizado para a UI mostrar notificação
      window.dispatchEvent(new CustomEvent('hunterfit:synced', { detail: { synced, failed } }))
    }
  })

  window.addEventListener('offline', () => {
    console.info('[sync] connection lost — offline mode active')
    window.dispatchEvent(new CustomEvent('hunterfit:offline'))
  })
}

/**
 * Verifica se o app está online.
 */
export function isOnline(): boolean {
  if (typeof navigator === 'undefined') return true
  return navigator.onLine
}

/**
 * Drena a fila ao iniciar o app, caso haja itens pendentes de sessões anteriores.
 * Deve ser chamado uma única vez na inicialização do app (providers.tsx ou layout).
 */
export async function drainOnStartup(): Promise<void> {
  if (typeof window === 'undefined') return
  if (!navigator.onLine) return

  const count = await getPendingCount()
  if (count === 0) return

  console.info(`[sync] startup: ${count} pending items found — draining...`)
  const { synced, failed } = await drainQueue()
  if (synced > 0) {
    console.info(`[sync] startup drain: ✓ ${synced} synced, ${failed} failed`)
    window.dispatchEvent(new CustomEvent('hunterfit:synced', { detail: { synced, failed } }))
  }
}
