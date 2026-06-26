import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../utils/api'

const genreIcons = {
    'Action': '💥', 'Comedy': '😂', 'Drama': '🎭', 'Horror': '👻',
    'Crime': '🔫', 'Sci-Fi': '🚀', 'Thriller': '🔪', 'Romance': '❤️',
    'Adventure': '🗺️', 'Fantasy': '🧙', 'Mystery': '🔍', 'Biography': '📖'
}

function TVCard({ show, onClick }) {
    const [hovered, setHovered] = useState(false)
    return (
        <div onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
            style={{ minWidth: '160px', maxWidth: '160px', flexShrink: 0, background: 'rgba(255,255,255,0.04)', border: `1px solid ${hovered ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.07)'}`, borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', transform: hovered ? 'translateY(-6px)' : 'translateY(0)', transition: 'all 0.3s', boxShadow: hovered ? '0 15px 30px rgba(124,58,237,0.2)' : 'none' }}>
            {show.poster_path ? (
                <img src={show.poster_path} alt={show.title} style={{ width: '100%', height: '220px', objectFit: 'cover' }} />
            ) : (
                <div style={{ width: '100%', height: '220px', background: 'rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>📺</div>
            )}
            <div style={{ padding: '10px' }}>
                <h4 style={{ color: 'white', fontSize: '0.82rem', fontWeight: '600', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{show.title}</h4>
                <p style={{ color: '#666', fontSize: '0.75rem', marginBottom: '2px' }}>📅 {show.release_year}</p>
                <p style={{ color: '#f59e0b', fontSize: '0.75rem' }}>⭐ {show.vote_average}</p>
                {show.seasons && <p style={{ color: '#666', fontSize: '0.72rem' }}>🎬 {show.seasons} seasons</p>}
            </div>
        </div>
    )
}

function GenreRow({ genre, shows, onShowClick }) {
    return (
        <div style={{ marginBottom: '40px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'white', marginBottom: '15px', borderLeft: '3px solid #7c3aed', paddingLeft: '12px' }}>
                {genreIcons[genre] || '📺'} {genre}
            </h3>
            <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '15px', scrollbarWidth: 'thin', scrollbarColor: '#7c3aed transparent' }}>
                {shows.map((show, i) => (
                    <TVCard key={i} show={show} onClick={() => onShowClick(show.imdb_id)} />
                ))}
            </div>
        </div>
    )
}

function TVSeries() {
    const [showsByGenre, setShowsByGenre] = useState({})
    const [recommendations, setRecommendations] = useState([])
    const [topGenres, setTopGenres] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'))
        Promise.all([
            API.get('/movies/tv-by-genre'),
            user ? API.get(`/recommendations/tv/${user.user_id}`) : Promise.resolve(null)
        ]).then(([genreRes, recRes]) => {
            setShowsByGenre(genreRes.data)
            if (recRes) {
                setRecommendations(recRes.data.recommendations || [])
                setTopGenres(recRes.data.topGenres || [])
            }
            setLoading(false)
        }).catch(() => setLoading(false))
    }, [])

    return (
        <div style={{ minHeight: '100vh' }}>
            <div style={{ textAlign: 'center', padding: '50px 20px 30px', background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.1) 0%, transparent 70%)' }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: '800', background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>📺 TV Series</h2>
                <p style={{ color: '#666', fontSize: '0.95rem' }}>Browse TV series by genre</p>
            </div>
            <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '20px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#555' }}>Loading TV Series...</div>
                ) : (
                    <>
                        {/* Recommendations */}
                        {recommendations.length > 0 && (
                            <div style={{ marginBottom: '20px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '16px', padding: '20px' }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'white', marginBottom: '15px', borderLeft: '3px solid #10b981', paddingLeft: '12px' }}>
                                    🎯 Recommended TV Shows {topGenres.length > 0 ? `— ${topGenres.join(', ')}` : ''}
                                </h3>
                                <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '15px', scrollbarWidth: 'thin', scrollbarColor: '#10b981 transparent' }}>
                                    {recommendations.map((show, i) => (
                                        <TVCard key={i} show={show} onClick={() => navigate(`/tv/${show.imdb_id}`)} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {recommendations.length > 0 && (
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginBottom: '30px' }} />
                        )}

                        {/* All TV by genre */}
                        {Object.keys(showsByGenre).length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px', color: '#555' }}>No TV series found!</div>
                        ) : (
                            Object.entries(showsByGenre).map(([genre, shows]) => (
                                <GenreRow key={genre} genre={genre} shows={shows} onShowClick={(id) => navigate(`/tv/${id}`)} />
                            ))
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

export default TVSeries