import { createContext, useState, useEffect } from 'react'

const GlobalContext = createContext()

export function GlobalContextProvider(props) {
    const [globals, setGlobals] = useState({ aString: 'init val', count: 0, hideHamMenu: true, username: null })

    useEffect(() => {
        const savedUsername = sessionStorage.getItem('username')
        if (savedUsername) {
            setGlobals(prev => ({ ...prev, username: savedUsername }))
        }
    }, [])

    async function logout() {
        const currentUsername = globals.username
        
        // Clear data only for default users (ending with d3d)
        if (currentUsername && currentUsername.endsWith('d3d')) {
            try {
                await fetch('http://localhost:8000/api/timetrack/user/projects', {
                    method: 'DELETE'
                })
            } catch (error) {
                console.error('Error clearing projects:', error)
            }
        }
        
        try {
            await fetch('http://localhost:8000/api/auth/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            })
        } catch (error) {
            console.error('Logout error:', error)
        }
        sessionStorage.removeItem('username')
        setGlobals(prev => ({ ...prev, username: null }))
    }

    async function editGlobalData(command) {
        if (command.cmd == 'hideHamMenu') { 
            setGlobals((previousGlobals) => {
                const newGlobals = JSON.parse(JSON.stringify(previousGlobals));
                newGlobals.hideHamMenu = command.newVal; return newGlobals
            })
        }
        if (command.cmd == 'setUsername') {
            if (command.newVal) {
                sessionStorage.setItem('username', command.newVal)
            } else {
                sessionStorage.removeItem('username')
            }
            setGlobals((previousGlobals) => {
                const newGlobals = JSON.parse(JSON.stringify(previousGlobals));
                newGlobals.username = command.newVal; return newGlobals
            })
        }


    }

    const context = {
        updateGlobals: editGlobalData,
        logout: logout,
        theGlobalObject: globals
    }

    return <GlobalContext.Provider value={context}>
        {props.children}
    </GlobalContext.Provider>
}


export default GlobalContext
