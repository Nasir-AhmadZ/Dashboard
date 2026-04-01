import { useState } from 'react';
import { useRouter } from 'next/router';

export default function FacialSetupPage() {
  const router = useRouter();
  const { username } = router.query;
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

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
      const res = await fetch('http://localhost:5000/facial-setup', { method: 'POST', body: form });
      const data = await res.json();
      if (res.ok) {
        setStatus('done');
        setMessage(`${data.frames} frames saved successfully.`);
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
        <div style={styles.cardHeader}>
          <span style={styles.cardIcon}>📷</span>
          <h1 style={styles.cardTitle}>Facial Setup</h1>
          <p style={styles.cardSub}>
            Upload a short video of your face so the system can recognise you at sign-in.
          </p>
        </div>

        <div style={styles.tips}>
          <p style={styles.tipsTitle}>Tips for best results</p>
          <ul style={styles.tipsList}>
            <li>Good lighting, face the camera directly</li>
            <li>5–15 second video works well</li>
            <li>Avoid sunglasses or hats</li>
          </ul>
        </div>

        <input type="file" accept="video/*" onChange={handleFileChange} style={{ marginBottom: '0.75rem' }} />

        {selectedFile && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
            Selected: {selectedFile.name}
          </p>
        )}

        {status === 'done' ? (
          <>
            <div style={styles.successBox}>✅ {message}</div>
            <button onClick={() => router.push('/auth/login')} style={styles.btnPrimary}>
              Continue to Sign In
            </button>
          </>
        ) : (
          selectedFile && (
            <button onClick={handleUpload} disabled={status === 'uploading'} style={styles.btnPrimary}>
              {status === 'uploading' ? 'Processing…' : 'Save Facial Data'}
            </button>
          )
        )}

        {status === 'error' && (
          <div style={styles.errorBox}>{message}</div>
        )}

        <button onClick={() => router.push('/auth/login')} style={styles.btnGhost}>
          Skip for now
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: 'flex',
    justifyContent: 'center',
    paddingTop: '2rem',
  },
  card: {
    width: '100%',
    maxWidth: '460px',
    background: 'var(--surface)',
    border: '1px solid var(--border-2)',
    borderRadius: 'var(--radius-lg)',
    padding: '2rem',
    boxShadow: 'var(--shadow)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  cardHeader: {
    textAlign: 'center',
    marginBottom: '0.5rem',
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
    lineHeight: 1.6,
  },
  tips: {
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '0.85rem 1rem',
  },
  tipsTitle: {
    fontWeight: 600,
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    marginBottom: '0.4rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  tipsList: {
    paddingLeft: '1.2rem',
    color: 'var(--text-muted)',
    fontSize: '0.88rem',
    lineHeight: 1.8,
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
  },
  btnGhost: {
    width: '100%',
    padding: '0.8rem',
    background: 'transparent',
    color: 'var(--text-muted)',
    border: '1px solid var(--border-2)',
    borderRadius: '8px',
    fontWeight: 500,
    fontSize: '0.9rem',
    cursor: 'pointer',
  },
};
