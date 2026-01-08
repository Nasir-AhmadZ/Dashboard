import { useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/router';

import GlobalContext from '../store/globalContext';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const router = useRouter();
  const globalCtx = useContext(GlobalContext);

  // Redirect if already logged in
  useEffect(() => {
    if (globalCtx.theGlobalObject.username) {
      router.push('/');
    }
  }, [globalCtx.theGlobalObject.username, router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://a65d0917c228c441b8b876093dfffd7e-579877813.eu-west-1.elb.amazonaws.com:8000/login', {
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