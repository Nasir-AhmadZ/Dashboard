import { useState, useEffect } from 'react';
import classes from '../../styles/timetrack.module.css';

function TimeTrackPage() {
  const [projects, setProjects] = useState([]);
  const [entries, setEntries] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [entryName, setEntryName] = useState('');
  const [activeEntries, setActiveEntries] = useState([]);
  const [selectedEntryId, setSelectedEntryId] = useState('');
  const [editEntryName, setEditEntryName] = useState('');
  const [editProjectId, setEditProjectId] = useState('');
  const [selectedView, setSelectedView] = useState('recent');
  const [displayEntries, setDisplayEntries] = useState([]);

  useEffect(() => {
    fetchProjects();
    fetchEntries();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('http://a2090d8f11ab942f0897c2471569b105-1957319447.eu-west-1.elb.amazonaws.com:8002/projects/');
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchEntries = async () => {
    try {
      const response = await fetch('http://a2090d8f11ab942f0897c2471569b105-1957319447.eu-west-1.elb.amazonaws.com:8002/entries/');
      const data = await response.json();
      setEntries(data);
      const active = data.filter(entry => !entry.endtime);
      setActiveEntries(active);
    } catch (error) {
      console.error('Error fetching entries:', error);
    }
  };

  const startEntry = async () => {
    if (!selectedProject || !entryName) return;

    try {
      const response = await fetch('http://a2090d8f11ab942f0897c2471569b105-1957319447.eu-west-1.elb.amazonaws.com:8002/entries/', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: entryName,
          project_group_id: selectedProject
        })
      });
      
      if (response.ok) {
        setEntryName('');
        fetchEntries();
      }
    } catch (error) {
      console.error('Error starting entry:', error);
    }
  };

  const stopSpecificEntry = async (entryId) => {
    try {
      const response = await fetch(`http://a2090d8f11ab942f0897c2471569b105-1957319447.eu-west-1.elb.amazonaws.com:8002/entries/${entryId}`, {
        method: 'PATCH'
      });
      
      if (response.ok) {
        fetchEntries();
      }
    } catch (error) {
      console.error('Error stopping entry:', error);
    }
  };

  const deleteEntry = async (entryId) => {
    try {
      const response = await fetch(`http://a2090d8f11ab942f0897c2471569b105-1957319447.eu-west-1.elb.amazonaws.com:8002/entry/${entryId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchEntries();
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  const updateEntry = async () => {
    if (!selectedEntryId || !editEntryName) return;

    try {
      const body = { name: editEntryName };
      if (editProjectId) body.project_group_id = editProjectId;

      const response = await fetch(`http://a2090d8f11ab942f0897c2471569b105-1957319447.eu-west-1.elb.amazonaws.com:8002/entries/update/${selectedEntryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (response.ok) {
        setSelectedEntryId('');
        setEditEntryName('');
        setEditProjectId('');
        fetchEntries();
      }
    } catch (error) {
      console.error('Error updating entry:', error);
    }
  };

  const handleViewChange = async (value) => {
    setSelectedView(value);
    
    if (value === 'recent') {
      setDisplayEntries(entries.slice(0, 10));
    } else {
      try {
        const response = await fetch(`http://a2090d8f11ab942f0897c2471569b105-1957319447.eu-west-1.elb.amazonaws.com:8002/entries/project/${value}`);
        const data = await response.json();
        setDisplayEntries(data);
      } catch (error) {
        console.error('Error fetching project entries:', error);
      }
    }
  };

  useEffect(() => {
    if (selectedView === 'recent') {
      setDisplayEntries(entries.slice(0, 10));
    }
  }, [entries]);

  const formatDuration = (seconds) => {
    if (!seconds) return '0s';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  return (
      <div className={classes.container}>
        <h1>Time Entry Management</h1>
        
          <h2>Start New Entry</h2>
          <div className={classes.inpt}>
            <input
              type="text"
              placeholder="Entry name"
              value={entryName}
              onChange={(e) => setEntryName(e.target.value)}
            />
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
            >
              {projects.length === 0 ? (
                <option value="">Create Project First</option>
              ) : (
                <>
                  <option value="">Select Project</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </>
              )}
            </select>
            <button onClick={startEntry} className={classes.startBtn}>
              Start Timer
            </button>
          </div>
          
          {activeEntries.length > 0 && (
            <div className={classes.activeEntries}>
              <h3>Active Entries:</h3>
              {activeEntries.map(entry => (
                <div key={entry.id} className={classes.activeEntry}>
                  <div>
                    <strong>{entry.name}</strong>
                    <p>Started: {new Date(entry.starttime).toLocaleString()}</p>
                  </div>
                  <button onClick={() => stopSpecificEntry(entry.id)} className={classes.stopBtn}>
                    Stop
                  </button>
                </div>
              ))}
            </div>
          )}

          <h2>Update Entry</h2>
          <div className={classes.inpt}>
            <select
              value={selectedEntryId}
              onChange={(e) => {
                const entryId = e.target.value;
                setSelectedEntryId(entryId);
                if (entryId) {
                  const entry = entries.find(e => e.id == entryId);
                  if (entry) {
                    setEditEntryName(entry.name);
                  }
                }
              }}
            >
              <option value="">Select Entry to Edit</option>
              {entries.map(entry => (
                <option key={entry.id} value={entry.id}>
                  {entry.name} - {new Date(entry.starttime).toLocaleDateString()}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="New entry name"
              value={editEntryName}
              onChange={(e) => setEditEntryName(e.target.value)}
            />
            <select
              value={editProjectId}
              onChange={(e) => setEditProjectId(e.target.value)}
            >
              <option value="">Keep current project</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <button onClick={updateEntry} className={classes.updateBtn}>
              Update Entry
            </button>
          </div>

          <h2>View Entries</h2>
          <select
            value={selectedView}
            onChange={(e) => handleViewChange(e.target.value)}
            className={classes.viewSelect}
          >
            <option value="recent">Recent Entries</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name} Entries
              </option>
            ))}
          </select>
          
          <div className={classes.entries}>
            {displayEntries.map(entry => (
              <div key={entry.id} className={classes.entry}>
                <div>
                  <strong>{entry.name}</strong>
                  <p>{new Date(entry.starttime).toLocaleString()}</p>
                </div>
                <div className={classes.actions}>
                  <span className={classes.duration}>
                    {entry.duration ? formatDuration(entry.duration) : 'Running...'}
                  </span>
                  <button onClick={() => deleteEntry(entry.id)} className={classes.deleteBtn}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
      </div>
  );
}

export default TimeTrackPage;