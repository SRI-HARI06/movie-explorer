import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../utils/api'

function Watchlist() {
    const [movies, setMovies] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        API.get('/watchlist').then(res => {
            setMovies(res.data)
            setLoading(false)
        })
    }, [])

    const removeFromWatchlist = async (imdbId) => {
        try {
            await API.delete(`/watchlist/${imdbId}`)
            setMovies(movies.filter(m => m.imdb_id !== imdbId))
        } catch (err) {
            console.error(err)
        }
    }

    const getDetailPath = (movie) => {
        if (movie.content_type === 'TVSeries') return `/tv/${movie.imdb_id}`
        if (movie.content_type === 'Anime') return `/anime/${movie.imdb_id}`
        return `/movie/${movie.imdb_id}`
    }

    return (
        <div style={{ minHeight: '100vh' }}>
            <div style={{ textAlign: 'center', padding: '50px 20px 30px', background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.1) 0%, transparent 70%)' }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: '800', background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>📋 My Watchlist</h2>
                <p style={{ color: '#666', fontSize: '0.95rem' }}>Movies and shows you want to watch</p>
            </div>

            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#555' }}>Loading...</div>
                ) : movies.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <p style={{ fontSize: '3rem', marginBottom: '15px' }}>📋</p>
                        <h3 style={{ color: 'white', marginBottom: '10px' }}>Your watchlist is empty!</h3>
                        <p style={{ color: '#555', marginBottom: '20px' }}>Add movies to your watchlist from the search page</p>
                        <button onClick={() => navigate('/search')} style={{ padding: '10px 25px', background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', border: 'none', borderRadius: '10px', color: 'white', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}>🔍 Search Movies</button>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                        {movies.map(movie => (
                            <div key={movie.watchlist_id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', overflow: 'hidden' }}>
                                {movie.poster_url && movie.poster_url !== 'N/A' ? (
                                    <img src={movie.poster_url} alt={movie.title} style={{ width: '100%', height: '280px', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '100%', height: '280px', background: 'rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>🎬</div>
                                )}
                                <div style={{ padding: '12px' }}>
                                    <h4 style={{ color: 'white', fontSize: '0.9rem', fontWeight: '600', marginBottom: '5px' }}>{movie.title}</h4>
                                    <p style={{ color: '#666', fontSize: '0.78rem', marginBottom: '5px' }}>📅 {movie.release_year}</p>
                                    <p style={{ color: '#666', fontSize: '0.78rem', marginBottom: '10px' }}>🎭 {movie.genre}</p>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => navigate(getDetailPath(movie))} style={{ flex: 1, padding: '7px', background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', border: 'none', borderRadius: '8px', color: 'white', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>View</button>
                                        <button onClick={() => removeFromWatchlist(movie.imdb_id)} style={{ flex: 1, padding: '7px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', color: '#fca5a5', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Remove</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Watchlist