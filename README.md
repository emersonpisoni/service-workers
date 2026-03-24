# Service Workers Lab

A hands-on study project demonstrating **Service Workers** in a React + TypeScript + Vite application using [Workbox](https://developer.chrome.com/docs/workbox/).

---

## What is a Service Worker?

A **Service Worker** is a JavaScript script that runs in the background, completely separate from the web page. It acts as a **programmable network proxy** — intercepting every HTTP request the browser makes, deciding whether to serve it from cache or let it go to the network.

Key capabilities:
- Make your app work **offline**
- Full control over **caching strategies**
- **Push Notifications** (even when the app is closed)
- **Background Sync** (queue requests and send them when connection returns)
- Foundation of **PWAs (Progressive Web Apps)**

> Service Workers only work on `localhost` or over **HTTPS**. They run in a separate thread with no access to the DOM.

---

## Project Structure

```
src/
├── sw.ts                      # The Service Worker script itself
├── main.tsx                   # React entry point
├── App.tsx                    # Root component — assembles the lab UI
├── hooks/
│   ├── useServiceWorker.ts    # Registers the SW and exposes its state to React
│   ├── useOnlineStatus.ts     # Reactively tracks online/offline status
│   └── useCacheInspector.ts   # Reads and clears Cache Storage entries
└── components/
    ├── SWStatus.tsx           # Displays SW lifecycle state + postMessage UI
    ├── OfflineDemo.tsx        # Simulates offline requests and background sync queue
    └── CacheInspector.tsx     # Visual inspector for all active cache stores
```

---

## Running the Project

```bash
npm install

# Development (SW enabled via devOptions in vite.config.ts)
npm run dev

# Production build — most realistic SW behavior
npm run build && npm run preview
```

> **Note:** The `vite-plugin-pwa` config has `devOptions.enabled: true`, so the Service Worker is active even in `npm run dev`. However, for the most accurate behavior (precaching, etc.), prefer `npm run build && npm run preview`.

---

## The Service Worker — `src/sw.ts`

This is the core of the project. It is a **custom Service Worker** registered via `vite-plugin-pwa` with the `injectManifest` strategy, meaning Vite injects the precache manifest (`self.__WB_MANIFEST`) at build time.

### Lifecycle

Service Workers go through three lifecycle phases:

```
INSTALL  →  ACTIVATE  →  FETCH (intercepts all network requests)
```

| Phase | What happens in this project |
|---|---|
| `install` | Logs to console, calls `skipWaiting()` so the new SW activates immediately without waiting for all tabs to close |
| `activate` | Calls `cleanupOutdatedCaches()` to delete stale precache entries from previous builds |
| `fetch` | All registered routes below intercept matching requests |

`clientsClaim()` is called at the top level so the SW takes control of all open clients immediately after activation, without requiring a page reload.

### Precaching

```ts
precacheAndRoute(self.__WB_MANIFEST)
```

Workbox precaches all static assets (JS, CSS, HTML) at install time. Their URLs include content hashes, so the cache is automatically invalidated when files change. This ensures the app is **fully functional offline after the first load**.

### Navigation Fallback (SPA support)

```ts
registerRoute(
  new NavigationRoute(createHandlerBoundToURL('index.html'), { allowlist: [/^\//] })
)
```

Any browser navigation that doesn't match a precached file falls back to `index.html`. This is essential for React Router to work offline — without it, a direct URL like `/about` would return a 404 when offline.

---

## Caching Strategies — `src/sw.ts`

Each strategy represents a different trade-off between **freshness** and **performance**.

### 1. Cache First
**Used for:** fonts and images (`request.destination === 'font' | 'image'`)
**Cache name:** `assets-cache`

```
Request → Check cache → Hit?  Serve immediately.
                      → Miss? Fetch from network, store in cache, serve.
```

Best for resources that rarely change. Config: max 50 entries, 30-day expiration.

---

### 2. Network First
**Used for:** API calls matching `/api/*`
**Cache name:** `api-cache`

```
Request → Try network → Success? Serve + update cache.
                      → Fail (offline)? Serve from cache.
```

Best for dynamic data where freshness matters, but offline fallback is still needed. Config: max 100 entries, 5-minute expiration.

---

### 3. Stale While Revalidate
**Used for:** JS and CSS files (`request.destination === 'script' | 'style'`)
**Cache name:** `static-resources`

```
Request → Serve from cache immediately (fast!)
        → Simultaneously fetch from network in background → update cache
```

Best balance for most cases — instant response AND always updating in the background.

---

### 4. Network Only
**Used for:** analytics calls matching `/analytics/*`

```
Request → Always go to network. Never cache.
```

Used for requests that must never be served stale: analytics pings, form POSTs, etc.

---

## Bidirectional Communication — `postMessage`

The SW and the page can exchange messages at any time.

**Page → SW** (sent via `useServiceWorker.postMessage()`):

| Message type | What it does |
|---|---|
| `SKIP_WAITING` | Forces the waiting SW to activate immediately (used by the "Update now" button) |
| `GET_CACHE_NAMES` | Requests a list of all active cache names |
| `CLEAR_CACHE` | Deletes a specific cache store by name |

**SW → Page** (received and stored in `useServiceWorker.messages`):

| Message type | Payload |
|---|---|
| `CACHE_NAMES` | Array of active cache store names |
| `CACHE_CLEARED` | `{ cacheName, deleted }` confirmation |
| `SYNC_COMPLETE` | Emitted after a background sync finishes |

---

## Background Sync — `src/sw.ts`

```ts
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-requests') {
    event.waitUntil(syncPendingRequests())
  }
})
```

Background Sync lets you queue failed requests while offline and automatically retry them when connectivity is restored. The SW listens for the `sync` event (triggered by the browser when online again) and calls `syncPendingRequests()`, which would read queued items from IndexedDB and send them.

The `OfflineDemo` component simulates this flow visually.

---

## Push Notifications — `src/sw.ts`

```ts
self.addEventListener('push', (event) => {
  const data = event.data?.json()
  event.waitUntil(
    self.registration.showNotification(data.title, { body: data.body, ... })
  )
})
```

The SW receives push events from your server even when the app tab is closed. `notificationclick` handles what happens when the user taps the notification — in this project, it opens (or focuses) the app window.

---

## React Hooks

### `useServiceWorker` — `src/hooks/useServiceWorker.ts`

Wraps `vite-plugin-pwa`'s `useRegisterSW` and adds:
- **`state`** — current lifecycle state: `checking | registered | installing | waiting | active | not-supported | error`
- **`needsUpdate`** — `true` when a new SW version is waiting
- **`updateSW()`** — sends `SKIP_WAITING` and reloads the page to activate the new version
- **`postMessage(msg)`** — sends a message to the active SW controller
- **`messages`** — array of all messages received from the SW

### `useOnlineStatus` — `src/hooks/useOnlineStatus.ts`

Listens to the browser's `online` and `offline` window events and returns a reactive boolean. Initialized with `navigator.onLine`.

### `useCacheInspector` — `src/hooks/useCacheInspector.ts`

Uses the **Cache Storage API** (`caches.keys()`, `caches.open()`, `cache.keys()`) to enumerate all cache stores and their entries. For each entry it reads the response as a Blob to calculate its size. Exposes `refresh()` and `clearCache(name)`.

---

## Components

### `SWStatus` — `src/components/SWStatus.tsx`

- Shows the current SW state with a colored indicator
- Renders a **lifecycle diagram** (Register → Install → Activate → Fetch) where completed steps are highlighted
- Shows an **update banner** with an "Update now" button when `needsUpdate` is true
- Has buttons to send `GET_CACHE_NAMES` and `SKIP_WAITING` messages and displays the SW's responses in real time

### `OfflineDemo` — `src/components/OfflineDemo.tsx`

- Uses `useOnlineStatus` to show a live online/offline banner
- "Make request" button fetches from `jsonplaceholder.typicode.com`
- When **offline**: adds the request to a visible pending queue (simulating what you'd store in IndexedDB for real Background Sync)
- When **back online**: marks all pending items as synced

### `CacheInspector` — `src/components/CacheInspector.tsx`

- Explains all four caching strategies with description cards
- Lists all active cache stores with their entries and file sizes
- "Clear" button per cache store (sends `CLEAR_CACHE` to the SW, then refreshes the view)

---

## Vite & PWA Configuration — `vite.config.ts`

```ts
VitePWA({
  registerType: 'prompt',        // Shows update prompt instead of auto-updating
  strategies: 'injectManifest',  // Uses our custom sw.ts instead of auto-generating
  srcDir: 'src',
  filename: 'sw.ts',
  devOptions: { enabled: true }, // SW active in npm run dev
})
```

`injectManifest` is the advanced strategy — Workbox only injects the precache manifest into your SW file, leaving you in full control of all routing and caching logic.

---

## How to Explore in DevTools

Open **Chrome DevTools → Application tab**:

- **Service Workers** — see registration status, force update, skip waiting, send push events
- **Cache Storage** — browse every cached URL and response
- **Network → Offline checkbox** — simulate going offline to test fallback strategies and the background sync queue

---

## Tech Stack

| Tool | Role |
|---|---|
| React + TypeScript | UI and hooks |
| Vite | Build tool and dev server |
| `vite-plugin-pwa` | Integrates Workbox into the Vite build pipeline |
| Workbox | Service Worker helpers (precaching, routing strategies, expiration) |
