import { useEffect, useContext } from 'react';
import '../styles/globals.css'
import Layout from '../components/layout/Layout'
import { GlobalContextProvider } from './store/globalContext'
import GlobalContext from './store/globalContext';

const CAM = process.env.NEXT_PUBLIC_CAM_URL;

// Runs globally so the camera server always knows the active user
// and keeps receiving status pings regardless of which page is open.
function BehaviorSessionInit() {
  const globalCtx = useContext(GlobalContext);
  const username = globalCtx?.theGlobalObject?.username;

  useEffect(() => {
    if (!username) return;
    fetch(`${CAM}/set-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, verified: true }),
    }).catch(() => {});
  }, [username]);

  // Keep the camera server's detection loop alive on every page
  useEffect(() => {
    if (!username) return;
    const interval = setInterval(() => {
      fetch(`${CAM}/status`).catch(() => {});
    }, 3000);
    return () => clearInterval(interval);
  }, [username]);

  return null;
}

function MyApp({ Component, pageProps }) {
  return (
    <GlobalContextProvider>
      <BehaviorSessionInit />
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </GlobalContextProvider>
  );
}

export default MyApp
