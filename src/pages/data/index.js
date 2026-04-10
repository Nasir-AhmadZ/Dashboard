import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import GlobalContext from '../store/globalContext';
import classes from '../../styles/graph.module.css';

const PAGE_SIZE = 20;

const API = process.env.NEXT_PUBLIC_API_URL;

const BEHAVIOR_COLORS = {
  Safe:    '#2e7d32',
  Turn:    '#1565c0',
  Texting: '#c62828',
  Talking: '#e65100',
  Other:   '#f57f17',
};

function ScoreChart({ data }) {
  if (data.length < 2) return null;

  const W = 800, H = 200, PL = 50, PR = 16, PT = 16, PB = 36;
  const iW = W - PL - PR;
  const iH = H - PT - PB;

  // Build cumulative score series oldest→newest
  let running = 0;
  const points = data.map(e => { running += e.score || 0; return running; });
  const minY = Math.min(...points);
  const maxY = Math.max(...points);
  const rangeY = maxY - minY || 1;

  const px = i => PL + (i / (points.length - 1)) * iW;
  const py = v => PT + iH - ((v - minY) / rangeY) * iH;

  const polyline = points.map((v, i) => `${px(i)},${py(v)}`).join(' ');

  // Y-axis ticks
  const ticks = [minY, Math.round((minY + maxY) / 2), maxY];

  // X-axis labels: first, middle, last timestamp
  const fmt = ts => {
    const d = new Date(ts);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };
  const xLabels = [
    { i: 0, label: fmt(data[0].timestamp) },
    { i: Math.floor((data.length - 1) / 2), label: fmt(data[Math.floor((data.length - 1) / 2)].timestamp) },
    { i: data.length - 1, label: fmt(data[data.length - 1].timestamp) },
  ];

  const lastX = px(points.length - 1);
  const lastY = py(points[points.length - 1]);

  return (
    <div style={{ marginBottom: '2rem' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
        Score Over Time
      </h3>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1rem', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', minWidth: '320px', height: 'auto', display: 'block' }}>
          {/* Grid lines */}
          {ticks.map((t, i) => (
            <line key={i} x1={PL} x2={W - PR} y1={py(t)} y2={py(t)} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          ))}
          {/* Y-axis labels */}
          {ticks.map((t, i) => (
            <text key={i} x={PL - 8} y={py(t) + 4} textAnchor="end" fontSize="11" fill="rgba(255,255,255,0.35)">{t}</text>
          ))}
          {/* X-axis labels */}
          {xLabels.map(({ i, label }) => (
            <text key={i} x={px(i)} y={H - 6} textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.35)">{label}</text>
          ))}
          {/* Area fill */}
          <polygon
            points={`${PL},${PT + iH} ${polyline} ${px(points.length - 1)},${PT + iH}`}
            fill="rgba(245,173,66,0.08)"
          />
          {/* Line */}
          <polyline points={polyline} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          {/* Last point dot */}
          <circle cx={lastX} cy={lastY} r="4" fill="var(--accent)" />
        </svg>
      </div>
    </div>
  );
}

function GraphsPage() {
  const [behaviorData, setBehaviorData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
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
      const res = await fetch(`${API}/api/behavior-log?username=${encodeURIComponent(username)}`);
      const data = await res.json();
      setBehaviorData(data.reverse()); // newest first
    } catch {
      // server unavailable
    } finally {
      setLoading(false);
    }
  };

  const totalScore = behaviorData.reduce((sum, e) => sum + (e.score || 0), 0);

  const tally = behaviorData.reduce((acc, e) => {
    acc[e.behavior] = (acc[e.behavior] || 0) + 1;
    return acc;
  }, {});

  const totalPages = Math.ceil(behaviorData.length / PAGE_SIZE);
  const pageEntries = behaviorData.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className={classes.container}>
      <h1>Behavior Dashboard</h1>

      {loading && <p style={{ color: '#888' }}>Loading…</p>}

      {!loading && (
        <>
          {/* Score trend chart */}
          <ScoreChart data={[...behaviorData].reverse()} />

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ margin: 0 }}>Event Log ({behaviorData.length} entries)</h3>
            {totalPages > 1 && (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Page {page + 1} of {totalPages}
              </span>
            )}
          </div>

          {behaviorData.length === 0 && (
            <p style={{ color: '#888' }}>No behavior events recorded yet.</p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {pageEntries.map((entry, idx) => (
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

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                style={paginationBtn(page === 0)}
              >
                ← Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  style={paginationBtn(false, i === page)}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                style={paginationBtn(page === totalPages - 1)}
              >
                Next →
              </button>
            </div>
          )}
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

function paginationBtn(disabled, active = false) {
  return {
    padding: '0.4rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid var(--border-2)',
    background: active ? 'var(--accent)' : 'var(--surface)',
    color: active ? '#0d1117' : disabled ? 'var(--text-muted)' : 'var(--text)',
    fontWeight: 600,
    fontSize: '0.85rem',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
  };
}

export default GraphsPage;
