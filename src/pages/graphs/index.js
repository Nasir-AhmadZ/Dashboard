import { useState, useEffect } from 'react';
import classes from '../../styles/graph.module.css';

function GraphsPage() {
  const [userData, setUserData] = useState([]);
  const userId = 'user1';

  useEffect(() => {
    fetch(`/api/userdatas/${userId}`)
      .then(res => {
        console.log('Response status:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('Data received:', data);
        setUserData(data.dailyData || []);
      })
      .catch(err => console.error('Fetch error:', err));
  }, []);

  return (
    <div className={classes.container}>
      <h1>Analytics Dashboard</h1>
      <div style={{ marginTop: '30px' }}>
        <h2>Daily Data ({userData.length} entries)</h2>
        {userData.map((entry, idx) => (
          <div key={idx} style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>
            <span>{new Date(entry.date).toLocaleDateString()}: </span>
            <strong>{entry.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
export default GraphsPage;