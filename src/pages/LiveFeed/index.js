import { useState, useEffect } from 'react';
import classes from '../../styles/projects.module.css';

function LiveFeedPage() {
  const [error, setError] = useState(null);
  const streamUrl = 'http://192.168.0.34:8080/stream';

  return (
    <div className={classes.container}>
      <h1>Live Camera Feed</h1>
      
      {error && (
        <div style={{ 
          padding: '1rem', 
          backgroundColor: '#ff6b6b', 
          color: 'white', 
          borderRadius: '4px',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        minHeight: '480px',
        backgroundColor: '#000',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <img 
          src={streamUrl}
          alt="Live Camera Feed"
          style={{
            maxWidth: '100%',
            height: 'auto',
            display: 'block'
          }}
          onError={() => setError('Failed to load camera stream')}
        />
      </div>

      <div style={{ marginTop: '1rem', color: '#888', fontSize: '0.9rem' }}>
        <p>Stream URL: {streamUrl}</p>
      </div>
    </div>
  );
}

export default LiveFeedPage;