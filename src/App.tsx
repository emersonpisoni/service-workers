import { SWStatus } from './components/SWStatus'
import { CacheInspector } from './components/CacheInspector'
import { OfflineDemo } from './components/OfflineDemo'
import { useServiceWorker } from './hooks/useServiceWorker'

export default function App() {
  const sw = useServiceWorker()

  return (
    <div style={styles.root}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.heading}>Service Workers Lab</h1>
          <p style={styles.subtitle}>
            Study project: Service Workers in React with Workbox
          </p>
        </div>
        <div style={styles.headerRight}>
          <a
            href="https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.link}
          >
            MDN Docs ↗
          </a>
          <a
            href="https://developer.chrome.com/docs/workbox/"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.link}
          >
            Workbox ↗
          </a>
        </div>
      </header>

      {/* Concept summary */}
      <div style={styles.conceptBox}>
        <h2 style={styles.conceptTitle}>What is a Service Worker?</h2>
        <p style={styles.conceptText}>
          A <strong>Service Worker</strong> is a JavaScript script that runs in the background,
          separate from the web page, acting as a <em>programmable network proxy</em>.
          It intercepts requests, manages caches, and enables your app to work{' '}
          <strong>offline</strong>. It is the foundation of PWAs (Progressive Web Apps).
        </p>
        <div style={styles.pillRow}>
          {['Network Proxy', 'Cache API', 'Offline First', 'Background Sync', 'Push Notifications', 'PWA'].map(
            (tag) => (
              <span key={tag} style={styles.pill}>
                {tag}
              </span>
            )
          )}
        </div>
      </div>

      <main style={styles.grid}>
        <SWStatus sw={sw} />
        <OfflineDemo />
        <div style={styles.fullWidth}>
          <CacheInspector />
        </div>
      </main>

      <footer style={styles.footer}>
        Open DevTools → Application → Service Workers to inspect
      </footer>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100vh',
    background: '#0f172a',
    color: '#e2e8f0',
    fontFamily: "'Inter', system-ui, sans-serif",
    padding: '24px 20px 40px',
    maxWidth: 1100,
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    flexWrap: 'wrap' as const,
    gap: 12,
  },
  heading: {
    margin: 0,
    fontSize: 26,
    color: '#f8fafc',
    fontWeight: 700,
  },
  subtitle: {
    margin: '4px 0 0',
    fontSize: 14,
    color: '#64748b',
  },
  headerRight: {
    display: 'flex',
    gap: 12,
  },
  link: {
    color: '#6366f1',
    fontSize: 13,
    textDecoration: 'none',
    padding: '6px 12px',
    border: '1px solid #6366f1',
    borderRadius: 6,
  },
  conceptBox: {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  conceptTitle: {
    margin: '0 0 8px',
    fontSize: 16,
    color: '#f1f5f9',
  },
  conceptText: {
    margin: '0 0 12px',
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 1.6,
  },
  pillRow: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap' as const,
  },
  pill: {
    background: '#334155',
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: 600,
    padding: '3px 10px',
    borderRadius: 99,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))',
    gap: 20,
  },
  fullWidth: {
    gridColumn: '1 / -1',
  },
  footer: {
    marginTop: 32,
    textAlign: 'center' as const,
    color: '#475569',
    fontSize: 12,
  },
}
