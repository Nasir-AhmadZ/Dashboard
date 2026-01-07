import classes from './SideBar.module.css'
import { useRouter } from 'next/router'
import { useContext, useState } from 'react'
import GlobalContext from "../../pages/store/globalContext"

export default function SideBar(props) {
    const globalCtx = useContext(GlobalContext)
    const router = useRouter()
    let [popupToggle, setPopupToggle] = useState(false)

    if (globalCtx.theGlobalObject.hideHamMenu) {
        return null
    }

    async function clicked(webAddress) {
        globalCtx.updateGlobals({ cmd: 'hideHamMenu', newVal: true })
        
        if (webAddress === '/auth/login' && globalCtx.theGlobalObject.username) {
            await globalCtx.logout()
        }
        
        router.push(webAddress)
    }

    function closeMe() {
        globalCtx.updateGlobals({ cmd: 'hideHamMenu', newVal: true })
        if (popupToggle == true) {
            setPopupToggle(false)
        } else {
            setPopupToggle(true)
        }
    }

    let contentJsx = props.contents.map((item, index) => (  
        <div className={classes.menuItem} key={index} onClick={() => clicked(item.webAddress)} >{item.title} </div>
    ))

    return (
        <div className={classes.background} onClick={() => closeMe()} >
            <div className={classes.mainContent} >
                {contentJsx}
            </div>
        </div>
    );
}
