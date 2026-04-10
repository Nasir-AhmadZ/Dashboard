import classes from './MainNavigation.module.css'
import Link from 'next/link'
import { useContext, useEffect, useState } from 'react'
import GlobalContext from "../../pages/store/globalContext"
import { useRouter } from 'next/router'

const API = process.env.NEXT_PUBLIC_API_URL;

function MainNavigation() {
  const globalCtx = useContext(GlobalContext)
  const router = useRouter()
  const [alertCount, setAlertCount] = useState(0)
  const username = globalCtx.theGlobalObject.username

  useEffect(() => {
    if (!username) { setAlertCount(0); return; }
    const fetchCount = () => {
      fetch(`${API}/api/alerts/${encodeURIComponent(username)}`)
        .then(r => r.json())
        .then(data => setAlertCount(Array.isArray(data) ? data.length : 0))
        .catch(() => {});
    };
    fetchCount();
    const interval = setInterval(fetchCount, 10000);
    return () => clearInterval(interval);
  }, [username]);

  return (
    <header className={classes.header}>
      <div className={classes.leftSection}>
        <div className={classes.icon} onClick={() => router.push('/')} style={{cursor: 'pointer'}}>
          <img src="/Gemini_Generated_Image_9r2wc19r2wc19r2w.png" alt="Dashboard Icon" className={classes.iconImage} />
        </div>
        Dashboard
      </div>
      <nav>
        <ul>
          <li>
            <Link href='/'>Home</Link>
          </li>
          <li>
            <Link href='/Leaderboard'>LeaderBoard</Link>
          </li>
          <li>
            <Link href='/LiveFeed'>LiveFeed</Link>
          </li>
          <li>
            <Link href='/data'>Data</Link>
          </li>
          <li>
            <Link href='/notif' style={{ position: 'relative' }}>
              Notifications
              {alertCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  minWidth: '16px',
                  height: '16px',
                  padding: '0 4px',
                  background: '#ef4444',
                  color: '#fff',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1,
                }}>
                  {alertCount > 99 ? '99+' : alertCount}
                </span>
              )}
            </Link>
          </li>
        </ul>
      </nav>
      <div className={classes.userSection}>
        {globalCtx.theGlobalObject.username ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className={classes.username} style={{cursor:'pointer'}} onClick={() => router.push('/profile')}>{globalCtx.theGlobalObject.username}</div>
            <button 
              onClick={globalCtx.logout}
              style={{ 
                background: 'transparent', 
                border: '3px solid rgba(56, 56, 56, 0.3)', 
                color: (10, 10, 51),
                padding: '0.5rem 1rem', 
                borderRadius: '4px', 
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Logout
            </button>
          </div>
        ) : (
          <Link href='/auth/login' className={classes.loginLink}>Log In</Link>
        )}
      </div>
    </header>
  );
}

export default MainNavigation
