import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../utils/api'

function Recommendations() {
    const [movies, setMovies] = useState([])
    const [topGenres, setTopGenres] = useState([])
    const [basedOn, setBasedOn] = useState(null)
    const [collab, setCollab] = useState([])
    const [similarUser, setSimilarUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const navigate = useNavigate()
    const [knn, setKnn] = useState([])
const [neighbours, setNeighbours] = useState([])

    useEffect(() => {
        fetchRecommendations()
    }, [])

    const fetchRecommendations = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user'))
            if (!user || !user.user_id) {
                setError('Please login to get recommendations!')
                setLoading(false)
                return
            }

            // Fetch both recommendation types in parallel
          const [genreRes, collabRes, knnRes] = await Promise.all([
    API.get(`/recommendations/${user.user_id}`),
    API.get(`/collaborative/${user.user_id}`),
    API.get(`/knn/${user.user_id}`)
])

setMovies(genreRes.data.recommendations || [])
setTopGenres(genreRes.data.topGenres || [])
setBasedOn(genreRes.data.basedOn)
setCollab(collabRes.data.recommendations || [])
setSimilarUser(collabRes.data.similarUser || null)
setKnn(knnRes.data.recommendations || [])
setNeighbours(knnRes.data.neighbours || [])
        } catch (err) {
            setError('Something went wrong!')
        }
        setLoading(false)
    }

    const MovieCard = ({ movie, idKey = 'imdb_id' }) => (
        <div
            onClick={() => navigate(`/movie/${movie[idKey]}`)}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.3s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.borderColor = 'rgba(167,139,250,0.4)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}
        >
            {movie.poster_path ? (
                <img src={movie.poster_path} alt={movie.title} style={{ width: '100%', height: '280px', objectFit: 'cover' }} />
            ) : (
                <div style={{ width: '100%', height: '280px', background: 'rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>🎬</div>
            )}
            <div style={{ padding: '12px' }}>
                <h4 style={{ color: 'white', fontSize: '0.9rem', fontWeight: '600', marginBottom: '5px' }}>{movie.title}</h4>
                <p style={{ color: '#666', fontSize: '0.78rem', marginBottom: '3px' }}>📅 {movie.release_year}</p>
                <p style={{ color: '#666', fontSize: '0.78rem', marginBottom: '3px' }}>🎭 {movie.genre}</p>
                <p style={{ color: '#f59e0b', fontSize: '0.78rem' }}>⭐ {movie.vote_average}</p>
            </div>
        </div>
    )

    const SectionHeader = ({ emoji, title, subtitle }) => (
        <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: '700', color: 'white', marginBottom: '6px' }}>
                {emoji} {title}
            </h3>
            {subtitle && <p style={{ color: '#666', fontSize: '0.85rem' }}>{subtitle}</p>}
        </div>
    )

    return (
        <div style={{ minHeight: '100vh' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', padding: '50px 20px 30px', background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.1) 0%, transparent 70%)' }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: '800', background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>
                    🎯 Recommended For You
                </h2>
                {basedOn === 'user_behaviour' && topGenres.length > 0 && (
                    <p style={{ color: '#888', fontSize: '0.95rem' }}>
                        Based on your taste — you love{' '}
                        {topGenres.map((g, i) => (
                            <strong key={g} style={{ color: '#a78bfa' }}>
                                {g}{i < topGenres.length - 1 ? ', ' : ''}
                            </strong>
                        ))} movies!
                    </p>
                )}
                {basedOn === 'popular' && (
                    <p style={{ color: '#888', fontSize: '0.95rem' }}>
                        Showing top rated movies — review or add to watchlist to get personalised picks!
                    </p>
                )}
            </div>

            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#555' }}>
                        🎬 Finding recommendations...
                    </div>
                ) : error ? (
                    <div style={{ textAlign: 'center', padding: '80px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <p style={{ fontSize: '3rem', marginBottom: '15px' }}>🎯</p>
                        <p style={{ color: '#555', marginBottom: '20px' }}>{error}</p>
                        <button onClick={() => navigate('/watchlist')}
                            style={{ padding: '10px 25px', background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', border: 'none', borderRadius: '10px', color: 'white', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}>
                            📋 Go to Watchlist
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Section 1 - Genre Based */}
                        {movies.length > 0 && (
                            <div style={{ marginBottom: '50px' }}>
                                <SectionHeader
                                    emoji="🎭"
                                    title="Based on Your Taste"
                                    subtitle={topGenres.length > 0 ? `Your top genres: ${topGenres.join(', ')}` : 'Top rated movies for you'}
                                />
                                {topGenres.length > 0 && (
                                    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                                        {topGenres.map(g => (
                                            <span key={g} style={{ padding: '4px 14px', background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: '20px', color: '#a78bfa', fontSize: '0.82rem', fontWeight: '600' }}>
                                                {g}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                                    {movies.map(movie => <MovieCard key={movie.imdb_id} movie={movie} />)}
                                </div>
                            </div>
                        )}

                        {/* Divider */}
                        {movies.length > 0 && collab.length > 0 && (
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginBottom: '50px' }} />
                        )}
                        

                        {/* Section 2 - Collaborative Filtering */}
                        {collab.length > 0 && (
                            <div style={{ marginBottom: '50px' }}>
                                <SectionHeader
                                    emoji="👥"
                                    title="Users Like You Also Watched"
                                    subtitle={similarUser ? `Based on what ${similarUser} and similar users loved` : 'Based on similar users taste'}
                                />
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                                    {collab.map(movie => <MovieCard key={movie.imdb_id} movie={movie} />)}
                                </div>
                            </div>
                        )}
                        {/* Divider */}
{collab.length > 0 && knn.length > 0 && (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginBottom: '50px' }} />
)}

{/* Section 3 - KNN */}
{knn.length > 0 && (
    <div style={{ marginBottom: '50px' }}>
        <SectionHeader
            emoji="🤖"
            title="KNN Picks For You"
            subtitle={`K-Nearest Neighbours algorithm found ${neighbours.length} users like you`}
        />

        {/* Neighbours similarity badges */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {neighbours.map(n => (
                <div key={n.user_id} style={{ padding: '6px 14px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ color: '#10b981', fontSize: '0.82rem', fontWeight: '600' }}>👤 {n.username}</span>
                    <span style={{ color: '#666', fontSize: '0.75rem' }}>similarity: {n.similarity}</span>
                </div>
            ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
            {knn.map(movie => <MovieCard key={movie.imdb_id} movie={movie} />)}
        </div>
    </div>
)}

                        {/* Empty state */}
                        {movies.length === 0 && collab.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '80px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.07)' }}>
                                <p style={{ fontSize: '3rem', marginBottom: '15px' }}>🎯</p>
                                <p style={{ color: '#555', marginBottom: '20px' }}>Review or add movies to your watchlist to get recommendations!</p>
                                <button onClick={() => navigate('/movies')}
                                    style={{ padding: '10px 25px', background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', border: 'none', borderRadius: '10px', color: 'white', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}>
                                    🎬 Browse Movies
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

export default Recommendations