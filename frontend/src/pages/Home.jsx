import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../utils/api'

function MovieCard({ movie, onClick }) {
    const [hovered, setHovered] = useState(false)
    return (
        <div
            onClick={() => onClick(movie.imdbID)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${hovered ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: '14px',
                overflow: 'hidden',
                cursor: 'pointer',
                transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
                transition: 'all 0.3s',
                boxShadow: hovered ? '0 15px 30px rgba(124,58,237,0.2)' : 'none',
                minWidth: '160px',
                maxWidth: '160px',
                flexShrink: 0
            }}
        >
            {movie.Poster && movie.Poster !== 'N/A' ? (
                <img src={movie.Poster} alt={movie.Title} style={{ width: '100%', height: '220px', objectFit: 'cover' }} />
            ) : (
                <div style={{ width: '100%', height: '220px', background: 'rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🎬</div>
            )}
            <div style={{ padding: '10px' }}>
                <h4 style={{ color: 'white', fontSize: '0.82rem', fontWeight: '600', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{movie.Title}</h4>
                <p style={{ color: '#666', fontSize: '0.75rem' }}>📅 {movie.Year}</p>
            </div>
        </div>
    )
}

function Home() {
    const [newReleases, setNewReleases] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        API.get('/movies/new-releases').then(res => {
            setNewReleases(res.data)
            setLoading(false)
        })
    }, [])

    return (
        <div style={{ minHeight: '100vh' }}>
            {/* Hero */}
            <div style={{
                textAlign: 'center',
                padding: '80px 20px 50px',
                background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.15) 0%, transparent 70%)'
            }}>
                <h1 style={{
                    fontSize: '3rem', fontWeight: '800',
                    background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    marginBottom: '15px'
                }}>Discover. Review. Discuss.</h1>
                <p style={{ color: '#666', fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto 30px', lineHeight: '1.7' }}>
                    Your ultimate platform to explore movies, share reviews with our unique Medal Rating System
                </p>
                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button onClick={() => navigate('/search')} style={{
                        padding: '14px 35px',
                        background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                        border: 'none', borderRadius: '12px', color: 'white',
                        fontSize: '1rem', fontWeight: '600', cursor: 'pointer'
                    }}>🔍 Search Movies</button>
                    <button onClick={() => navigate('/chatbot')} style={{
                        padding: '14px 35px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px', color: 'white',
                        fontSize: '1rem', fontWeight: '600', cursor: 'pointer'
                    }}>🤖 AI Chatbot</button>
                </div>
            </div>

            {/* Features */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', maxWidth: '1000px', margin: '0 auto', padding: '0 20px 50px' }}>
                {[
                    { icon: '🏅', title: 'Medal Ratings', desc: 'Rate with our unique Medal System — from No Medal to Absolute Cinema!' },
                    { icon: '💬', title: 'Communities', desc: 'Join genre-based communities and discuss your favourite films!' },
                    { icon: '🤖', title: 'AI Chatbot', desc: 'Describe a movie and our AI will identify it for you!' },
                ].map((f, i) => (
                    <div key={i} style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: '16px', padding: '25px', textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>{f.icon}</div>
                        <h3 style={{ color: 'white', fontSize: '1rem', fontWeight: '600', marginBottom: '8px' }}>{f.title}</h3>
                        <p style={{ color: '#555', fontSize: '0.85rem', lineHeight: '1.5' }}>{f.desc}</p>
                    </div>
                ))}
            </div>

            {/* New Releases */}
            <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '0 20px 50px' }}>
                <h2 style={{
                    fontSize: '1.4rem', fontWeight: '700',
                    background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    marginBottom: '20px', borderLeft: '3px solid #7c3aed', paddingLeft: '12px'
                }}>🆕 New Releases</h2>
                {loading ? (
                    <p style={{ color: '#555' }}>Loading...</p>
                ) : (
                    <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '15px' }}>
                        {newReleases.map(movie => (
                            <MovieCard key={movie.imdbID} movie={movie} onClick={(id) => navigate(`/movie/${id}`)} />
                        ))}
                    </div>
                )}
            </div>

            {/* Medal Showcase */}
            <div style={{
                background: 'rgba(255,255,255,0.02)',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                padding: '60px 20px', textAlign: 'center'
            }}>
                <h2 style={{
                    fontSize: '2rem', fontWeight: '700',
                    background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    marginBottom: '10px'
                }}>🏅 Our Unique Medal Rating System</h2>
                <p style={{ color: '#555', marginBottom: '30px', fontSize: '0.9rem' }}>No boring star ratings here!</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' }}>
                    {[
                        { emoji: '🎖️', name: 'Absolute Cinema', desc: 'Extraordinary', bg: 'rgba(124,58,237,0.2)' },
                        { emoji: '🥇', name: 'Gold', desc: 'Super Good', bg: 'rgba(234,179,8,0.15)' },
                        { emoji: '🥈', name: 'Silver', desc: 'Good', bg: 'rgba(148,163,184,0.15)' },
                        { emoji: '🥉', name: 'Bronze', desc: 'Average', bg: 'rgba(180,83,9,0.2)' },
                        { emoji: '🚫', name: 'No Medal', desc: 'Boring/Bad', bg: 'rgba(255,255,255,0.05)' },
                    ].map((m, i) => (
                        <div key={i} style={{
                            background: m.bg,
                            border: '1px solid rgba(255,255,255,0.07)',
                            borderRadius: '16px', padding: '20px 25px',
                            textAlign: 'center', minWidth: '130px'
                        }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>{m.emoji}</div>
                            <h3 style={{ color: 'white', fontSize: '0.9rem', fontWeight: '600', marginBottom: '4px' }}>{m.name}</h3>
                            <p style={{ color: '#555', fontSize: '0.8rem' }}>{m.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Home