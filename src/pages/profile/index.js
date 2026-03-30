import { useState, useRef, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import GlobalContext from '../store/globalContext';

function ProfilePage() {
  const router = useRouter();
  const globalCtx = useContext(GlobalContext);
  const username = globalCtx.theGlobalObject.username;

  const [frames, setFrames] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | uploading | done | error
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    if (!username) { router.push('/auth/login'); return; }
    fetchFrames();
  }, [username]);

  const fetchFrames = async () => {
    const res = await fetch(`http://localhost:5000/facial-frames/${username}`);
    const data = await res.json();
    setFrames(data.frames || []);
  };

  const handleDelete = async () => {
    if (!confirm('Delete all verification images? You will need to re-upload a video.')) return;
    const res = await fetch(`http://localhost:5000/facial-frames/${username}`, { method: 'DELETE' });
    const data = await res.json();
    setFrames([]);
    setMessage(data.message);
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
      const res = await fetch('http://localhost:5000/facial-setup', { method: 'POST', body: form });
      const data = await res.json();
      if (res.ok) {
        setStatus('done');
        setMessage(`✅ ${data.frames} frames saved successfully.`);
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

  const btnStyle = (bg, extra = {}) => ({
    padding: '0.6rem 1.2rem',
    backgroundColor: bg,
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    ...extra
  });

  return (
    <div style={{ maxWidth: '560px', margin: '2rem auto', padding: '2rem' }}>
      <h1>Profile</h1>
      <p style={{ color: '#aaa' }}>Logged in as <strong>{username}</strong></p>

      <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '1.5rem 0' }} />

      {/* Verification images section */}
      <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Facial Verification</h2>

      {frames.length > 0 ? (
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ color: '#aaa', marginBottom: '0.5rem' }}>
            {frames.length} verification frame{frames.length !== 1 ? 's' : ''} stored.
          </p>
          <button onClick={handleDelete} style={btnStyle('#e53e3e')}>
            🗑 Delete All Frames
          </button>
        </div>
      ) : (
        <p style={{ color: '#aaa', marginBottom: '1rem' }}>No verification images stored yet.</p>
      )}

      <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '1.5rem 0' }} />

      {/* Upload / record section */}
      <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>
        {frames.length > 0 ? 'Replace Facial Data' : 'Add Facial Data'}
      </h2>

      <input
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '0.75rem' }}
      />

      {selectedFile && (
        <p style={{ color: '#aaa', marginBottom: '0.75rem' }}>Selected: {selectedFile.name}</p>
      )}

      {selectedFile && status !== 'done' && (
        <button
          onClick={handleUpload}
          disabled={status === 'uploading'}
          style={btnStyle('#38a169', { width: '100%', padding: '0.75rem' })}
        >
          {status === 'uploading' ? 'Processing…' : '✅ Save Facial Data'}
        </button>
      )}

      {message && (
        <p style={{ marginTop: '1rem', color: status === 'error' ? '#e53e3e' : '#38a169' }}>
          {message}
        </p>
      )}
    </div>
  );
}

export default ProfilePage;
