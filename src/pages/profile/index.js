import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import GlobalContext from '../store/globalContext';

const API = process.env.NEXT_PUBLIC_API_URL;

export default function ProfilePage() {
  const router = useRouter();
  const globalCtx = useContext(GlobalContext);
  const username = globalCtx.theGlobalObject.username;

  const [frames, setFrames] = useState([]);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    if (!username) { router.push('/auth/login'); return; }
    fetchFrames();
  }, [username]);

  const fetchFrames = async () => {
    const res = await fetch(`${API}/facial-frames/${username}`);
    const data = await res.json();
    setFrames(data.frames || []);
  };

  const handleDeleteAccount = async () => {
    if (!confirm(`Permanently delete account "${username}"? This cannot be undone.`)) return;
    try {
      await fetch(`${API}/api/users/${username}`, { method: 'DELETE' });
      await globalCtx.logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Delete account error:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete all verification images? You will need to re-upload a video.')) return;
    await fetch(`${API}/facial-frames/${username}`, { method: 'DELETE' });
    setFrames([]);
    setMessage('Facial data deleted.');
    setStatus('idle');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setMessage('');
    setStatus('idle');
  };

  const handleUpload = async () => {
    if (!selectedFile || !username) return;
    setStatus('uploading');
    setMessage('');
    const form = new FormData();
    form.append('video', selectedFile);
    form.append('username', username);
    try {
      const res = await fetch(`${API}/facial-setup`, { method: 'POST', body: form });
      const data = await res.json();
      if (res.ok) {
        setStatus('done');
        setMessage(`${data.frames} frames saved successfully.`);
        setSelectedFile(null);
        fetchFrames();
      } else {
        setStatus('error');
        setMessage(data.detail || 'Upload failed');
      }
    } catch {
      setStatus('error');
      setMessage('Network error');
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Avatar + name */}
        <div style={styles.avatarSection}>
          <div style={styles.avatar}>
            {username ? username[0].toUpperCase() : '?'}
          </div>
          <div>
            <h1 style={styles.name}>{username}</h1>
            <p style={styles.sub}>Driver account</p>
          </div>
        </div>

        <div style={styles.divider} />

        {/* Facial verification section */}
        <section>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Facial Verification</h2>
            <span style={{
              ...styles.badge,
              background: frames.length > 0 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
              color: frames.length > 0 ? '#86efac' : '#fca5a5',
              border: `1px solid ${frames.length > 0 ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            }}>
              {frames.length > 0 ? `${frames.length} frames` : 'Not set up'}
            </span>
          </div>

          {frames.length > 0 ? (
            <div style={styles.framesInfo}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
                Your face recognition data is configured. You can sign in using the camera.
              </p>
              <button onClick={handleDelete} style={styles.btnDanger}>
                🗑 Delete All Frames
              </button>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1rem' }}>
              No facial data stored. Upload a video to enable face login.
            </p>
          )}
        </section>

        <div style={styles.divider} />

        {/* Upload section */}
        <section>
          <h2 style={styles.sectionTitle}>
            {frames.length > 0 ? 'Replace Facial Data' : 'Add Facial Data'}
          </h2>
          <input type="file" accept="video/*" onChange={handleFileChange} style={{ marginBottom: '0.5rem' }} />

          {selectedFile && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
              Selected: {selectedFile.name}
            </p>
          )}

          {selectedFile && status !== 'done' && (
            <button onClick={handleUpload} disabled={status === 'uploading'} style={styles.btnPrimary}>
              {status === 'uploading' ? 'Processing…' : 'Save Facial Data'}
            </button>
          )}

          {status === 'done' && (
            <div style={styles.successBox}>✅ {message}</div>
          )}
          {status === 'error' && (
            <div style={styles.errorBox}>{message}</div>
          )}
          {status === 'idle' && message && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>{message}</p>
          )}
        </section>
        <div style={styles.divider} />

        {/* Danger zone */}
        <section>
          <h2 style={{ ...styles.sectionTitle, color: '#fca5a5' }}>Danger Zone</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '0.75rem' }}>
            Permanently deletes your account, all alerts, and facial data.
          </p>
          <button onClick={handleDeleteAccount} style={styles.btnDeleteAccount}>
            Delete Account
          </button>
        </section>
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: 'flex',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: '520px',
    background: 'var(--surface)',
    border: '1px solid var(--border-2)',
    borderRadius: 'var(--radius-lg)',
    padding: '2rem',
    boxShadow: 'var(--shadow)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  avatarSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  avatar: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: 'var(--accent-dim)',
    border: '2px solid rgba(245,173,66,0.35)',
    color: 'var(--accent)',
    fontWeight: 800,
    fontSize: '1.4rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  name: {
    fontSize: '1.3rem',
    fontWeight: 700,
    margin: 0,
  },
  sub: {
    color: 'var(--text-muted)',
    fontSize: '0.88rem',
    margin: '0.15rem 0 0',
  },
  divider: {
    height: '1px',
    background: 'var(--border)',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '0.75rem',
  },
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: 700,
    margin: 0,
  },
  badge: {
    fontSize: '0.75rem',
    fontWeight: 600,
    padding: '0.2rem 0.6rem',
    borderRadius: '20px',
  },
  framesInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  btnPrimary: {
    width: '100%',
    padding: '0.75rem',
    background: 'var(--accent)',
    color: '#0d1117',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 700,
    fontSize: '0.95rem',
    cursor: 'pointer',
  },
  btnDanger: {
    padding: '0.55rem 1rem',
    background: 'rgba(239,68,68,0.1)',
    color: '#fca5a5',
    border: '1px solid rgba(239,68,68,0.25)',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '0.88rem',
    cursor: 'pointer',
    alignSelf: 'flex-start',
  },
  btnDeleteAccount: {
    padding: '0.6rem 1.25rem',
    background: 'rgba(239,68,68,0.15)',
    color: '#fca5a5',
    border: '1px solid rgba(239,68,68,0.4)',
    borderRadius: '8px',
    fontWeight: 700,
    fontSize: '0.9rem',
    cursor: 'pointer',
  },
  successBox: {
    background: 'rgba(34,197,94,0.1)',
    border: '1px solid rgba(34,197,94,0.3)',
    color: '#86efac',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    fontSize: '0.9rem',
  },
  errorBox: {
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.3)',
    color: '#fca5a5',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    fontSize: '0.9rem',
  },
};
