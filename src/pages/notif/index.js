import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import GlobalContext from '../store/globalContext';
import classes from '../../styles/notif.module.css';

const BEHAVIOR_MESSAGES = {
  Talking: 'Driver was talking on the phone',
  Texting: 'Driver was texting',
  Other:   'Unsafe driving behavior detected',
};
const BEHAVIOR_COLORS = {
  Texting: '#c62828',
  Talking: '#e65100',
  Other:   '#f57f17',
};

function NotifPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const globalCtx = useContext(GlobalContext);
  const username = globalCtx?.theGlobalObject?.username;
  const router = useRouter();

  useEffect(() => {
    if (!username) { router.push('/auth/login'); return; }
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, [username]);

  const fetchAlerts = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/alerts/${encodeURIComponent(username)}`);
      const data = await res.json();
      setAlerts(data);
    } catch {
      // server unavailable
    } finally {
      setLoading(false);
    }
  };

  const clearAlerts = async () => {
    if (!confirm('Clear all your alerts?')) return;
    try {
      await fetch(`http://localhost:5000/api/alerts/${encodeURIComponent(username)}`, { method: 'DELETE' });
      setAlerts([]);
    } catch {
      alert('Failed to clear alerts');
    }
  };

  return (
    <div className={classes.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0 }}>Alerts</h1>
        {alerts.length > 0 && (
          <button className={classes.deleteBtn} onClick={clearAlerts}>
            Clear All
          </button>
        )}
      </div>

      {loading && <p style={{ color: '#888' }}>Loading alerts…</p>}

      {!loading && alerts.length === 0 && (
        <p style={{ color: '#888' }}>No dangerous behavior alerts recorded.</p>
      )}

      <div className={classes.ntfs}>
        {alerts.map(alert => (
          <div
            key={alert._id}
            className={classes.ntf}
            style={{ borderLeft: `4px solid ${BEHAVIOR_COLORS[alert.behavior] || '#888'}` }}
          >
            <div>
              <strong style={{ color: BEHAVIOR_COLORS[alert.behavior] || '#333' }}>
                {alert.behavior === 'Texting' ? '🚨' : '⚠️'} {BEHAVIOR_MESSAGES[alert.behavior] || alert.behavior}
              </strong>
              <p>
                {new Date(alert.timestamp).toLocaleString()} &mdash; Score impact:{' '}
                <span style={{ color: '#c62828', fontWeight: 'bold' }}>{alert.score}</span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default NotifPage;
