import { useState, useContext, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import GlobalContext from '../store/globalContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [faceStatus, setFaceStatus] = useState('idle');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const globalCtx = useContext(GlobalContext);
  const pollRef = useRef(null);

  useEffect(() => {
    if (globalCtx.theGlobalObject.username) router.push('/');
  }, [globalCtx.theGlobalObject.username, router]);

  useEffect(() => () => clearInterval(pollRef.current), []);

  const startFaceLogin = () => {
    setFaceStatus('scanning');
    setError('');
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch('http://localhost:8080/verified-user');
        const data = await res.json();
        if (data.verified && data.username) {
          clearInterval(pollRef.current);
          setFaceStatus('detected');
          globalCtx.updateGlobals({ cmd: 'setUsername', newVal: data.username });
          await fetch('http://localhost:8080/set-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: data.username })
          }).catch(() => {});
          router.push('/');
        }
      } catch {
        clearInterval(pollRef.current);
        setFaceStatus('idle');
        setError('Camera server is not running');
      }
    }, 2000);
  };

  const stopFaceLogin = () => {
    clearInterval(pollRef.current);
    setFaceStatus('idle');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, email }),
      });
      const data = await res.json();
      if (res.ok) {
        globalCtx.updateGlobals({ cmd: 'setUsername', newVal: username });
        await fetch('http://localhost:8080/set-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, verified: true }),
        }).catch(() => {});
        router.push('/');
      } else {
        setError(data.detail || 'Login failed');
      }
    } catch {
      setError('Network error — is the server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <span style={styles.cardIcon}>🔐</span>
          <h1 style={styles.cardTitle}>Welcome back</h1>
          <p style={styles.cardSub}>Sign in to your driver dashboard</p>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleLogin} style={styles.form}>
          <input type="text" placeholder="Username" value={username}
            onChange={e => setUsername(e.target.value)} required />
          <input type="password" placeholder="Password" value={password}
            onChange={e => setPassword(e.target.value)} required />
          <input type="email" placeholder="Email" value={email}
            onChange={e => setEmail(e.target.value)} required />
          <button type="submit" disabled={loading} style={styles.btnPrimary}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.25rem 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>or</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>

        {faceStatus === 'idle' && (
          <button onClick={startFaceLogin} style={styles.btnFace}>
            👤 Sign in with Face Recognition
          </button>
        )}
        {faceStatus === 'scanning' && (
          <div style={styles.faceScanning}>
            <div style={styles.scanPulse} />
            <p style={{ color: 'var(--accent)', fontWeight: 600, margin: 0 }}>Scanning for your face…</p>
            <button onClick={stopFaceLogin} style={styles.btnCancel}>Cancel</button>
          </div>
        )}

        <div style={styles.footer}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No account?</span>
          <button onClick={() => router.push('/auth/register')} style={styles.btnLink}>
            Create one
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.4)} }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingTop: '2rem',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    background: 'var(--surface)',
    border: '1px solid var(--border-2)',
    borderRadius: 'var(--radius-lg)',
    padding: '2rem',
    boxShadow: 'var(--shadow)',
  },
  cardHeader: {
    textAlign: 'center',
    marginBottom: '1.75rem',
  },
  cardIcon: {
    fontSize: '2rem',
    display: 'block',
    marginBottom: '0.5rem',
  },
  cardTitle: {
    fontSize: '1.6rem',
    fontWeight: 800,
    marginBottom: '0.25rem',
  },
  cardSub: {
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
  },
  errorBox: {
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.3)',
    color: '#fca5a5',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    fontSize: '0.9rem',
    marginBottom: '1rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  btnPrimary: {
    width: '100%',
    padding: '0.8rem',
    background: 'var(--accent)',
    color: '#0d1117',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 700,
    fontSize: '0.95rem',
    cursor: 'pointer',
    marginTop: '0.25rem',
    transition: 'opacity 0.15s',
  },
  btnFace: {
    width: '100%',
    padding: '0.8rem',
    background: 'var(--surface-2)',
    color: 'var(--text)',
    border: '1px solid var(--border-2)',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '0.95rem',
    cursor: 'pointer',
    transition: 'border-color 0.15s, background 0.15s',
  },
  faceScanning: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem',
    background: 'var(--accent-dim)',
    border: '1px solid rgba(245,173,66,0.3)',
    borderRadius: '8px',
  },
  scanPulse: {
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    background: 'var(--accent)',
    animation: 'pulse 1.4s ease-in-out infinite',
  },
  btnCancel: {
    padding: '0.4rem 1rem',
    background: 'transparent',
    color: 'var(--text-muted)',
    border: '1px solid var(--border-2)',
    borderRadius: '6px',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  footer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '0.5rem',
    marginTop: '1.25rem',
  },
  btnLink: {
    background: 'none',
    border: 'none',
    color: 'var(--accent)',
    fontWeight: 600,
    fontSize: '0.9rem',
    cursor: 'pointer',
    padding: 0,
  },
};
