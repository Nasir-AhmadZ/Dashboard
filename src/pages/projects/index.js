import { useState, useEffect } from 'react';
import classes from '../../styles/projects.module.css';

function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');

  useEffect(() => {
    fetchProjects();
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

  const createProject = async () => {
    if (!projectName || !projectDescription) {
      alert('Fill in both project name and description');
      return;
    }

    try {
      const response = await fetch('http://a2090d8f11ab942f0897c2471569b105-1957319447.eu-west-1.elb.amazonaws.com:8002/projects/', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName,
          description: projectDescription
        })
      });
      
      if (response.ok) {
        setProjectName('');
        setProjectDescription('');
        fetchProjects();
        alert('Project created successfully!');
      } else {
        const result = await response.json();
        alert('Error creating project: ' + result.detail);
      }
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Network error creating project');
    }
  };

  const deleteProject = async (projectId) => {
    if (!confirm('Delete project and all its entries?')) return;

    try {
      const response = await fetch('http://a2090d8f11ab942f0897c2471569b105-1957319447.eu-west-1.elb.amazonaws.com:8002/project/${projectId}', {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchProjects();
      }
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const deleteAllUserProjects = async () => {
    if (!confirm('Delete ALL your projects and entries?')) return;

    try {
      const response = await fetch('http://a2090d8f11ab942f0897c2471569b105-1957319447.eu-west-1.elb.amazonaws.com:8002/user/projects', {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchProjects();
      }
    } catch (error) {
      console.error('Error deleting all projects:', error);
    }
  };

  return (
    <div className={classes.container}>
      <h1>Project Management</h1>
      
        <h2>Create Project</h2>
        <div className={classes.inpt}>
          <input
            type="text"
            placeholder="Project name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Project description"
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
          />
          <button onClick={createProject} className={classes.createBtn}>
            Create Project
          </button>
        </div>

        <h2>Your Projects</h2>
        <div className={classes.projects}>
          {projects.map(project => (
            <div key={project.id} className={classes.project}>
              <div>
                <strong>{project.name}</strong>
                <p>{project.description}</p>
              </div>
              <button onClick={() => deleteProject(project.id)} className={classes.deleteBtn}>
                Delete
              </button>
            </div>
          ))}
        </div>
        <button onClick={deleteAllUserProjects} className={classes.deleteBtn}>
          Delete All My Projects
        </button>
    </div>
  );
}

export default ProjectsPage;