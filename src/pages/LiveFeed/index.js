import { useState, useEffect } from 'react';
import classes from '../../styles/projects.module.css';

import { useContext } from 'react';
import GlobalContext from "../store/globalContext"

function ProjectsPage() {
 return (
    <div className={classes.container}>
      <h1>LiveFeed</h1>
    </div>
  );
}

export default ProjectsPage;