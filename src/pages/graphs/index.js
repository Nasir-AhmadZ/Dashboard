import { useState, useEffect } from 'react';
import classes from '../../styles/graph.module.css';

function GraphsPage() {
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchGraphData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch graph for current active user
      const response = await fetch('http://localhost:5000/graph/current-user');
      if (response.ok) {
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        setGraphData({ imageUrl });
      } else {
        setError('Failed to fetch graph data');
      }
    } catch (error) {
      setError('Error connecting to graph service');
      console.error('Error fetching graph data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraphData();
  }, []);

  return (
    <div className={classes.container}>
      <h1>Time Tracking Graphs</h1>
      
        <h2>Time Entry Analytics</h2>
        <button onClick={fetchGraphData} className={classes.refreshBtn}>
          Refresh Data
        </button>
        
        {loading && <p>Loading graph data...</p>}
        {error && <p className={classes.error}>{error}</p>}
        
        {graphData && (
          <div className={classes.graphContainer}>
            <img 
              src={graphData.imageUrl} 
              alt="Time Entry Graph" 
              className={classes.graph}
            />
          </div>
        )}
        
        {!graphData && !loading && !error && (
          <p>No graph data available. Make sure the Python graph service is running on port 5000.</p>
        )}
    </div>
  );
}

export default GraphsPage;