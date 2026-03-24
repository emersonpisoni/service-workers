/// <reference lib="webworker" />
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import {
  CacheFirst,
  NetworkFirst,
  NetworkOnly,
  StaleWhileRevalidate,
} from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

declare let self: ServiceWorkerGlobalScope

// ─── CICLO DE VIDA DO SERVICE WORKER ─────────────────────────────────────────
//
// 1. INSTALL  → SW é baixado e instalado. Bom momento para fazer precache.
// 2. ACTIVATE → SW assume o controle. Bom momento para limpar caches antigos.
// 3. FETCH    → SW intercepta todas as requisições de rede.

// Notifica o cliente sobre mudanças de estado
self.addEventListener('install', () => {
  console.log('[SW] Install event — preparando caches...')
  // skipWaiting() faz o novo SW assumir sem esperar a aba fechar
  self.skipWaiting()
})

self.addEventListener('activate', () => {
  console.log('[SW] Activate event — assumindo controle...')
  cleanupOutdatedCaches()
})

// clientsClaim() faz o SW controlar clientes imediatamente após ativar
clientsClaim()

// ─── PRECACHE (Cache no Install) ──────────────────────────────────────────────
//
// O vite-plugin-pwa injeta aqui a lista de arquivos estáticos com seus hashes.
// Isso garante que o app funcione offline após o primeiro carregamento.
precacheAndRoute(self.__WB_MANIFEST)

// ─── NAVIGATION FALLBACK ──────────────────────────────────────────────────────
//
// Para SPAs: qualquer navegação que não encontrar arquivo serve o index.html
// Isso é essencial para o React Router funcionar offline.
const allowlist = [/^\/$/]
registerRoute(
  new NavigationRoute(createHandlerBoundToURL('index.html'), { allowlist })
)

// ─── ESTRATÉGIAS DE CACHE ─────────────────────────────────────────────────────
//
// Cada estratégia tem um trade-off diferente entre performance e atualização.

// 1. CACHE FIRST — Perfeito para assets que raramente mudam (fontes, imagens)
//    Serve do cache, só vai na rede se não encontrar.
registerRoute(
  ({ request }) =>
    request.destination === 'font' || request.destination === 'image',
  new CacheFirst({
    cacheName: 'assets-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,         // máximo de itens no cache
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 dias
      }),
    ],
  })
)

// 2. NETWORK FIRST — Perfeito para APIs (dados sempre frescos, com fallback offline)
//    Tenta a rede primeiro; se falhar, serve do cache.
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 5 * 60, // 5 minutos
      }),
    ],
  })
)

// 3. STALE WHILE REVALIDATE — Melhor equilíbrio para a maioria dos casos
//    Serve do cache instantaneamente E atualiza em background.
registerRoute(
  ({ request }) => request.destination === 'script' || request.destination === 'style',
  new StaleWhileRevalidate({
    cacheName: 'static-resources',
  })
)

// 4. NETWORK ONLY — Para requisições que nunca devem ser cacheadas
//    (analytics, POST de formulários, etc.)
registerRoute(
  ({ url }) => url.pathname.startsWith('/analytics/'),
  new NetworkOnly()
)

// ─── COMUNICAÇÃO COM O CLIENTE ────────────────────────────────────────────────
//
// O SW pode enviar e receber mensagens via postMessage

self.addEventListener('message', (event) => {
  console.log('[SW] Mensagem recebida do cliente:', event.data)

  if (event.data?.type === 'SKIP_WAITING') {
    // Força o novo SW a ativar imediatamente (usado no botão "Atualizar")
    self.skipWaiting()
  }

  if (event.data?.type === 'GET_CACHE_NAMES') {
    // Responde com a lista de caches ativos
    caches.keys().then((names) => {
      event.source?.postMessage({ type: 'CACHE_NAMES', payload: names })
    })
  }

  if (event.data?.type === 'CLEAR_CACHE') {
    // Limpa um cache específico
    const cacheName = event.data.payload
    caches.delete(cacheName).then((deleted) => {
      event.source?.postMessage({
        type: 'CACHE_CLEARED',
        payload: { cacheName, deleted },
      })
    })
  }
})

// ─── BACKGROUND SYNC ─────────────────────────────────────────────────────────
//
// Permite sincronizar dados quando a conexão voltar (ex: formulários offline)
interface SyncEvent extends Event {
  tag: string
  waitUntil(promise: Promise<unknown>): void
}

self.addEventListener('sync', (event: Event) => {
  const syncEvent = event as SyncEvent
  console.log('[SW] Background Sync:', syncEvent.tag)

  if (syncEvent.tag === 'sync-pending-requests') {
    syncEvent.waitUntil(syncPendingRequests())
  }
})

async function syncPendingRequests() {
  // Aqui você buscaria requisições pendentes do IndexedDB e as enviaria
  console.log('[SW] Sincronizando requisições pendentes...')
  // Notifica o cliente que a sync foi concluída
  const clients = await self.clients.matchAll()
  clients.forEach((client) => {
    client.postMessage({ type: 'SYNC_COMPLETE' })
  })
}

// ─── PUSH NOTIFICATIONS ───────────────────────────────────────────────────────
//
// Recebe notificações push do servidor mesmo com o app fechado
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? { title: 'Nova notificação', body: '' }
  console.log('[SW] Push recebido:', data)

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data: data.url,
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.openWindow(event.notification.data || '/')
  )
})
