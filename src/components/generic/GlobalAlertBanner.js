import { useState, useEffect, useRef, useContext } from 'react';
import GlobalContext from '../../pages/store/globalContext';

const DANGEROUS = ['Texting', 'Talking', 'Other'];
const MESSAGES = {
  Texting: '🚨 DANGER: Driver is texting!',
  Talking: '⚠️ WARNING: Driver is talking on the phone!',
  Other:   '⚠️ WARNING: Unsafe driving behavior detected!',
};
const COLORS = {
  Texting: '#c62828',
  Talking: '#e65100',
  Other:   '#f57f17',
};

export default function GlobalAlertBanner() {
  const [popup, setPopup] = useState(null);
  const lastTimestampRef = useRef(null);
  const timerRef = useRef(null);
  const alarmRef = useRef(null);
  const globalCtx = useContext(GlobalContext);
  const username = globalCtx?.theGlobalObject?.username;

  useEffect(() => {
    alarmRef.current = new Audio('/alarm.mp3');
  }, []);

  useEffect(() => {
    if (!username) return;

    const check = async () => {
      try {
        const res = await fetch(`/api/behavior-log?username=${encodeURIComponent(username)}`);
        const data = await res.json();
        if (!data.length) return;

        const latest = data[data.length - 1];
        if (latest.timestamp === lastTimestampRef.current) return;
        if (!DANGEROUS.includes(latest.behavior)) {
          lastTimestampRef.current = latest.timestamp;
          return;
        }

        lastTimestampRef.current = latest.timestamp;
        setPopup({ behavior: latest.behavior, timestamp: latest.timestamp });

        if (alarmRef.current) {
          alarmRef.current.currentTime = 0;
          alarmRef.current.play().catch(() => {});
        }

        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          dismiss();
        }, 6000);
      } catch {
        // server not available
      }
    };

    check();
    const interval = setInterval(check, 3000);
    return () => {
      clearInterval(interval);
      clearTimeout(timerRef.current);
    };
  }, [username]);

  const dismiss = () => {
    setPopup(null);
    if (alarmRef.current) {
      alarmRef.current.pause();
      alarmRef.current.currentTime = 0;
    }
    clearTimeout(timerRef.current);
  };

  if (!popup) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '80px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      backgroundColor: COLORS[popup.behavior] || '#b71c1c',
      color: '#fff',
      padding: '1rem 1.5rem',
      borderRadius: '8px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      display: 'flex',
      alignItems: 'center',
      gap: '1.2rem',
      minWidth: '320px',
      maxWidth: '90vw',
      animation: 'bannerPulse 0.6s ease-in-out infinite alternate',
    }}>
      <span style={{ fontSize: '1.1rem', fontWeight: 'bold', flex: 1 }}>
        {MESSAGES[popup.behavior]}
      </span>
      <button
        onClick={dismiss}
        style={{
          background: 'rgba(255,255,255,0.25)',
          border: 'none',
          color: '#fff',
          padding: '0.35rem 0.8rem',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '0.9rem',
          whiteSpace: 'nowrap',
        }}
      >
        Dismiss
      </button>
      <style>{`
        @keyframes bannerPulse {
          from { opacity: 1; box-shadow: 0 4px 20px rgba(0,0,0,0.4); }
          to   { opacity: 0.88; box-shadow: 0 4px 28px rgba(0,0,0,0.6); }
        }
      `}</style>
    </div>
  );
}
