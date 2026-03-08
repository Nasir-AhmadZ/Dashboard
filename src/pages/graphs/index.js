import { useState, useEffect } from 'react';
import classes from '../../styles/graph.module.css';

function GraphsPage() {
  const [behaviorData, setBehaviorData] = useState([]);

  useEffect(() => {
    fetch('/behavior_log.json')
      .then(res => res.json())
      .then(data => setBehaviorData(data))
      .catch(err => console.error('Fetch error:', err));
  }, []);

  const totalScore = behaviorData.reduce((sum, entry) => sum + entry.score, 0);

  return (
    <div className={classes.container}>
      <h1>Behavior Dashboard</h1>
      <div style={{ marginTop: '30px' }}>
        <h2>Total Score: {totalScore}</h2>
        <h3>Behavior Log ({behaviorData.length} entries)</h3>
        {behaviorData.map((entry, idx) => (
          <div key={idx} style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>
            <span>{entry.behavior}: </span>
            <strong>Score {entry.score}</strong>
            <span style={{ marginLeft: '10px', color: '#666' }}>
              ({new Date(entry.timestamp).toLocaleString()})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
export default GraphsPage;