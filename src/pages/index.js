import { useContext } from 'react';
import { useRouter } from 'next/router';
import GlobalContext from './store/globalContext';

const features = [
  { icon: '📷', title: 'Live Camera Feed', desc: 'Real-time monitoring of driver behaviour from the in-car camera.' },
  { icon: '🤖', title: 'AI Detection', desc: 'VGGNet model classifies Safe, Texting, Talking, Turning and Other in real time.' },
  { icon: '🏆', title: 'Leaderboard', desc: 'Compare your safety score against other drivers and rank up.' },
  { icon: '🚨', title: 'Instant Alerts', desc: 'Immediate pop-up notifications when dangerous behaviour is detected.' },
  { icon: '👤', title: 'Face Login', desc: 'Passwordless sign-in using facial recognition — no typing required.' },
  { icon: '📊', title: 'Behaviour History', desc: 'Full log of every driving event with timestamps and score impact.' },
];

export default function HomePage() {
  const globalCtx = useContext(GlobalContext);
  const router = useRouter();
  const username = globalCtx.theGlobalObject.username;

  return (
    <div>
      {/* Hero */}
      <section style={styles.hero}>
        <div style={styles.heroBadge}>🚗 Raspberry Pi 5 — On-Device AI</div>
        <h1 style={styles.heroTitle}>
          Road Rank<br />
          <span style={{ color: 'var(--accent)' }}>Dashboard</span>
        </h1>
        <p style={styles.heroSub}>
          Real-time driver monitoring powered by facial recognition and AI behaviour detection.
          Stay safe, track your score, and compete on the leaderboard.
        </p>
        {username ? (
          <div style={styles.heroCta}>
            <button style={styles.btnPrimary} onClick={() => router.push('/LiveFeed')}>
              View Live Feed
            </button>
            <button style={styles.btnGhost} onClick={() => router.push('/data')}>
              My Dashboard
            </button>
          </div>
        ) : (
          <div style={styles.heroCta}>
            <button style={styles.btnPrimary} onClick={() => router.push('/auth/login')}>
              Sign In
            </button>
            <button style={styles.btnGhost} onClick={() => router.push('/auth/register')}>
              Create Account
            </button>
          </div>
        )}
      </section>

      {/* Feature grid */}
      <section>
        <h2 style={styles.sectionTitle}>Everything you need</h2>
        <div style={styles.grid}>
          {features.map(f => (
            <div key={f.title} style={styles.card}>
              <div style={styles.cardIcon}>{f.icon}</div>
              <h3 style={styles.cardTitle}>{f.title}</h3>
              <p style={styles.cardDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const styles = {
  hero: {
    textAlign: 'center',
    padding: '4rem 1rem 3.5rem',
    maxWidth: '700px',
    margin: '0 auto',
  },
  heroBadge: {
    display: 'inline-block',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--accent)',
    background: 'var(--accent-dim)',
    border: '1px solid rgba(245,173,66,0.3)',
    borderRadius: '20px',
    padding: '0.3rem 0.9rem',
    marginBottom: '1.5rem',
    letterSpacing: '0.03em',
  },
  heroTitle: {
    fontSize: 'clamp(2.2rem, 5vw, 3.4rem)',
    fontWeight: 800,
    lineHeight: 1.15,
    marginBottom: '1.25rem',
    letterSpacing: '-0.03em',
  },
  heroSub: {
    fontSize: '1.05rem',
    color: 'var(--text-muted)',
    lineHeight: 1.7,
    maxWidth: '560px',
    margin: '0 auto 2rem',
  },
  heroCta: {
    display: 'flex',
    gap: '0.75rem',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  btnPrimary: {
    padding: '0.75rem 1.8rem',
    background: 'var(--accent)',
    color: '#0d1117',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 700,
    fontSize: '0.95rem',
    cursor: 'pointer',
    transition: 'opacity 0.15s, transform 0.1s',
  },
  btnGhost: {
    padding: '0.75rem 1.8rem',
    background: 'transparent',
    color: 'var(--text)',
    border: '1px solid var(--border-2)',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '0.95rem',
    cursor: 'pointer',
    transition: 'background 0.15s, border-color 0.15s',
  },
  sectionTitle: {
    fontSize: '1.4rem',
    fontWeight: 700,
    marginBottom: '1.25rem',
    color: 'var(--text)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '1rem',
  },
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.5rem',
    transition: 'border-color 0.2s, transform 0.15s',
  },
  cardIcon: {
    fontSize: '1.8rem',
    marginBottom: '0.75rem',
  },
  cardTitle: {
    fontSize: '1rem',
    fontWeight: 700,
    marginBottom: '0.4rem',
    color: 'var(--text)',
  },
  cardDesc: {
    fontSize: '0.88rem',
    color: 'var(--text-muted)',
    lineHeight: 1.6,
  },
};
