import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../utils/api'

const awardIcons = {
    'Academy Awards': '🎭',
    'Golden Globe Awards': '🌟',
    'BAFTA Awards': '🎬',
    'Cannes Film Festival': '🌴'
}

const awardColors = {
    'Academy Awards': 'rgba(234,179,8,0.15)',
    'Golden Globe Awards': 'rgba(251,191,36,0.15)',
    'BAFTA Awards': 'rgba(124,58,237,0.15)',
    'Cannes Film Festival': 'rgba(34,197,94,0.15)'
}

function Awards() {
    const [movies, setMovies] = useState([])
    const [filtered, setFiltered] = useState([])
    const [activeFilter, setActiveFilter] = useState('all')
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        API.get('/awards').then(res => {
            setMovies(res.data)
            setFiltered(res.data)
            setLoading(false)
        })
    }, [])

    const filterAward = (award) => {
        setActiveFilter(award)
        if (award === 'all') setFiltered(movies)
        else setFiltered(movies.filter(m => m.awards.some(a => a.award_name === award)))
    }

    const filters = [
        { key: 'all', label: '🏆 All' },
        { key: 'Academy Awards', label: '🎭 Oscars' },
        { key: 'Golden Globe Awards', label: '🌟 Golden Globes' },
        { key: 'BAFTA Awards', label: '🎬 BAFTA' },
        { key: 'Cannes Film Festival', label: '🌴 Cannes' },
    ]

    return (
        <div style={{ minHeight: '100vh' }}>
            {/* Hero */}
            <div style={{ background: 'linear-gradient(135deg, rgba(234,179,8,0.1), rgba(124,58,237,0.1), rgba(59,130,246,0.1))', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '60px 20px', textAlign: 'center' }}>
                <h2 style={{ fontSize: '2.8rem', fontWeight: '800', background: 'linear-gradient(135deg, #fbbf24, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '10px' }}>🏆 Award Winning Films</h2>
                <p style={{ color: '#666', fontSize: '0.95rem', maxWidth: '500px', margin: '0 auto 35px' }}>Celebrating the greatest films from the world's most prestigious award ceremonies</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' }}>
                    {[
                        { icon: '🎭', name: 'Academy Awards', sub: 'Oscar Winners' },
                        { icon: '🌟', name: 'Golden Globes', sub: "Hollywood's Best" },
                        { icon: '🎬', name: 'BAFTA', sub: 'British Excellence' },
                        { icon: '🌴', name: 'Cannes', sub: "Palme d'Or" },
                    ].map((a, i) => (
                        <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px 25px', textAlign: 'center', minWidth: '130px' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{a.icon}</div>
                            <h3 style={{ color: 'white', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>{a.name}</h3>
                            <p style={{ color: '#555', fontSize: '0.75rem' }}>{a.sub}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ maxWidth: '1200px', margin: '30px auto', padding: '0 20px' }}>
                {/* Filters */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', flexWrap: 'wrap' }}>
                    {filters.map(f => (
                        <button key={f.key} onClick={() => filterAward(f.key)} style={{
                            padding: '8px 18px',
                            background: activeFilter === f.key ? 'linear-gradient(135deg, #7c3aed, #3b82f6)' : 'rgba(255,255,255,0.06)',
                            border: activeFilter === f.key ? 'none' : '1px solid rgba(255,255,255,0.1)',
                            color: activeFilter === f.key ? 'white' : '#aaa',
                            borderRadius: '20px', cursor: 'pointer', fontSize: '0.85rem',
                            fontWeight: '500', fontFamily: 'Inter, sans-serif'
                        }}>{f.label}</button>
                    ))}
                </div>

                <p style={{ color: '#555', fontSize: '0.85rem', marginBottom: '20px' }}>Showing {filtered.length} films</p>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#555' }}>Loading award winning films...</div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#555' }}>
                        <p style={{ fontSize: '3rem' }}>🏆</p>
                        <p>No films found!</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '20px' }}>
                        {filtered.map(movie => (
                            <AwardCard key={movie.imdb_id} movie={movie} onClick={() => navigate(`/movie/${movie.imdb_id}`)} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function AwardCard({ movie, onClick }) {
    const [hovered, setHovered] = useState(false)
    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${hovered ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: '16px', overflow: 'hidden', transition: 'all 0.3s',
                transform: hovered ? 'translateY(-8px)' : 'translateY(0)',
                boxShadow: hovered ? '0 20px 40px rgba(234,179,8,0.1)' : 'none'
            }}
        >
            <div style={{ position: 'relative', overflow: 'hidden' }}>
                {movie.poster_url && movie.poster_url !== 'N/A' ? (
                    <img src={movie.poster_url} alt={movie.title} style={{ width: '100%', height: '260px', objectFit: 'cover', transition: 'transform 0.3s', transform: hovered ? 'scale(1.05)' : 'scale(1)' }} />
                ) : (
                    <div style={{ width: '100%', height: '260px', background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(59,130,246,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>🎬</div>
                )}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: hovered ? 1 : 0, transition: 'opacity 0.3s' }}>
                    <button onClick={onClick} style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', border: 'none', borderRadius: '10px', color: 'white', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>View Details</button>
                </div>
            </div>
            <div style={{ padding: '15px' }}>
                <h3 style={{ color: 'white', fontSize: '0.88rem', fontWeight: '600', marginBottom: '5px', lineHeight: '1.3' }}>{movie.title}</h3>
                <p style={{ color: '#666', fontSize: '0.75rem', marginBottom: '8px' }}>📅 {movie.release_year}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {movie.awards.map((award, i) => (
                        <div key={i} style={{ background: awardColors[award.award_name] || 'rgba(255,255,255,0.05)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '8px', padding: '4px 8px', fontSize: '0.72rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#fbbf24' }}>{awardIcons[award.award_name] || '🏆'} {award.award_name}</span>
                            <span style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 6px', borderRadius: '8px', color: '#aaa', fontSize: '0.68rem' }}>{award.year_won}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Awards