import { useState } from 'react'
import { useOnlineStatus } from '../hooks/useOnlineStatus'

interface PendingRequest {
  id: string
  url: string
  timestamp: string
  synced: boolean
}

// Simula uma fila de Background Sync
export function OfflineDemo() {
  const isOnline = useOnlineStatus()
  const [pendingQueue, setPendingQueue] = useState<PendingRequest[]>([])
  const [fetchResult, setFetchResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const simulateRequest = async () => {
    setLoading(true)
    setFetchResult(null)

    if (!isOnline) {
      // Simula adicionar à fila de sync
      const pending: PendingRequest = {
        id: Math.random().toString(36).slice(2),
        url: 'https://jsonplaceholder.typicode.com/posts',
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        synced: false,
      }
      setPendingQueue((prev) => [...prev, pending])

      // Em produção: navigator.serviceWorker.ready.then(sw => sw.sync.register('sync-pending-requests'))
      setFetchResult('Offline: requisição salva para sincronização posterior (Background Sync)')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('https://jsonplaceholder.typicode.com/posts/1')
      const data = await res.json()
      setFetchResult(`Online: dados recebidos — "${data.title}"`)

      // Marca pendentes como sincronizados
      setPendingQueue((prev) => prev.map((r) => ({ ...r, synced: true })))
    } catch {
      setFetchResult('Erro na requisição')
    }

    setLoading(false)
  }

  return (
    <section style={styles.card}>
      <h2 style={styles.title}>Offline / Background Sync Demo</h2>

      {/* Status de conexão */}
      <div style={{ ...styles.statusBanner, background: isOnline ? '#052e16' : '#7f1d1d', borderColor: isOnline ? '#10b981' : '#ef4444' }}>
        <span style={{ fontSize: 20 }}>{isOnline ? '🟢' : '🔴'}</span>
        <div>
          <strong style={{ color: isOnline ? '#34d399' : '#f87171' }}>
            {isOnline ? 'Online' : 'Offline'}
          </strong>
          <p style={styles.statusHint}>
            {isOnline
              ? 'Para testar o modo offline: DevTools → Network → Offline'
              : 'Requisições serão enfileiradas e sincronizadas quando a conexão voltar'}
          </p>
        </div>
      </div>

      {/* Como testar */}
      <div style={styles.howTo}>
        <h3 style={styles.subtitle}>Como testar Background Sync:</h3>
        <ol style={styles.list}>
          <li>Abra DevTools → aba Application → Service Workers</li>
          <li>Ative "Offline" no topo da aba</li>
          <li>Clique em "Fazer requisição" abaixo</li>
          <li>Observe a requisição ser enfileirada</li>
          <li>Desative "Offline" e veja a sincronização automática</li>
        </ol>
      </div>

      <button style={styles.btn} onClick={simulateRequest} disabled={loading}>
        {loading ? 'Carregando...' : 'Fazer requisição'}
      </button>

      {fetchResult && (
        <div style={{ ...styles.result, borderColor: isOnline ? '#10b981' : '#f59e0b' }}>
          {fetchResult}
        </div>
      )}

      {/* Fila de Background Sync */}
      {pendingQueue.length > 0 && (
        <div style={styles.queue}>
          <h3 style={styles.subtitle}>
            Fila de sincronização ({pendingQueue.filter((r) => !r.synced).length} pendentes)
          </h3>
          {pendingQueue.map((req) => (
            <div key={req.id} style={{ ...styles.queueItem, opacity: req.synced ? 0.5 : 1 }}>
              <span style={{ color: req.synced ? '#10b981' : '#f59e0b' }}>
                {req.synced ? '✓ Sincronizado' : '⏳ Pendente'}
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
