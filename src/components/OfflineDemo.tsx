import { useState } from 'react'
import { useOnlineStatus } from '../hooks/useOnlineStatus'

interface PendingRequest {
  id: string
  url: string
  timestamp: string
  synced: boolean
}

// Simulates a Background Sync queue
export function OfflineDemo() {
  const isOnline = useOnlineStatus()
  const [pendingQueue, setPendingQueue] = useState<PendingRequest[]>([])
  const [fetchResult, setFetchResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const simulateRequest = async () => {
    setLoading(true)
    setFetchResult(null)

    if (!isOnline) {
      // Simulate adding to the sync queue
      const pending: PendingRequest = {
        id: Math.random().toString(36).slice(2),
        url: 'https://jsonplaceholder.typicode.com/posts',
        timestamp: new Date().toLocaleTimeString('en-US'),
        synced: false,
      }
      setPendingQueue((prev) => [...prev, pending])

      // In production: navigator.serviceWorker.ready.then(sw => sw.sync.register('sync-pending-requests'))
      setFetchResult('Offline: request queued for later synchronization (Background Sync)')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('https://jsonplaceholder.typicode.com/posts/1')
      const data = await res.json()
      setFetchResult(`Online: data received — "${data.title}"`)

      // Mark pending requests as synced
      setPendingQueue((prev) => prev.map((r) => ({ ...r, synced: true })))
    } catch {
      setFetchResult('Request failed')
    }

    setLoading(false)
  }

  return (
    <section style={styles.card}>
      <h2 style={styles.title}>Offline / Background Sync Demo</h2>

      {/* Connection status */}
      <div style={{ ...styles.statusBanner, background: isOnline ? '#052e16' : '#7f1d1d', borderColor: isOnline ? '#10b981' : '#ef4444' }}>
        <span style={{ fontSize: 20 }}>{isOnline ? '🟢' : '🔴'}</span>
        <div>
          <strong style={{ color: isOnline ? '#34d399' : '#f87171' }}>
            {isOnline ? 'Online' : 'Offline'}
          </strong>
          <p style={styles.statusHint}>
            {isOnline
              ? 'To test offline mode: DevTools → Network → Offline'
              : 'Requests will be queued and synced when the connection is restored'}
          </p>
        </div>
      </div>

      {/* How to test */}
      <div style={styles.howTo}>
        <h3 style={styles.subtitle}>How to test Background Sync:</h3>
        <ol style={styles.list}>
          <li>Open DevTools → Application tab → Service Workers</li>
          <li>Enable "Offline" at the top of the tab</li>
          <li>Click "Make request" below</li>
          <li>Watch the request get queued</li>
          <li>Disable "Offline" and see the automatic sync</li>
        </ol>
      </div>

      <button style={styles.btn} onClick={simulateRequest} disabled={loading}>
        {loading ? 'Loading...' : 'Make request'}
      </button>

      {fetchResult && (
        <div style={{ ...styles.result, borderColor: isOnline ? '#10b981' : '#f59e0b' }}>
          {fetchResult}
        </div>
      )}

      {/* Background Sync queue */}
      {pendingQueue.length > 0 && (
        <div style={styles.queue}>
          <h3 style={styles.subtitle}>
            Sync queue ({pendingQueue.filter((r) => !r.synced).length} pending)
          </h3>
          {pendingQueue.map((req) => (
            <div key={req.id} style={{ ...styles.queueItem, opacity: req.synced ? 0.5 : 1 }}>
              <span style={{ color: req.synced ? '#10b981' : '#f59e0b' }}>
                {req.synced ? '✓ Synced' : '⏳ Pending'}
              </span>
              <span style={styles.queueUrl}>{req.url}</span>
              <span style={styles.queueTime}>{req.timestamp}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: '#1e293b',
    borderRadius: 12,
    padding: 24,
    border: '1px solid #334155',
  },
  title: {
    margin: '0 0 16px',
    fontSize: 18,
    color: '#f1f5f9',
  },
  subtitle: {
    margin: '0 0 8px',
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: 500,
  },
  statusBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    borderRadius: 8,
    padding: '12px 16px',
    border: '1px solid',
    marginBottom: 20,
  },
  statusHint: {
    margin: '2px 0 0',
    fontSize: 12,
    color: '#94a3b8',
  },
  howTo: {
    background: '#0f172a',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
  },
  list: {
    margin: 0,
    paddingLeft: 18,
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 1.8,
  },
  btn: {
    background: '#6366f1',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    padding: '10px 20px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 14,
  },
  result: {
    marginTop: 12,
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid',
    background: '#0f172a',
    color: '#94a3b8',
    fontSize: 13,
  },
  queue: {
    marginTop: 20,
  },
  queueItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '6px 0',
    borderTop: '1px solid #334155',
    fontSize: 12,
  },
  queueUrl: {
    flex: 1,
    color: '#64748b',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  queueTime: {
    color: '#475569',
    flexShrink: 0,
  },
}
