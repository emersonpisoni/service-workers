import { useCacheInspector } from '../hooks/useCacheInspector'

function formatBytes(bytes: number | null) {
  if (bytes === null) return '?'
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}

export function CacheInspector() {
  const { caches, loading, refresh, clearCache } = useCacheInspector()

  const totalEntries = caches.reduce((sum, c) => sum + c.entries.length, 0)

  return (
    <section style={styles.card}>
      <div style={styles.header}>
        <h2 style={styles.title}>Cache Storage Inspector</h2>
        <button style={styles.refreshBtn} onClick={refresh} disabled={loading}>
          {loading ? '...' : '↺ Atualizar'}
        </button>
      </div>

      {/* Explicação das estratégias */}
      <div style={styles.strategies}>
        <h3 style={styles.subtitle}>Estratégias de Cache configuradas no SW</h3>
        <div style={styles.grid}>
          <StrategyCard
            name="Cache First"
            cacheName="assets-cache"
            description="Fontes e imagens. Serve do cache, vai na rede só se não encontrar."
            badge="Máxima performance"
            color="#10b981"
          />
          <StrategyCard
            name="Network First"
            cacheName="api-cache"
            description="Chamadas /api/*. Tenta rede primeiro, usa cache como fallback offline."
            badge="Dados frescos"
            color="#6366f1"
          />
          <StrategyCard
            name="Stale While Revalidate"
            cacheName="static-resources"
            description="JS e CSS. Serve do cache E atualiza em background simultaneamente."
            badge="Equilíbrio"
            color="#f59e0b"
          />
          <StrategyCard
            name="Network Only"
            cacheName="—"
            description="Analytics /analytics/*. Nunca cacheia, sempre vai na rede."
            badge="Sem cache"
            color="#ef4444"
          />
        </div>
      </div>

      {/* Caches ativos */}
      <div style={styles.section}>
        <h3 style={styles.subtitle}>
          Caches ativos ({caches.length} stores, {totalEntries} entradas)
        </h3>

        {caches.length === 0 ? (
          <p style={styles.empty}>
            Nenhum cache encontrado. Navegue pelo app para popular os caches.
          </p>
        ) : (
          caches.map((store) => (
            <div key={store.name} style={styles.cacheStore}>
              <div style={styles.storeHeader}>
                <span style={styles.storeName}>{store.name}</span>
                <span style={styles.storeCount}>{store.entries.length} itens</span>
                <button
                  style={styles.clearBtn}
                  onClick={() => clearCache(store.name)}
                >
                  Limpar
                </button>
              </div>

              {store.entries.map((entry) => (
                <div key={entry.url} style={styles.entry}>
                  <span style={styles.entryUrl}>{entry.url}</span>
                  <span style={styles.entrySize}>{formatBytes(entry.size)}</span>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </section>
  )
}

function StrategyCard({
  name,
  cacheName,
  description,
  badge,
  color,
}: {
  name: string
  cacheName: string
  description: string
  badge: string
  color: string
}) {
  return (
    <div style={{ ...styles.stratCard, borderColor: color + '44' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <strong style={{ color, fontSize: 13 }}>{name}</strong>
        <span style={{ ...styles.badge, background: color + '22', color }}>
          {badge}
        </span>
      </div>
      <p style={styles.stratDesc}>{description}</p>
      <code style={styles.cacheName}>{cacheName}</code>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: '#1e293b',
    borderRadius: 12,
    padding: 24,
    border: '1px solid #334155',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    margin: 0,
    fontSize: 18,
    color: '#f1f5f9',
  },
  subtitle: {
    margin: '0 0 12px',
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: 500,
  },
  refreshBtn: {
    background: '#334155',
    color: '#e2e8f0',
    border: '1px solid #475569',
    borderRadius: 6,
    padding: '6px 12px',
    cursor: 'pointer',
    fontSize: 13,
  },
  strategies: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottom: '1px solid #334155',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: 10,
  },
  stratCard: {
    background: '#0f172a',
    borderRadius: 8,
    padding: 14,
    border: '1px solid',
  },
  badge: {
    fontSize: 10,
    fontWeight: 700,
    padding: '2px 6px',
    borderRadius: 4,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  stratDesc: {
    margin: '8px 0 6px',
    fontSize: 12,
    color: '#64748b',
    lineHeight: 1.5,
  },
  cacheName: {
    fontSize: 11,
    color: '#475569',
    background: '#1e293b',
    padding: '2px 6px',
    borderRadius: 4,
  },
  section: {
    marginTop: 0,
  },
  empty: {
    color: '#475569',
    fontSize: 14,
    fontStyle: 'italic',
  },
  cacheStore: {
    background: '#0f172a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    border: '1px solid #1e293b',
  },
  storeHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  storeName: {
    fontWeight: 600,
    color: '#6366f1',
    fontSize: 13,
    flex: 1,
  },
  storeCount: {
    fontSize: 12,
    color: '#64748b',
  },
  clearBtn: {
    background: '#7f1d1d',
    color: '#fca5a5',
    border: 'none',
    borderRadius: 4,
    padding: '3px 8px',
    cursor: 'pointer',
    fontSize: 11,
  },
  entry: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '3px 0',
    borderTop: '1px solid #1e293b',
  },
  entryUrl: {
    fontSize: 12,
    color: '#94a3b8',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    flex: 1,
  },
  entrySize: {
    fontSize: 12,
    color: '#475569',
    marginLeft: 8,
    flexShrink: 0,
  },
}
