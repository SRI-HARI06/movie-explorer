import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../utils/api'

function ContentCard({ item, type, onClick }) {
    const [hovered, setHovered] = useState(false)

    const getPoster = () => {
        if (type === 'movie') return item.Poster !== 'N/A' ? item.Poster : null
        if (type === 'tv') return item.image?.medium || null
        if (type === 'anime') return item.images?.jpg?.image_url || null
    }

    const getTitle = () => {
        if (type === 'movie') return item.Title
        if (type === 'tv') return item.name
        if (type === 'anime') return item.title
    }

    const getYear = () => {
        if (type === 'movie') return item.Year
        if (type === 'tv') return item.premiered?.slice(0, 4) || 'N/A'
        if (type === 'anime') return item.year || 'N/A'
    }

    const poster = getPoster()

    return (
        <div
            onClick={onClick}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${hovered ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: '14px', overflow: 'hidden', cursor: 'pointer',
                transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
                transition: 'all 0.3s',
                boxShadow: hovered ? '0 15px 30px rgba(124,58,237,0.2)' : 'none'
            }}
        >
            {poster ? (
                <img src={poster} alt={getTitle()} style={{ width: '100%', height: '280px', objectFit: 'cover' }} />
            ) : (
                <div style={{ width: '100%', height: '280px', background: 'rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>🎬</div>
            )}
            <div style={{ padding: '12px' }}>
                <h4 style={{ color: 'white', fontSize: '0.88rem', fontWeight: '600', marginBottom: '5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{getTitle()}</h4>
                <p style={{ color: '#666', fontSize: '0.78rem', marginBottom: '5px' }}>📅 {getYear()}</p>
                <span style={{
                    background: type === 'anime' ? 'rgba(124,58,237,0.2)' : type === 'tv' ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${type === 'anime' ? 'rgba(167,139,250,0.3)' : type === 'tv' ? 'rgba(96,165,250,0.3)' : 'rgba(255,255,255,0.1)'}`,
                    color: type === 'anime' ? '#a78bfa' : type === 'tv' ? '#60a5fa' : '#aaa',
                    padding: '2px 10px', borderRadius: '10px', fontSize: '0.72rem'
                }}>
                    {type === 'movie' ? '🎬 Movie' : type === 'tv' ? '📺 Series' : '⛩️ Anime'}
                </span>
            </div>
        </div>
    )
}

function Search() {
    const [query, setQuery] = useState('')
    const [movies, setMovies] = useState([])
    const [tvResults, setTvResults] = useState([])
    const [animeResults, setAnimeResults] = useState([])
    const [newReleases, setNewReleases] = useState([])
    const [activeTab, setActiveTab] = useState('movies')
    const [loading, setLoading] = useState(false)
    const [searched, setSearched] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        API.get('/movies/new-releases').then(res => setNewReleases(res.data))
    }, [])

    const handleSearch = async (e) => {
        e.preventDefault()
        if (!query.trim()) return
        setLoading(true)
        setSearched(true)
        try {
            const [movieRes, tvRes, animeRes] = await Promise.all([
                API.get(`/movies/search?query=${query}`),
                API.get(`/movies/tvsearch?query=${query}`),
                API.get(`/movies/animesearch?query=${query}`)
            ])
            setMovies(movieRes.data.movies || [])
            setTvResults(tvRes.data.shows || [])
            setAnimeResults(animeRes.data.anime || [])
            if (movieRes.data.movies?.length > 0) setActiveTab('movies')
            else if (tvRes.data.shows?.length > 0) setActiveTab('tv')
            else setActiveTab('anime')
        } catch (err) {
            console.error(err)
        }
        setLoading(false)
    }

    const quickSearch = (term) => {
        setQuery(term)
        setTimeout(() => document.getElementById('searchForm').requestSubmit(), 100)
    }

    const tabBtn = (tab, label, count) => (
        <button
            onClick={() => setActiveTab(tab)}
            style={{
                padding: '8px 20px',
                background: activeTab === tab
                    ? 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(59,130,246,0.3))'
                    : 'rgba(255,255,255,0.05)',
                border: `1px solid ${activeTab === tab ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.08)'}`,
                color: activeTab === tab ? 'white' : '#aaa',
                borderRadius: '10px', cursor: 'pointer',
                fontSize: '0.9rem', fontWeight: '500',
                display: 'flex', alignItems: 'center', gap: '8px'
            }}
        >
            {label}
            <span style={{
                background: 'rgba(255,255,255,0.1)',
                padding: '2px 8px', borderRadius: '10px', fontSize: '0.78rem'
            }}>{count}</span>
        </button>
    )

    return (
        <div style={{ minHeight: '100vh' }}>
            {/* Search Hero */}
            <div style={{
                textAlign: 'center', padding: '60px 20px 40px',
                background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.1) 0%, transparent 70%)'
            }}>
                <h2 style={{
                    fontSize: '2.5rem', fontWeight: '800',
                    background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    marginBottom: '10px'
                }}>Find Your Next Favourite</h2>
                <p style={{ color: '#666', fontSize: '0.95rem', marginBottom: '25px' }}>
                    Search across Movies, TV Series and Anime instantly
                </p>

                <form id="searchForm" onSubmit={handleSearch} style={{ maxWidth: '650px', margin: '0 auto' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center',
                        background: 'rgba(255,255,255,0.07)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '16px', padding: '6px 6px 6px 20px', gap: '10px'
                    }}>
                        <span style={{ fontSize: '1.2rem' }}>🔍</span>
                        <input
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Search movies, TV series, anime..."
                            style={{
                                flex: 1, background: 'transparent', border: 'none',
                                color: 'white', fontSize: '1rem', outline: 'none',
                                fontFamily: 'Inter, sans-serif'
                            }}
                        />
                        <button type="submit" style={{
                            padding: '10px 25px',
                            background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                            border: 'none', borderRadius: '12px', color: 'white',
                            fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer'
                        }}>Search</button>
                    </div>
                </form>

                {/* Quick tags */}
                {!searched && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
                        <span style={{ color: '#555', fontSize: '0.85rem' }}>Try:</span>
                        {['Avengers', 'Breaking Bad', 'Naruto', 'Inception', 'Horror'].map(tag => (
                            <button key={tag} onClick={() => quickSearch(tag)} style={{
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: '#aaa', padding: '5px 14px',
                                borderRadius: '20px', fontSize: '0.82rem',
                                cursor: 'pointer', fontFamily: 'Inter, sans-serif'
                            }}>{tag}</button>
                        ))}
                    </div>
                )}
            </div>

            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px 50px' }}>
                {/* Loading */}
                {loading && (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#555' }}>
                        Searching...
                    </div>
                )}

                {/* Search Results */}
                {searched && !loading && (
                    <div>
                        {/* Tabs */}
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '15px' }}>
                            {movies.length > 0 && tabBtn('movies', '🎬 Movies', movies.length)}
                            {tvResults.length > 0 && tabBtn('tv', '📺 TV Series', tvResults.length)}
                            {animeResults.length > 0 && tabBtn('anime', '⛩️ Anime', animeResults.length)}
                        </div>

                        {/* No results */}
                        {movies.length === 0 && tvResults.length === 0 && animeResults.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '80px', color: '#555' }}>
                                <p style={{ fontSize: '3rem', marginBottom: '15px' }}>😕</p>
                                <h3 style={{ color: 'white', marginBottom: '10px' }}>No results found</h3>
                                <p>Try a different search term</p>
                            </div>
                        )}

                        {/* Movie Results */}
                        {activeTab === 'movies' && movies.length > 0 && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                                {movies.map(m => (
                                    <ContentCard key={m.imdbID} item={m} type="movie" onClick={() => navigate(`/movie/${m.imdbID}`)} />
                                ))}
                            </div>
                        )}

                        {/* TV Results */}
                        {activeTab === 'tv' && tvResults.length > 0 && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                                {tvResults.map(s => (
                                    <ContentCard key={s.id} item={s} type="tv" onClick={() => navigate(`/tv/${s.id}`)} />
                                ))}
                            </div>
                        )}

                        {/* Anime Results */}
                        {activeTab === 'anime' && animeResults.length > 0 && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                                {animeResults.map(a => (
                                    <ContentCard key={a.mal_id} item={a} type="anime" onClick={() => navigate(`/anime/${a.mal_id}`)} />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* New Releases */}
                {!searched && newReleases.length > 0 && (
                    <div>
                        <h3 style={{
                            fontSize: '1.3rem', fontWeight: '700',
                            background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            marginBottom: '20px', borderLeft: '3px solid #7c3aed', paddingLeft: '12px'
                        }}>🆕 New Releases</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                            {newReleases.map(m => (
                                <ContentCard key={m.imdbID} item={m} type="movie" onClick={() => navigate(`/movie/${m.imdbID}`)} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Search