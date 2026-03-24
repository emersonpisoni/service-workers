import { useCallback, useEffect, useState } from 'react'

export interface CacheEntry {
  url: string
  size: number | null
}

export interface CacheStore {
  name: string
  entries: CacheEntry[]
}

// Hook para inspecionar o que está no Cache Storage
export function useCacheInspector() {
  const [caches_, setCaches] = useState<CacheStore[]>([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!('caches' in window)) return
    setLoading(true)

    const names = await caches.keys()
    const stores: CacheStore[] = []

    for (const name of names) {
      const cache = await caches.open(name)
      const keys = await cache.keys()

      const entries: CacheEntry[] = await Promise.all(
        keys.map(async (req) => {
          const res = await cache.match(req)
          const blob = await res?.blob()
          return {
            url: new URL(req.url).pathname,
            size: blob?.size ?? null,
          }
        })
      )

      stores.push({ name, entries })
    }

    setCaches(stores)
    setLoading(false)
  }, [])

  const clearCache = useCallback(async (cacheName: string) => {
    await caches.delete(cacheName)
    await refresh()
  }, [refresh])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { caches: caches_, loading, refresh, clearCache }
}
