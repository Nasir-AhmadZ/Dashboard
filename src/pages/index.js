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
                    </div>
                )}
            </div>
        </div>
    )
}

export default HomePage;