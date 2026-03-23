import type { SWInfo } from '../hooks/useServiceWorker'

const STATE_INFO: Record<string, { label: string; color: string; emoji: string }> = {
  'not-supported': { label: 'Not supported', color: '#ef4444', emoji: '✗' },
  checking:        { label: 'Checking...', color: '#f59e0b', emoji: '◌' },
  registered:      { label: 'Registered', color: '#10b981', emoji: '✓' },
  installing:      { label: 'Installing', color: '#6366f1', emoji: '↓' },
  waiting:         { label: 'Waiting (new version)', color: '#f59e0b', emoji: '⏳' },
  active:          { label: 'Active', color: '#10b981', emoji: '●' },
  error:           { label: 'Error', color: '#ef4444', emoji: '✗' },
}

interface Props {
  sw: SWInfo
}

export function SWStatus({ sw }: Props) {
  const info = STATE_INFO[sw.state] ?? STATE_INFO.checking

  return (
    <section style={styles.card}>
      <h2 style={styles.title}>Service Worker Status</h2>

      <div style={styles.statusRow}>
        <span style={{ ...styles.dot, background: info.color }} />
        <span style={{ color: info.color, fontWeight: 600 }}>
          {info.emoji} {info.label}
        </span>
      </div>

      {/* Lifecycle diagram */}
      <div style={styles.lifecycle}>
        <LifecycleStep label="Register" active={sw.state !== 'not-supported'} />
        <span style={styles.arrow}>→</span>
        <LifecycleStep label="Install" active={['registered', 'installing', 'waiting', 'active'].includes(sw.state)} />
        <span style={styles.arrow}>→</span>
        <LifecycleStep label="Activate" active={sw.state === 'active'} />
        <span style={styles.arrow}>→</span>
        <LifecycleStep label="Fetch" active={sw.state === 'active'} />
      </div>

      {/* Update banner when a new version is available */}
      {sw.needsUpdate && (
        <div style={styles.updateBanner}>
          <span>New version available!</span>
          <button style={styles.updateBtn} onClick={sw.updateSW}>
            Update now
          </button>
        </div>
      )}

      {/* SW communication */}
      <div style={styles.section}>
        <h3 style={styles.subtitle}>Communication (postMessage)</h3>
        <div style={styles.btnRow}>
          <button
            style={styles.btn}
            onClick={() => sw.postMessage({ type: 'GET_CACHE_NAMES' })}
          >
            Request cache list
          </button>
          <button
            style={styles.btn}
            onClick={() => sw.postMessage({ type: 'SKIP_WAITING' })}
          >
            Force skipWaiting
          </button>
        </div>

        {sw.messages.length > 0 && (
          <div style={styles.messages}>
            <strong>Messages from SW:</strong>
            {sw.messages.map((msg, i) => (
              <pre key={i} style={styles.pre}>
                {JSON.stringify(msg, null, 2)}
              </pre>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function LifecycleStep({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      style={{
        padding: '4px 10px',
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 600,
        background: active ? '#6366f1' : '#1e293b',
        color: active ? '#fff' : '#64748b',
        border: `1px solid ${active ? '#6366f1' : '#334155'}`,
        transition: 'all 0.3s',
      }}
    >
      {label}
    </span>
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
    margin: '0 0 10px',
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: 500,
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    display: 'inline-block',
  },
  lifecycle: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 20,
    padding: '12px 0',
    borderTop: '1px solid #334155',
    borderBottom: '1px solid #334155',
  },
  arrow: {
    color: '#475569',
    fontSize: 14,
  },
  updateBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#451a03',
    border: '1px solid #f59e0b',
    borderRadius: 8,
    padding: '10px 14px',
    marginBottom: 16,
    color: '#fbbf24',
  },
  updateBtn: {
    background: '#f59e0b',
    color: '#0f172a',
    border: 'none',
    borderRadius: 6,
    padding: '6px 14px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 13,
  },
  section: {
    marginTop: 16,
  },
  btnRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  btn: {
    background: '#334155',
    color: '#e2e8f0',
    border: '1px solid #475569',
    borderRadius: 6,
    padding: '8px 14px',
    cursor: 'pointer',
    fontSize: 13,
  },
  messages: {
    marginTop: 12,
    color: '#94a3b8',
    fontSize: 13,
  },
  pre: {
    background: '#0f172a',
    borderRadius: 6,
    padding: '8px 12px',
    margin: '4px 0',
    fontSize: 12,
    overflowX: 'auto',
    color: '#6ee7b7',
  },
}
