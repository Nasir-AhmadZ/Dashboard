import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import GlobalContext from '../store/globalContext';
import classes from '../../styles/graph.module.css';

const BEHAVIOR_COLORS = {
  Safe:    '#2e7d32',
  Turn:    '#1565c0',
  Texting: '#c62828',
  Talking: '#e65100',
  Other:   '#f57f17',
};

function GraphsPage() {
  const [behaviorData, setBehaviorData] = useState([]);
  const [loading, setLoading] = useState(true);
  const globalCtx = useContext(GlobalContext);
  const username = globalCtx?.theGlobalObject?.username;
  const router = useRouter();

  useEffect(() => {
    if (!username) { router.push('/auth/login'); return; }
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [username]);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/behavior-log?username=${encodeURIComponent(username)}`);
      const data = await res.json();
      setBehaviorData(data.reverse()); // newest first
    } catch {
      // server unavailable
    } finally {
      setLoading(false);
    }
  };

  const totalScore = behaviorData.reduce((sum, e) => sum + (e.score || 0), 0);

  // Tally by behavior type
  const tally = behaviorData.reduce((acc, e) => {
    acc[e.behavior] = (acc[e.behavior] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className={classes.container}>
      <h1>Behavior Dashboard</h1>

      {loading && <p style={{ color: '#888' }}>Loading…</p>}

      {!loading && (
        <>
          {/* Summary cards */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
            <div style={cardStyle('#1a237e')}>
              <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>Cumulative Score</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{totalScore}</div>
            </div>
            <div style={cardStyle('#37474f')}>
              <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>Total Events</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{behaviorData.length}</div>
            </div>
            {Object.entries(tally).map(([behavior, count]) => (
              <div key={behavior} style={cardStyle(BEHAVIOR_COLORS[behavior] || '#555')}>
                <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>{behavior}</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{count}</div>
              </div>
            ))}
          </div>

          {/* Log entries */}
          <h3 style={{ marginBottom: '0.75rem' }}>Event Log ({behaviorData.length} entries)</h3>
          {behaviorData.length === 0 && (
            <p style={{ color: '#888' }}>No behavior events recorded yet.</p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {behaviorData.map((entry, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.6rem 1rem',
                  borderRadius: '6px',
                  borderLeft: `4px solid ${BEHAVIOR_COLORS[entry.behavior] || '#888'}`,
                  backgroundColor: 'rgba(255,255,255,0.08)',
                }}
              >
                <span style={{ fontWeight: 'bold', color: BEHAVIOR_COLORS[entry.behavior] || '#333', minWidth: '90px' }}>
                  {entry.behavior}
                </span>
                <span style={{ color: entry.score >= 0 ? '#2e7d32' : '#c62828', fontWeight: 'bold', minWidth: '60px', textAlign: 'right' }}>
                  {entry.score >= 0 ? '+' : ''}{entry.score} pts
                </span>
                <span style={{ color: '#888', fontSize: '0.85rem', textAlign: 'right' }}>
                  {new Date(entry.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function cardStyle(bg) {
  return {
    backgroundColor: bg,
    color: '#fff',
    borderRadius: '8px',
    padding: '1rem 1.4rem',
    minWidth: '120px',
  };
}

export default GraphsPage;
