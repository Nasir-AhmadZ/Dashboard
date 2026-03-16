import { useState, useEffect, useRef } from 'react';
import classes from '../../styles/notif.module.css';

const UNSAFE_BEHAVIORS = ['Talking', 'Texting', 'Other'];
const BEHAVIOR_MESSAGES = {
  Talking: '⚠️ Warning: Driver is talking on the phone!',
  Texting: '🚨 Danger: Driver is texting!',
  Other: '⚠️ Warning: Unsafe driving behavior detected!',
};

function NotifPage() {
  const [alerts, setAlerts] = useState([]);
  const [activeWarning, setActiveWarning] = useState(null);
  const alarmRef = useRef(null);
  const lastTimestampRef = useRef(null);

  useEffect(() => {
    alarmRef.current = new Audio('/alarm.mp3');
    alarmRef.current.loop = true;
  }, []);

  useEffect(() => {
    const check = () => {
      fetch('/behavior_log.json?t=' + Date.now())
        .then(res => res.json())
        .then(data => {
          if (!data.length) return;
          const latest = data[data.length - 1];
          if (latest.timestamp === lastTimestampRef.current) return;
          lastTimestampRef.current = latest.timestamp;

          if (UNSAFE_BEHAVIORS.includes(latest.behavior)) {
            const alert = {
              id: Date.now(),
              behavior: latest.behavior,
              message: BEHAVIOR_MESSAGES[latest.behavior],
              timestamp: latest.timestamp,
              score: latest.score,
            };
            setAlerts(prev => [alert, ...prev]);
            setActiveWarning(alert);
            alarmRef.current.play().catch(() => {});
            setTimeout(() => {
              setActiveWarning(null);
              alarmRef.current.pause();
              alarmRef.current.currentTime = 0;
            }, 5000);
          }
        })
        .catch(() => {});
    };

    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, []);

  const dismissAlert = (id) => setAlerts(prev => prev.filter(a => a.id !== id));

  return (
    <div className={classes.container}>
      <h1>Alerts</h1>

      {activeWarning && (
        <div style={{
          backgroundColor: activeWarning.behavior === 'Texting' ? '#ff1744' : '#ff9800',
          color: 'white', padding: '1.5rem', borderRadius: '8px',
          marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: 'bold',
          animation: 'pulse 0.5s infinite alternate'
        }}>
          {activeWarning.message}
        </div>
      )}

      <div className={classes.ntfs}>
        {alerts.length === 0 && <p style={{ color: '#888' }}>No alerts yet.</p>}
        {alerts.map(alert => (
          <div key={alert.id} className={classes.ntf} style={{
            borderLeft: `4px solid ${alert.behavior === 'Texting' ? '#ff1744' : '#ff9800'}`
          }}>
            <div>
              <strong>{alert.message}</strong>
              <p>{new Date(alert.timestamp).toLocaleString()} — Score: {alert.score}</p>
            </div>
            <button className={classes.deleteBtn} onClick={() => dismissAlert(alert.id)}>Dismiss</button>
          </div>
        ))}
      </div>

      <style>{`@keyframes pulse { from { opacity: 1; } to { opacity: 0.6; } }`}</style>
    </div>
  );
}

export default NotifPage;