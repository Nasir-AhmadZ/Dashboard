import classes from './MainNavigation.module.css'
import Link from 'next/link'
import HamMenu from "../generic/HamMenu"

import { useContext } from 'react'
import GlobalContext from "../../pages/store/globalContext"
import SideBar from "./SideBar"
import { useRouter } from 'next/router'

function MainNavigation() {
  const globalCtx = useContext(GlobalContext)
  const router = useRouter()

  function toggleMenuHide() {
    globalCtx.updateGlobals({ cmd: 'hideHamMenu', newVal: false })
  }

  const contents = [
    {title: 'Home', webAddress: '/'},
    {title: 'Time Entries', webAddress: '/timetrack'},
    {title: 'Projects', webAddress: '/projects'},
    {title: 'Graphs', webAddress: '/graphs'}
  ]
  
  // Add logout option if user is logged in
  if (globalCtx.theGlobalObject.username) {
    contents.push({title: 'Logout', webAddress: '/auth/login'})
  }

  return (
    <header className={classes.header}>
      <SideBar contents={contents} />
      <div className={classes.leftSection}>
        <HamMenu toggleMenuHide={() => toggleMenuHide()} />
        <div className={classes.icon} onClick={() => router.push('/')} style={{cursor: 'pointer'}}>
          <img src="/icon.png" alt="Icon" className={classes.iconImage} />
        </div>
        TTA
      </div>
      <nav>
        <ul>
          <li>
            <Link href='/'>Home</Link>
          </li>
          <li>
            <Link href='/projects'>Projects</Link>
          </li>
        </ul>
      </nav>
      <div className={classes.userSection}>
        {globalCtx.theGlobalObject.username ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className={classes.username}>{globalCtx.theGlobalObject.username}</div>
            <button 
              onClick={globalCtx.logout}
              style={{ 
                background: 'transparent', 
                border: '1px solid rgba(255,255,255,0.3)', 
                color: 'white', 
                padding: '0.25rem 0.5rem', 
                borderRadius: '4px', 
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              Logout
            </button>
          </div>
        ) : (
          <Link href='/auth/login' className={classes.loginLink}>Log In</Link>
        )}
      </div>
    </header>
  );
}

export default MainNavigation
