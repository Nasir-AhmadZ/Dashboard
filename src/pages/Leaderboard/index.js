// rename to LeaderboardPage.jsx
import { useState, useEffect } from 'react';
import classes from '../../styles/leaderboard.module.css';

const API = process.env.NEXT_PUBLIC_API_URL;

function LeaderboardPage() {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const seedDatabase = async () => {
    try {
      const response = await fetch(`${API}/api/leaderboard/seed`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to seed database');
      fetchLeaderboard();
    } catch (err) {
      setError(err.message);
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
        <button onClick={seedDatabase} className={classes.seedButton}>
          Reseed Data
        </button>
      </div>

      <div className={classes.leaderboardList}>
        {leaderboardData.map((player, index) => (
          <div 
            key={player._id} 
            className={`${classes.leaderboardItem} ${index < 3 ? classes.topThree : ''}`}
          >
            <div className={classes.rankSection}>
              <span className={classes.rank}>{getMedalEmoji(player.rank)}</span>
            </div>
            
            <div className={classes.nameSection}>
              <span className={classes.name}>{player.name}</span>
            </div>
            
            <div className={classes.scoreSection}>
              <span className={`${classes.score} ${getScoreColor(player.score)}`}>
                {player.score}
              </span>
              <span className={classes.points}>pts</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LeaderboardPage;