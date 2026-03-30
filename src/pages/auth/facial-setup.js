import { useState } from 'react';
import { useRouter } from 'next/router';

function FacialSetupPage() {
  const router = useRouter();
  const { username } = router.query;

  const [status, setStatus] = useState('idle'); // idle | uploading | done | error
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
        setMessage(`Setup complete — ${data.frames} frames saved.`);
      } else {
        setStatus('error');
        setMessage(data.detail || 'Upload failed');
      }
    } catch {
      setStatus('error');
      setMessage('Network error');
    }
  };

  const btnStyle = (bg) => ({ width: '100%', padding: '0.75rem', backgroundColor: bg, color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '0.75rem' });

  return (
    <div style={{ maxWidth: '480px', margin: '2rem auto', padding: '2rem' }}>
      <h1>Facial Setup</h1>
      <p style={{ color: '#aaa', marginBottom: '1.5rem' }}>
        Upload a short video of your face so we can recognise you when you log in.
      </p>

      <input
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
      />

      {selectedFile && (
        <p style={{ color: '#aaa', marginTop: '0.5rem' }}>Selected: {selectedFile.name}</p>
      )}

      {selectedFile && status !== 'done' && (
        <button onClick={handleUpload} disabled={status === 'uploading'} style={btnStyle('#38a169')}>
          {status === 'uploading' ? 'Processing…' : '✅ Save Facial Data'}
        </button>
      )}

      {status === 'done' && (
        <>
          <p style={{ color: '#38a169', marginTop: '1rem' }}>{message}</p>
          <button onClick={() => router.push('/auth/login')} style={btnStyle('rgb(245,173,66)')}>
            Continue to Login
          </button>
        </>
      )}

      {status === 'error' && <p style={{ color: '#e53e3e', marginTop: '1rem' }}>{message}</p>}

      <button
        onClick={() => router.push('/auth/login')}
        style={{ ...btnStyle('transparent'), border: '1px solid rgba(255,255,255,0.3)', marginTop: '0.5rem' }}
      >
        Skip for now
      </button>
    </div>
  );
}

export default FacialSetupPage;
