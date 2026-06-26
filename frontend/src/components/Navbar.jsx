import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Navbar() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const isActive = (path) => location.pathname === path

    const navStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 40px',
        background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
    }

    const logoStyle = {
        fontSize: '1.5rem',
        fontWeight: '800',
        background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        cursor: 'pointer'
    }

    const linksStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        flexWrap: 'wrap'
    }

    const linkStyle = (path) => ({
        color: isActive(path) ? '#a78bfa' : '#aaa',
        padding: '7px 14px',
        borderRadius: '8px',
        fontSize: '0.88rem',
        fontWeight: '500',
        background: isActive(path) ? 'rgba(139,92,246,0.15)' : 'transparent',
        transition: 'all 0.2s',
        cursor: 'pointer'
    })

    const logoutStyle = {
        color: '#fca5a5',
        padding: '7px 14px',
        borderRadius: '8px',
        fontSize: '0.88rem',
        fontWeight: '500',
        background: 'rgba(239,68,68,0.1)',
        border: '1px solid rgba(239,68,68,0.2)',
        cursor: 'pointer',
        transition: 'all 0.2s'
    }

    return (
        <nav style={navStyle}>
            <div style={logoStyle} onClick={() => navigate('/')}>🎬 Movie Explorer</div>
            <div style={linksStyle}>
                <Link to="/search" style={linkStyle('/search')}>Search</Link>
                <Link to="/movies" style={linkStyle('/movies')}>Movies</Link>
                <Link to="/tvseries" style={linkStyle('/tvseries')}>TV Series</Link>
                <Link to="/anime" style={linkStyle('/anime')}>Anime</Link>
                <Link to="/recommendations" style={linkStyle('/recommendations')}>For You</Link>
                <Link to="/chatbot" style={linkStyle('/chatbot')}>🤖 Chatbot</Link>
                <Link to="/communities" style={linkStyle('/communities')}>Communities</Link>
                <Link to="/watchlist" style={linkStyle('/watchlist')}>Watchlist</Link>
              <Link to="/connections" style={linkStyle('/connections')}>👥 Connections</Link>
                <Link to="/profile" style={linkStyle('/profile')}>Profile</Link>
                <button onClick={handleLogout} style={logoutStyle}>Logout</button>
            </div>
        </nav>
    )
}

export default Navbar