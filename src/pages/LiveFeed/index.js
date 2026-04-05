import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import GlobalContext from '../store/globalContext';

const CAM = process.env.NEXT_PUBLIC_CAM_URL;

export default function LiveFeedPage() {
  const [camOnline, setCamOnline] = useState(null);
  const [behavior, setBehavior] = useState(null);
  const [frameSrc, setFrameSrc] = useState('');
  const globalCtx = useContext(GlobalContext);
  const router = useRouter();

  useEffect(() => {
    if (!globalCtx.theGlobalObject.username) {
      router.push('/auth/login');
    }
  }, [globalCtx.theGlobalObject.username, router]);

  // Poll camera status every 3 s
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(`${CAM}/status`);
        const data = await res.json();
        setCamOnline(true);
        setBehavior(data);
      } catch {
        setCamOnline(false);
      }
    };
    check();
    const t = setInterval(check, 3000);
    return () => clearInterval(t);
  }, []);

  // Poll /frame every 100 ms for a live feed
  useEffect(() => {
    if (!camOnline) return;
    const poll = () => {
      setFrameSrc(`${CAM}/frame?t=${Date.now()}`);
    };
    poll();
    const t = setInterval(poll, 100);
    return () => clearInterval(t);
  }, [camOnline]);

  const behaviorColor = {
    Safe: '#22c55e', Turn: '#3b82f6',
    Texting: '#ef4444', Talking: '#f97316', Other: '#f59e0b',
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Live Camera Feed</h1>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <span style={{ ...styles.dot, background: camOnline ? '#22c55e' : '#ef4444' }} />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {camOnline === null ? 'Connecting…' : camOnline ? 'Camera online' : 'Camera offline'}
          </span>
        </div>
      </div>

      {/* Behavior badge */}
      {behavior?.verified && behavior?.behavior && (
        <div style={styles.behaviorRow}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Current behaviour:</span>
          <span style={{
            ...styles.behaviorBadge,
            background: `${behaviorColor[behavior.behavior] || '#666'}22`,
            color: behaviorColor[behavior.behavior] || '#aaa',
            border: `1px solid ${behaviorColor[behavior.behavior] || '#666'}44`,
          }}>
            {behavior.behavior}
          </span>
          {behavior.username && (
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              · Driver: <strong style={{ color: 'var(--accent)' }}>{behavior.username}</strong>
            </span>
          )}
        </div>
      )}

      {/* Stream */}
      <div style={styles.streamWrapper}>
        {camOnline === false ? (
          <div style={styles.offline}>
            <span style={{ fontSize: '2.5rem' }}>📷</span>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Camera server is not running</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Start it with: <code style={styles.code}>python camera_server_verified.py</code></p>
          </div>
        ) : (
          <img
            src={frameSrc}
            alt="Live Camera Feed"
            style={styles.stream}
            onError={() => setCamOnline(false)}
          />
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { maxWidth: '900px', margin: '0 auto' },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  title: {
    fontSize: '1.8rem',
    fontWeight: 800,
    letterSpacing: '-0.02em',
    margin: 0,
  },
  dot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    display: 'inline-block',
  },
  behaviorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    marginBottom: '0.75rem',
    flexWrap: 'wrap',
  },
  behaviorBadge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.85rem',
    fontWeight: 700,
  },
  streamWrapper: {
    width: '100%',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    background: '#000',
    border: '1px solid var(--border)',
    minHeight: '360px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stream: {
    width: '100%',
    height: 'auto',
    display: 'block',
  },
  offline: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '3rem',
    textAlign: 'center',
  },
  code: {
    background: 'var(--surface-2)',
    padding: '0.2rem 0.5rem',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '0.82rem',
    color: 'var(--accent)',
  },
};
