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

// ─── SERVICE WORKER LIFECYCLE ────────────────────────────────────────────────
//
// 1. INSTALL  → SW is downloaded and installed. Good time to precache assets.
// 2. ACTIVATE → SW takes control. Good time to clean up outdated caches.
// 3. FETCH    → SW intercepts all network requests.

self.addEventListener('install', () => {
  console.log('[SW] Install event — preparing caches...')
  // skipWaiting() makes the new SW activate immediately without waiting for tabs to close
  self.skipWaiting()
})

self.addEventListener('activate', () => {
  console.log('[SW] Activate event — taking control...')
  cleanupOutdatedCaches()
})

// clientsClaim() makes the SW control all open clients immediately after activation
clientsClaim()

// ─── PRECACHE (Cache on Install) ──────────────────────────────────────────────
//
// vite-plugin-pwa injects the list of static files with their hashes here.
// This ensures the app works offline after the first load.
precacheAndRoute(self.__WB_MANIFEST)

// ─── NAVIGATION FALLBACK ──────────────────────────────────────────────────────
//
// For SPAs: any navigation that doesn't match a file serves index.html.
// This is essential for React Router to work offline.
const allowlist = [/^\/$/]
registerRoute(
  new NavigationRoute(createHandlerBoundToURL('index.html'), { allowlist })
)

// ─── CACHING STRATEGIES ───────────────────────────────────────────────────────
//
// Each strategy has a different trade-off between performance and freshness.

// 1. CACHE FIRST — Best for assets that rarely change (fonts, images)
//    Serves from cache; only goes to the network if not found.
registerRoute(
  ({ request }) =>
    request.destination === 'font' || request.destination === 'image',
  new CacheFirst({
    cacheName: 'assets-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,         // maximum number of items in cache
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
)

// 2. NETWORK FIRST — Best for APIs (always fresh data, with offline fallback)
//    Tries the network first; if it fails, serves from cache.
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 5 * 60, // 5 minutes
      }),
    ],
  })
)

// 3. STALE WHILE REVALIDATE — Best balance for most cases
//    Serves from cache instantly AND updates in the background.
registerRoute(
  ({ request }) => request.destination === 'script' || request.destination === 'style',
  new StaleWhileRevalidate({
    cacheName: 'static-resources',
  })
)

// 4. NETWORK ONLY — For requests that should never be cached
//    (analytics, form POSTs, etc.)
registerRoute(
  ({ url }) => url.pathname.startsWith('/analytics/'),
  new NetworkOnly()
)

// ─── CLIENT COMMUNICATION ─────────────────────────────────────────────────────
//
// The SW can send and receive messages via postMessage

self.addEventListener('message', (event) => {
  console.log('[SW] Message received from client:', event.data)

  if (event.data?.type === 'SKIP_WAITING') {
    // Forces the new SW to activate immediately (used by the "Update" button)
    self.skipWaiting()
  }

  if (event.data?.type === 'GET_CACHE_NAMES') {
    // Responds with the list of active caches
    caches.keys().then((names) => {
      event.source?.postMessage({ type: 'CACHE_NAMES', payload: names })
    })
  }

  if (event.data?.type === 'CLEAR_CACHE') {
    // Clears a specific cache
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
// Allows syncing data when the connection is restored (e.g. offline forms)
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
  // Here you would fetch pending requests from IndexedDB and send them
  console.log('[SW] Syncing pending requests...')
  // Notify the client that sync is complete
  const clients = await self.clients.matchAll()
  clients.forEach((client) => {
    client.postMessage({ type: 'SYNC_COMPLETE' })
  })
}

// ─── PUSH NOTIFICATIONS ───────────────────────────────────────────────────────
//
// Receives push notifications from the server even when the app is closed
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? { title: 'New notification', body: '' }
  console.log('[SW] Push received:', data)

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
