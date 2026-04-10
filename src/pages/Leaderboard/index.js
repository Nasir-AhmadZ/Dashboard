import { useState, useEffect, useContext } from 'react';
import GlobalContext from '../store/globalContext';
import classes from '../../styles/leaderboard.module.css';

const API = process.env.NEXT_PUBLIC_API_URL;

function LeaderboardPage() {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const globalCtx = useContext(GlobalContext);
  const username = globalCtx?.theGlobalObject?.username;

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API}/api/leaderboard`);
      if (!response.ok) throw new Error('Failed to fetch leaderboard data');
      const data = await response.json();
      setLeaderboardData(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getMedalEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getScoreColor = (score) => {
    if (score >= 800) return classes.scoreHigh;
    if (score >= 500) return classes.scoreMedium;
    return classes.scoreLow;
  };

  if (loading) {
    return (
      <div className={classes.container}>
        <div className={classes.loading}>Loading leaderboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={classes.container}>
        <div className={classes.error}>Error: {error}</div>
        <button onClick={fetchLeaderboard} className={classes.retryButton}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={classes.container}>
      <div className={classes.header}>
        <h1 className={classes.title}>🏆 Leaderboard</h1>
      </div>

      <div className={classes.leaderboardList}>
        {leaderboardData.map((player, index) => {
          const isMe = username && player.name.toLowerCase() === username.toLowerCase();
          return (
            <div
              key={player._id}
              className={`${classes.leaderboardItem} ${index < 3 ? classes.topThree : ''} ${isMe ? classes.myRow : ''}`}
            >
              <div className={classes.rankSection}>
                <span className={classes.rank}>{getMedalEmoji(player.rank)}</span>
              </div>

              <div className={classes.nameSection}>
                <span className={classes.name}>{player.name}</span>
                {isMe && <span className={classes.youBadge}>You</span>}
              </div>

              <div className={classes.scoreSection}>
                <span className={`${classes.score} ${getScoreColor(player.score)}`}>
                  {player.score}
                </span>
                <span className={classes.points}>pts</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default LeaderboardPage;