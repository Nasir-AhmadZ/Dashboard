import { useContext } from "react";
import { useRouter } from 'next/router';
import GlobalContext from "./store/globalContext"

function HomePage() {
    const globalCtx = useContext(GlobalContext)
    const router = useRouter()

    return (
        <div>
            <div style={{ textAlign: 'center', margin: '2rem 0' }}>
                <img src="/Slogan.jpg" alt="Slogan" style={{ maxWidth: '100%', height: 'auto' }} />
                {!globalCtx.theGlobalObject.username && (
                    <div style={{ marginTop: '2rem' }}>
                        <button 
                            onClick={() => router.push('/auth/login')}
                            style={{ margin: '0 1rem', padding: '0.75rem 2rem', fontSize: '1rem', backgroundColor: 'rgb(245, 173, 66)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            Login
                        </button>
                        <button 
                            onClick={() => router.push('/auth/register')}
                            style={{ margin: '0 1rem', padding: '0.75rem 2rem', fontSize: '1rem', backgroundColor: 'rgb(10, 10, 51)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            Register
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default HomePage;