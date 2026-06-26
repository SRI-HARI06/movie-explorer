import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import API from '../utils/api'
import ShareButton from '../components/ShareButton'

const medalOptions = [
    { value: 'Absolute Cinema', emoji: '🎖️', desc: 'Extraordinary', bg: 'rgba(124,58,237,0.2)' },
    { value: 'Gold', emoji: '🥇', desc: 'Super Good', bg: 'rgba(234,179,8,0.15)' },
    { value: 'Silver', emoji: '🥈', desc: 'Good', bg: 'rgba(148,163,184,0.15)' },
    { value: 'Bronze', emoji: '🥉', desc: 'Average', bg: 'rgba(180,83,9,0.2)' },
    { value: 'No Medal', emoji: '🚫', desc: 'Boring/Bad', bg: 'rgba(255,255,255,0.05)' },
]

function MedalCard({ option, selected, onClick }) {
    return (
        <div onClick={() => onClick(option.value)} style={{
            background: selected ? option.bg : 'rgba(255,255,255,0.03)',
            border: `2px solid ${selected ? '#a78bfa' : 'transparent'}`,
            borderRadius: '12px', padding: '15px 18px',
            textAlign: 'center', cursor: 'pointer',
            transform: selected ? 'scale(1.06)' : 'scale(1)',
            transition: 'all 0.2s', width: '130px',
            boxShadow: selected ? '0 8px 20px rgba(124,58,237,0.3)' : 'none'
        }}>
            <div style={{ fontSize: '2.2rem', marginBottom: '6px' }}>{option.emoji}</div>
            <p style={{ color: 'white', fontSize: '0.85rem', fontWeight: '600', marginBottom: '3px' }}>{option.value}</p>
            <p style={{ color: '#666', fontSize: '0.72rem' }}>{option.desc}</p>
        </div>
    )
}

function ReviewSection({ contentId, contentType, contentTitle, contentPoster }) {
    const { user } = useAuth()
    const [reviews, setReviews] = useState([])
    const [medalCounts, setMedalCounts] = useState({})
    const [topMedal, setTopMedal] = useState(null)
    const [selectedMedal, setSelectedMedal] = useState('')
    const [reviewText, setReviewText] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchReviews()
    }, [contentId])

    const fetchReviews = async () => {
        try {
            const res = await API.get(`/reviews/${contentId}/${contentType}`)
            setReviews(res.data.reviews)
            setMedalCounts(res.data.medalCounts)
            setTopMedal(res.data.topMedal)
        } catch (err) {
            console.error(err)
        }
        setLoading(false)
    }

    const handleSubmit = async () => {
        if (!selectedMedal || !reviewText.trim()) return
        setSubmitting(true)
        try {
            await API.post('/reviews', {
                content_id: contentId,
                content_type: contentType,
                content_title: contentTitle,
                content_poster: contentPoster,
                medal: selectedMedal,
                review_text: reviewText
            })
            setShowForm(false)
            setSelectedMedal('')
            setReviewText('')
            fetchReviews()
        } catch (err) {
            console.error(err)
        }
        setSubmitting(false)
    }

    const handleLike = async (reviewId) => {
        try {
            const res = await API.post(`/reviews/${reviewId}/like`)
            setReviews(reviews.map(r =>
                r.review_id === reviewId
                    ? { ...r, like_count: res.data.count, user_liked: res.data.liked }
                    : r
            ))
        } catch (err) {
            console.error(err)
        }
    }

    const medalEmoji = { 'Absolute Cinema': '🎖️', 'Gold': '🥇', 'Silver': '🥈', 'Bronze': '🥉', 'No Medal': '🚫' }

    return (
        <div>
            {/* Community Verdict */}
            <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '14px', padding: '20px', marginBottom: '20px'
            }}>
                <h3 style={{
                    background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    fontSize: '1.1rem', fontWeight: '600', marginBottom: '15px'
                }}>🏅 Community Verdict</h3>
                {medalOptions.map(m => (
                    <div key={m.value} style={{
                        display: 'flex', alignItems: 'center', gap: '15px',
                        padding: '10px 15px', borderRadius: '10px', marginBottom: '8px',
                        background: topMedal === m.value
                            ? 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(59,130,246,0.3))'
                            : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${topMedal === m.value ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.06)'}`,
                        transform: topMedal === m.value ? 'scale(1.02)' : 'scale(1)',
                        transition: 'all 0.2s'
                    }}>
                        <span style={{ fontSize: '1.3rem' }}>{m.emoji}</span>
                        <p style={{ flex: 1, color: 'white', fontSize: '0.9rem', fontWeight: '500' }}>{m.value}</p>
                        <span style={{ color: '#666', fontSize: '0.82rem' }}>{medalCounts[m.value] || 0} votes</span>
                    </div>
                ))}
            </div>

            {/* Review Form Button */}
            <button onClick={() => setShowForm(!showForm)} style={{
                padding: '10px 25px',
                background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                border: 'none', borderRadius: '10px', color: 'white',
                fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer',
                marginBottom: '20px'
            }}>
                {showForm ? '✕ Cancel' : '✍️ Write a Review'}
            </button>

            {/* Review Form */}
            {showForm && (
                <div style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '14px', padding: '20px', marginBottom: '20px'
                }}>
                    <p style={{ color: '#bbb', fontSize: '0.95rem', marginBottom: '15px', fontWeight: '500' }}>🏅 Give your Medal:</p>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
                        {medalOptions.map(m => (
                            <MedalCard key={m.value} option={m} selected={selectedMedal === m.value} onClick={setSelectedMedal} />
                        ))}
                    </div>
                    <textarea
                        value={reviewText}
                        onChange={e => setReviewText(e.target.value)}
                        placeholder="Write your review here..."
                        rows={4}
                        style={{
                            width: '100%', background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px', padding: '12px 16px',
                            color: 'white', fontSize: '0.95rem', resize: 'vertical',
                            fontFamily: 'Inter, sans-serif', marginBottom: '12px',
                            boxSizing: 'border-box', outline: 'none'
                        }}
                    />
                    <button onClick={handleSubmit} disabled={submitting || !selectedMedal || !reviewText.trim()} style={{
                        padding: '10px 25px',
                        background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                        border: 'none', borderRadius: '10px', color: 'white',
                        fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer',
                        opacity: submitting || !selectedMedal || !reviewText.trim() ? 0.6 : 1
                    }}>
                        {submitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                </div>
            )}

            {/* Reviews List */}
            <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '14px', padding: '20px'
            }}>
                <h3 style={{
                    background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    fontSize: '1.1rem', fontWeight: '600', marginBottom: '15px'
                }}>💬 User Reviews</h3>
                {loading ? (
                    <p style={{ color: '#555' }}>Loading reviews...</p>
                ) : reviews.length === 0 ? (
                    <p style={{ color: '#555', textAlign: 'center', padding: '30px' }}>No reviews yet. Be the first! ✍️</p>
                ) : (
                    reviews.map(review => (
                        <div key={review.review_id} style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.07)',
                            borderRadius: '12px', padding: '15px', marginBottom: '12px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                                <div style={{
                                    width: '32px', height: '32px',
                                    background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                                    borderRadius: '50%', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '0.85rem'
                                }}>{review.username[0].toUpperCase()}</div>
                                <span style={{ color: 'white', fontWeight: '600', fontSize: '0.9rem' }}>{review.username}</span>
                                <span style={{
                                    background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                                    padding: '3px 12px', borderRadius: '20px',
                                    color: 'white', fontSize: '0.78rem'
                                }}>{medalEmoji[review.medal]} {review.medal}</span>
                                <span style={{ color: '#555', fontSize: '0.78rem', marginLeft: 'auto' }}>
                                    {new Date(review.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                            </div>
                            <p style={{ color: '#ccc', lineHeight: '1.6', fontSize: '0.9rem', marginBottom: '10px' }}>{review.review_text}</p>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
    <button onClick={() => handleLike(review.review_id)} style={{
        background: review.user_liked
            ? 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(59,130,246,0.3))'
            : 'rgba(255,255,255,0.06)',
        border: `1px solid ${review.user_liked ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.1)'}`,
        color: review.user_liked ? '#c4b5fd' : '#888',
        padding: '5px 15px', borderRadius: '20px',
        cursor: 'pointer', fontSize: '0.82rem',
        fontFamily: 'Inter, sans-serif'
    }}>
        ❤️ {review.like_count} {review.user_liked ? 'Liked' : 'Like'}
    </button>
    <ShareButton
        title={`${review.username}'s Review`}
        text={`${medalEmoji[review.medal]} ${review.username} gave ${review.medal} to ${contentTitle}!\n\n"${review.review_text}"\n\nCheck it out on Movie Explorer!`}
        url={window.location.href}
    />
</div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

function MovieDetail() {
    const { imdbId } = useParams()
    const navigate = useNavigate()
    const [movie, setMovie] = useState(null)
    const [loading, setLoading] = useState(true)
    const [addingWatchlist, setAddingWatchlist] = useState(false)
    const [watchlistMsg, setWatchlistMsg] = useState('')

    useEffect(() => {
        API.get(`/movies/detail/${imdbId}`).then(res => {
            setMovie(res.data)
            setLoading(false)
        })
    }, [imdbId])

    const addToWatchlist = async () => {
        setAddingWatchlist(true)
        try {
            await API.post('/watchlist', {
                imdb_id: movie.imdbID,
                title: movie.Title,
                poster_url: movie.Poster,
                genre: movie.Genre,
                release_year: movie.Year,
                content_type: 'Movie'
            })
            setWatchlistMsg('Added to watchlist! ✅')
            setTimeout(() => setWatchlistMsg(''), 3000)
        } catch (err) {
            setWatchlistMsg('Already in watchlist!')
            setTimeout(() => setWatchlistMsg(''), 3000)
        }
        setAddingWatchlist(false)
    }

    if (loading) return <div style={{ textAlign: 'center', padding: '100px', color: '#555' }}>Loading...</div>
    if (!movie) return <div style={{ textAlign: 'center', padding: '100px', color: '#555' }}>Movie not found!</div>

    return (
        <div style={{ maxWidth: '1100px', margin: '30px auto', padding: '0 20px' }}>
            <button onClick={() => navigate(-1)} style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#aaa', padding: '8px 18px',
                borderRadius: '8px', cursor: 'pointer',
                fontSize: '0.88rem', marginBottom: '20px',
                fontFamily: 'Inter, sans-serif'
            }}>⬅ Back</button>

            <div style={{
                display: 'flex', gap: '40px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '20px', padding: '35px',
                marginBottom: '30px'
            }}>
                {/* Poster */}
                <div style={{ flexShrink: 0 }}>
                    {movie.Poster && movie.Poster !== 'N/A' ? (
                        <img src={movie.Poster} alt={movie.Title} style={{ width: '220px', borderRadius: '14px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }} />
                    ) : (
                        <div style={{ width: '220px', height: '320px', background: 'rgba(124,58,237,0.2)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>🎬</div>
                    )}
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                    <h1 style={{
                        fontSize: '2rem', fontWeight: '700',
                        background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        marginBottom: '15px'
                    }}>{movie.Title}</h1>
                    <p style={{ color: '#999', marginBottom: '8px', fontSize: '0.95rem' }}>📅 Year: {movie.Year}</p>
                    <p style={{ color: '#999', marginBottom: '8px', fontSize: '0.95rem' }}>🎭 Genre: {movie.Genre}</p>
                    <p style={{ color: '#999', marginBottom: '8px', fontSize: '0.95rem' }}>🎬 Director: {movie.Director}</p>
                    <p style={{ color: '#999', marginBottom: '8px', fontSize: '0.95rem' }}>⏱ Runtime: {movie.Runtime}</p>
                    <p style={{ color: '#999', marginBottom: '8px', fontSize: '0.95rem' }}>🌍 Language: {movie.Language}</p>
                    <p style={{ color: '#bbb', lineHeight: '1.7', marginBottom: '15px', fontSize: '0.95rem' }}>{movie.Plot}</p>
                    <p style={{ color: '#999', marginBottom: '20px', fontSize: '0.9rem' }}>🎥 Cast: {movie.Actors}</p>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
    <button onClick={addToWatchlist} disabled={addingWatchlist} style={{
        padding: '10px 20px',
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.12)',
        color: 'white', borderRadius: '10px',
        cursor: 'pointer', fontSize: '0.9rem',
        fontFamily: 'Inter, sans-serif', fontWeight: '500'
    }}>➕ Add to Watchlist</button>
    <ShareButton
        title={`${movie.Title} (${movie.Year})`}
        text={`🎬 Check out ${movie.Title}!\n⭐ ${movie.imdbRating}/10\n🎭 ${movie.Genre}\n\n${movie.Plot}`}
        url={window.location.href}
    />
    {watchlistMsg && <span style={{ color: '#86efac', fontSize: '0.88rem' }}>{watchlistMsg}</span>}
</div>
                </div>
            </div>

            {/* Reviews */}
           <ReviewSection
    contentId={imdbId}
    contentType="movie"
    contentTitle={movie.Title}
    contentPoster={movie.Poster}
/>
        </div>
    )
}

export default MovieDetail