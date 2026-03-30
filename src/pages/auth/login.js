import { useState, useContext, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

import GlobalContext from '../store/globalContext';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [faceStatus, setFaceStatus] = useState('idle'); // idle | scanning | detected
  const router = useRouter();
  const globalCtx = useContext(GlobalContext);
  const pollRef = useRef(null);

  useEffect(() => {
    if (globalCtx.theGlobalObject.username) {
      router.push('/');
    }
  }, [globalCtx.theGlobalObject.username, router]);

  // Clean up polling on unmount
  useEffect(() => () => clearInterval(pollRef.current), []);

  const startFaceLogin = () => {
    setFaceStatus('scanning');
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch('http://localhost:8080/verified-user');
        const data = await res.json();
        if (data.verified && data.username) {
          clearInterval(pollRef.current);
          setFaceStatus('detected');
          globalCtx.updateGlobals({ cmd: 'setUsername', newVal: data.username });
          router.push('/');
        }
      } catch {
        // camera server not running, stop polling
        clearInterval(pollRef.current);
        setFaceStatus('idle');
        alert('Camera server is not running');
      }
    }, 2000);
  };

  const stopFaceLogin = () => {
    clearInterval(pollRef.current);
    setFaceStatus('idle');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, email })
      });
      const data = await response.json();
      
      if (response.ok) {
        globalCtx.updateGlobals({ cmd: 'setUsername', newVal: username });
        alert('Login successful!');
        router.push('/');
      } else {
        alert(data.detail || 'Login failed');
      }
    } catch (error) {
      alert('Network error');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '2rem auto', padding: '2rem' }}>
        <h1>Login</h1>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          <button
            type="submit"
            style={{ width: '100%', padding: '0.75rem', backgroundColor: 'rgb(245, 173, 66)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Login
          </button>
        </form>

        <div style={{ margin: '1.5rem 0', textAlign: 'center', color: '#aaa' }}>— or —</div>

        {faceStatus === 'idle' && (
          <button
            onClick={startFaceLogin}
            style={{ width: '100%', padding: '0.75rem', backgroundColor: '#4a5568', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            👤 Login with Face
          </button>
        )}
        {faceStatus === 'scanning' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'rgb(245,173,66)', marginBottom: '0.5rem' }}>🔍 Scanning for your face…</p>
            <button
              onClick={stopFaceLogin}
              style={{ padding: '0.5rem 1rem', backgroundColor: 'transparent', color: '#aaa', border: '1px solid #aaa', borderRadius: '4px', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        )}
        <button
          onClick={() => router.push('/auth/register')}
          style={{ width: '100%', padding: '0.75rem', backgroundColor: 'transparent', color: 'white', border: '1px solid rgba(255, 255, 255, 0.3)', borderRadius: '4px', cursor: 'pointer', marginTop: '1rem' }}
        >
          Register
        </button>
    </div>
  );
}

export default LoginPage;