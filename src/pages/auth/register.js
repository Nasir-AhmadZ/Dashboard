import { useState } from 'react';
import { useRouter } from 'next/router';

function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://a05e8fed2beea4de190443ab6d31f84f-316498392.eu-west-1.elb.amazonaws.com:8000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify({ username, email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('Registration successful!');
        router.push('/auth/login');
      } else {
        alert(data.detail || 'Registration failed');
      }
    } catch (error) {
      alert('Network error');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '2rem auto', padding: '2rem' }}>
        <h1>Register</h1>
        <form onSubmit={handleRegister}>
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
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
          <button 
            type="submit"
            style={{ width: '100%', padding: '0.75rem', backgroundColor: 'rgb(245, 173, 66)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Register
          </button>
        </form>
    </div>
  );
}

export default RegisterPage;