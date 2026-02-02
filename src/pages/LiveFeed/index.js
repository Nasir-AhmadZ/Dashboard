import { useState, useEffect } from 'react';
import classes from '../../styles/projects.module.css';

function LiveFeedPage() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const streamUrl = 'http://localhost:8080/stream';

  useEffect(() => {
    // Check if stream is available
    const checkStream = async () => {
      try {
        const response = await fetch(streamUrl);
        if (response.ok) {
          setIsStreaming(true);
          setError(null);
        }
      } catch (err) {
        setIsStreaming(false);
        setError('Camera stream not available. Make sure the camera server is running.');
      }
    };

    checkStream();
    const interval = setInterval(checkStream, 5000);
    return () => clearInterval(interval);
  }, []);

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
        {isStreaming ? (
          <img 
            src={streamUrl}
            alt="Live Camera Feed"
            style={{
              maxWidth: '100%',
              height: 'auto',
              display: 'block'
            }}
            onError={() => {
              setIsStreaming(false);
              setError('Failed to load camera stream');
            }}
          />
        ) : (
          <div style={{ color: 'white', textAlign: 'center', padding: '2rem' }}>
            <p>Waiting for camera stream...</p>
            <p style={{ fontSize: '0.9rem', marginTop: '1rem' }}>
              Start the camera server with: <code>python3 camera_server.py</code>
            </p>
          </div>
        )}
      </div>

      <div style={{ marginTop: '1rem', color: '#888', fontSize: '0.9rem' }}>
        <p>Stream URL: {streamUrl}</p>
        <p>Status: {isStreaming ? '🟢 Connected' : '🔴 Disconnected'}</p>
      </div>
    </div>
  );
}

export default LiveFeedPage;