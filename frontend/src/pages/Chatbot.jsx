import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../utils/api'

function Chatbot() {
    const [message, setMessage] = useState('')
    const [response, setResponse] = useState(null)
    const [movies, setMovies] = useState([])
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!message.trim()) return
        setLoading(true)
        try {
            const res = await API.post('/chatbot', { message })
            setResponse(res.data.response)
            setMovies(res.data.movies || [])
        } catch (err) {
            setResponse('Sorry, something went wrong. Please try again!')
        }
        setLoading(false)
    }

    const quickSearch = (term) => {
        setMessage(term)
        setTimeout(() => document.getElementById('chatForm').requestSubmit(), 100)
    }

    return (
        <div style={{ minHeight: '100vh' }}>
            <div style={{ maxWidth: '900px', margin: '30px auto', padding: '0 20px' }}>
                {/* Header */}
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '30px', marginBottom: '20px', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '700', background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '10px' }}>🤖 Movie Finder Chatbot</h2>
                    <p style={{ color: '#666', fontSize: '0.9rem' }}>Can't remember a movie name? Describe the story and I'll find it!</p>
                </div>

                {/* Hints */}
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '15px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <p style={{ color: '#555', margin: 0, fontSize: '0.85rem' }}>💡 Try:</p>
                    {['a movie where a man goes inside peoples dreams', 'a fish looking for her son', 'toys come to life when humans leave'].map(hint => (
                        <button key={hint} onClick={() => quickSearch(hint)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#aaa', padding: '6px 14px', borderRadius: '20px', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>{hint}</button>
                    ))}
                </div>

                {/* Form */}
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
                    <form id="chatForm" onSubmit={handleSubmit}>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input
                                type="text"
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                placeholder="Describe the movie you're thinking of..."
                                style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px 16px', color: 'white', fontSize: '0.95rem', outline: 'none', fontFamily: 'Inter, sans-serif' }}
                            />
                            <button type="submit" disabled={loading} style={{ padding: '12px 25px', background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', border: 'none', borderRadius: '12px', color: 'white', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer', opacity: loading ? 0.7 : 1, fontFamily: 'Inter, sans-serif' }}>
                                {loading ? '...' : 'Send 🚀'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Response */}
                {response && (
                    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                            <div style={{ width: '45px', height: '45px', background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(59,130,246,0.3))', border: '1px solid rgba(167,139,250,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>🤖</div>
                            <p style={{ color: '#bbb', lineHeight: '1.7', fontSize: '0.95rem', paddingTop: '8px' }}>{response}</p>
                        </div>
                    </div>
                )}

                {/* Movie Results */}
                {movies.length > 0 && (
                    <div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: '700', background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '15px', borderLeft: '3px solid #7c3aed', paddingLeft: '12px' }}>🎬 Here are the movies:</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                           {movies.map(movie => (
    <div key={movie.imdb_id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', overflow: 'hidden' }}>
        {movie.poster_path ? (
            <img src={movie.poster_path} alt={movie.title} style={{ width: '100%', height: '280px', objectFit: 'cover' }} />
        ) : (
            <div style={{ width: '100%', height: '280px', background: 'rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>🎬</div>
        )}
        <div style={{ padding: '12px' }}>
            <h4 style={{ color: 'white', fontSize: '0.9rem', fontWeight: '600', marginBottom: '5px' }}>{movie.title}</h4>
            <p style={{ color: '#666', fontSize: '0.78rem', marginBottom: '3px' }}>📅 {movie.release_year}</p>
            <p style={{ color: '#f59e0b', fontSize: '0.78rem', marginBottom: '10px' }}>⭐ {movie.vote_average}</p>
            <p style={{ color: '#555', fontSize: '0.75rem', marginBottom: '10px' }}>🎯 Match score: {movie.score}</p>
            <button onClick={() => navigate(`/movie/${movie.imdb_id}`)} style={{ width: '100%', padding: '8px', background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', border: 'none', borderRadius: '8px', color: 'white', fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>View Details</button>
        </div>
    </div>
))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Chatbot