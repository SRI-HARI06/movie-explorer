import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import API from '../utils/api'
import { Pie, Bar } from 'react-chartjs-2'
import {
    Chart as ChartJS, ArcElement, Tooltip, Legend,
    CategoryScale, LinearScale, BarElement, Title
} from 'chart.js'
import ShareButton from '../components/ShareButton'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title)

const medalEmoji = { 'Absolute Cinema': '🎖️', 'Gold': '🥇', 'Silver': '🥈', 'Bronze': '🥉', 'No Medal': '🚫' }
const medalColors = {
    'Absolute Cinema': 'rgba(251,191,36,0.8)',
    'Gold': 'rgba(234,179,8,0.8)',
    'Silver': 'rgba(148,163,184,0.8)',
    'Bronze': 'rgba(180,83,9,0.8)',
    'No Medal': 'rgba(100,100,100,0.8)'
}
const genreColors = [
    'rgba(124,58,237,0.8)', 'rgba(59,130,246,0.8)', 'rgba(16,185,129,0.8)',
    'rgba(245,158,11,0.8)', 'rgba(239,68,68,0.8)', 'rgba(236,72,153,0.8)',
    'rgba(14,165,233,0.8)', 'rgba(168,85,247,0.8)'
]

function Profile() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const fileRef = useRef()
    const [reviews, setReviews] = useState([])
    const [watchlist, setWatchlist] = useState([])
    const [medalStats, setMedalStats] = useState({})
    const [genreStats, setGenreStats] = useState({ movie: {}, tv: {}, anime: {} })
    const [monthlyStats, setMonthlyStats] = useState({})
    const [activeTab, setActiveTab] = useState('all')
    const [loading, setLoading] = useState(true)
    const [profilePic, setProfilePic] = useState(localStorage.getItem('profilePic') || null)
    const [genreFilter, setGenreFilter] = useState('all')

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [reviewRes, watchlistRes, genreRes] = await Promise.all([
                    API.get('/reviews/user/all'),
                    API.get('/watchlist'),
                    API.get('/reviews/genre-stats')
                ])

                const r = reviewRes.data
                const w = watchlistRes.data
                const genreData = genreRes.data

                setReviews(r)
                setWatchlist(w)

                // Medal stats
                const medals = {}
                r.forEach(rev => {
                    medals[rev.medal] = (medals[rev.medal] || 0) + 1
                })
                setMedalStats(medals)

                // Genre stats from backend
                const genres = { movie: {}, tv: {}, anime: {} }
                Object.entries(genreData).forEach(([type, genreList]) => {
                    genreList.forEach(genreStr => {
                        if (!genreStr) return
                        genreStr.split(',').forEach(g => {
                            const genre = g.trim()
                            genres[type][genre] = (genres[type][genre] || 0) + 1
                        })
                    })
                })

                // Add watchlist genres to movie
                w.forEach(item => {
                    if (item.genre) {
                        item.genre.split(',').forEach(g => {
                            const genre = g.trim()
                            genres.movie[genre] = (genres.movie[genre] || 0) + 1
                        })
                    }
                })
                setGenreStats(genres)

                // Monthly stats
                const monthly = {}
                r.forEach(rev => {
                    const month = new Date(rev.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
                    monthly[month] = (monthly[month] || 0) + 1
                })
                setMonthlyStats(monthly)

            } catch (err) {
                console.error('Profile load error:', err)
            }
            setLoading(false)
        }
        fetchData()
    }, [])

    const handleProfilePic = (e) => {
        const file = e.target.files[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = () => {
            setProfilePic(reader.result)
            localStorage.setItem('profilePic', reader.result)
        }
        reader.readAsDataURL(file)
    }

    const filteredReviews = activeTab === 'all'
        ? reviews
        : reviews.filter(r => r.content_type.toLowerCase() === activeTab.toLowerCase())

    const topMedal = Object.entries(medalStats).sort((a, b) => b[1] - a[1])[0]?.[0]

    // Get genre data based on filter
    const getFilteredGenres = () => {
        if (genreFilter === 'movie') return genreStats.movie || {}
        if (genreFilter === 'tv') return genreStats.tv || {}
        if (genreFilter === 'anime') return genreStats.anime || {}
        // All — merge everything
        const merged = {}
        Object.values(genreStats).forEach(typeGenres => {
            Object.entries(typeGenres).forEach(([genre, count]) => {
                merged[genre] = (merged[genre] || 0) + count
            })
        })
        return merged
    }

    const filteredGenres = getFilteredGenres()

    const filteredGenreChartData = {
        labels: Object.keys(filteredGenres).slice(0, 8),
        datasets: [{
            label: 'Count',
            data: Object.values(filteredGenres).slice(0, 8),
            backgroundColor: genreColors,
            borderColor: genreColors.map(c => c.replace('0.8', '1')),
            borderWidth: 2,
            borderRadius: 8
        }]
    }

    const medalChartData = {
        labels: Object.keys(medalStats).map(m => `${medalEmoji[m]} ${m}`),
        datasets: [{
            data: Object.values(medalStats),
            backgroundColor: Object.keys(medalStats).map(m => medalColors[m] || 'rgba(124,58,237,0.8)'),
            borderColor: Object.keys(medalStats).map(m => (medalColors[m] || 'rgba(124,58,237,0.8)').replace('0.8', '1')),
            borderWidth: 2
        }]
    }

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { labels: { color: '#aaa', font: { family: 'Inter' } } }
        },
        scales: {
            x: { ticks: { color: '#666' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { ticks: { color: '#666' }, grid: { color: 'rgba(255,255,255,0.05)' } }
        }
    }

    const pieOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'bottom', labels: { color: '#aaa', font: { family: 'Inter' }, padding: 15 } }
        }
    }

    const getDetailPath = (review) => {
        if (review.content_type === 'TVSeries') return `/tv/${review.content_id}`
        if (review.content_type === 'Anime') return `/anime/${review.content_id}`
        return `/movie/${review.content_id}`
    }

    const movieCount = reviews.filter(r => r.content_type.toLowerCase() === 'movie').length
    const tvCount = reviews.filter(r => r.content_type.toLowerCase() === 'tvseries').length
    const animeCount = reviews.filter(r => r.content_type.toLowerCase() === 'anime').length

    // Top genre across all
    const allGenresMerged = Object.values(genreStats).reduce((acc, typeGenres) => {
        Object.entries(typeGenres).forEach(([g, c]) => { acc[g] = (acc[g] || 0) + c })
        return acc
    }, {})
    const topGenre = Object.entries(allGenresMerged).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'

    return (
        <div style={{ maxWidth: '900px', margin: '30px auto', padding: '0 20px' }}>

            {/* Profile Header */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '30px', display: 'flex', alignItems: 'center', gap: '25px', marginBottom: '20px' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div onClick={() => fileRef.current.click()}
                        style={{ width: '85px', height: '85px', borderRadius: '50%', overflow: 'hidden', cursor: 'pointer', border: '3px solid rgba(167,139,250,0.4)', position: 'relative' }}>
                        {profilePic ? (
                            <img src={profilePic} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem', fontWeight: '700', color: 'white' }}>
                                {user?.username[0].toUpperCase()}
                            </div>
                        )}
                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', textAlign: 'center', fontSize: '0.7rem', color: 'white', padding: '3px' }}>📷</div>
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleProfilePic} style={{ display: 'none' }} />
                </div>

                <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '700', color: 'white', marginBottom: '5px' }}>{user?.username}</h2>
                    <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '10px' }}>📧 {user?.email}</p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)', padding: '3px 12px', borderRadius: '20px', color: '#a78bfa', fontSize: '0.78rem' }}>🎬 {movieCount} Movies</span>
                        <span style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)', padding: '3px 12px', borderRadius: '20px', color: '#60a5fa', fontSize: '0.78rem' }}>📺 {tvCount} TV Series</span>
                        <span style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.3)', padding: '3px 12px', borderRadius: '20px', color: '#34d399', fontSize: '0.78rem' }}>⛩️ {animeCount} Anime</span>
                    </div>
                </div>

               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    <button onClick={() => navigate('/connections')}
        style={{ padding: '10px 18px', background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(59,130,246,0.3))', border: '1px solid rgba(167,139,250,0.4)', borderRadius: '12px', color: 'white', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
        <span style={{ fontSize: '1.3rem' }}>👥</span>
        <span>Friends</span>
    </button>
    <ShareButton
        title={`${user?.username}'s Movie Explorer Profile`}
        text={`🎬 Check out ${user?.username}'s profile on Movie Explorer!\n\n📊 ${reviews.length} Reviews | 📋 ${watchlist.length} Watchlist\n\nJoin and share your movie taste!`}
        url={window.location.href}
    />
</div>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '20px' }}>
                {[
                    { value: reviews.length, label: 'Total Reviews' },
                    { value: watchlist.length, label: 'Watchlist' },
                    { value: topMedal ? medalEmoji[topMedal] : '—', label: 'Favourite Medal' }
                ].map((stat, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
                        <h3 style={{ fontSize: '2rem', background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: '700', marginBottom: '5px' }}>{stat.value}</h3>
                        <p style={{ color: '#666', fontSize: '0.85rem' }}>{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Analytics Dashboard */}
            {!loading && reviews.length > 0 && (
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '25px', marginBottom: '20px' }}>
                    <h3 style={{ background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '1.2rem', fontWeight: '700', marginBottom: '25px' }}>
                        📊 My Analytics Dashboard
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                        {/* Medal Pie Chart */}
                        {Object.keys(medalStats).length > 0 && (
                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '20px' }}>
                                <h4 style={{ color: '#aaa', fontSize: '0.9rem', fontWeight: '600', marginBottom: '15px', textAlign: 'center' }}>🏅 Medal Distribution</h4>
                                <Pie
                                    data={medalChartData}
                                    options={{ ...pieOptions, plugins: { ...pieOptions.plugins, legend: { display: false } } }}
                                    plugins={[{
                                        id: 'emojiLabels',
                                        afterDraw(chart) {
                                            const { ctx } = chart;
                                            chart.data.datasets.forEach((dataset, datasetIndex) => {
                                                const meta = chart.getDatasetMeta(datasetIndex);
                                                meta.data.forEach((arc, index) => {
                                                    const label = Object.keys(medalStats)[index];
                                                    const emoji = medalEmoji[label] || '🎬';
                                                    const angle = (arc.startAngle + arc.endAngle) / 2;
                                                    const radius = (arc.innerRadius + arc.outerRadius) / 2;
                                                    const x = arc.x + Math.cos(angle) * radius;
                                                    const y = arc.y + Math.sin(angle) * radius;
                                                    ctx.save();
                                                    ctx.font = '18px serif';
                                                    ctx.textAlign = 'center';
                                                    ctx.textBaseline = 'middle';
                                                    ctx.fillText(emoji, x, y);
                                                    ctx.restore();
                                                });
                                            });
                                        }
                                    }]}
                                />
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
                                    {Object.entries(medalStats).map(([medal, count]) => (
                                        <div key={medal} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: medalColors[medal] }} />
                                            <span style={{ color: '#888', fontSize: '0.75rem' }}>{medalEmoji[medal]} {medal} ({count})</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Genre Bar Chart */}
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '20px' }}>
                            <h4 style={{ color: '#aaa', fontSize: '0.9rem', fontWeight: '600', marginBottom: '10px', textAlign: 'center' }}>🎭 Genre Preferences</h4>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '12px' }}>
                                {[
                                    { key: 'all', label: '🌐 All' },
                                    { key: 'movie', label: '🎬 Movies' },
                                    { key: 'tv', label: '📺 TV' },
                                    { key: 'anime', label: '⛩️ Anime' }
                                ].map(btn => (
                                    <button key={btn.key} onClick={() => setGenreFilter(btn.key)} style={{
                                        padding: '4px 10px',
                                        background: genreFilter === btn.key ? 'linear-gradient(135deg, rgba(124,58,237,0.4), rgba(59,130,246,0.4))' : 'rgba(255,255,255,0.05)',
                                        border: `1px solid ${genreFilter === btn.key ? 'rgba(167,139,250,0.5)' : 'rgba(255,255,255,0.08)'}`,
                                        color: genreFilter === btn.key ? 'white' : '#666',
                                        borderRadius: '8px', cursor: 'pointer', fontSize: '0.72rem',
                                        fontFamily: 'Inter, sans-serif'
                                    }}>{btn.label}</button>
                                ))}
                            </div>
                            <Bar data={filteredGenreChartData} options={chartOptions} />
                        </div>
                    </div>

                    {/* Analytics Summary */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginTop: '15px' }}>
                        {[
                            { label: 'Top Genre', value: topGenre, icon: '🎭' },
                            { label: 'Top Medal', value: topMedal ? `${medalEmoji[topMedal]} ${topMedal}` : '—', icon: '🏅' },
                            { label: 'Avg Reviews/Month', value: Object.keys(monthlyStats).length > 0 ? (reviews.length / Object.keys(monthlyStats).length).toFixed(1) : '—', icon: '📈' }
                        ].map((item, i) => (
                            <div key={i} style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '12px', padding: '15px', textAlign: 'center' }}>
                                <p style={{ fontSize: '1.5rem', marginBottom: '5px' }}>{item.icon}</p>
                                <p style={{ color: '#a78bfa', fontSize: '0.95rem', fontWeight: '700', marginBottom: '3px' }}>{item.value}</p>
                                <p style={{ color: '#666', fontSize: '0.78rem' }}>{item.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Medal Stats */}
            {Object.keys(medalStats).length > 0 && (
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
                    <h3 style={{ background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '1.1rem', fontWeight: '600', marginBottom: '15px' }}>🏅 My Medal Stats</h3>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {Object.entries(medalStats).map(([medal, count]) => (
                            <div key={medal} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '15px 20px', textAlign: 'center', minWidth: '100px' }}>
                                <div style={{ fontSize: '2rem', marginBottom: '5px' }}>{medalEmoji[medal]}</div>
                                <p style={{ color: '#666', fontSize: '0.78rem', marginBottom: '4px' }}>{medal}</p>
                                <strong style={{ color: 'white', fontSize: '1.2rem' }}>{count}</strong>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Reviews */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px' }}>
                <h3 style={{ background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '1.1rem', fontWeight: '600', marginBottom: '15px' }}>💬 My Reviews</h3>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '15px', flexWrap: 'wrap' }}>
                    {[
                        { key: 'all', label: '🌐 All', count: reviews.length },
                        { key: 'movie', label: '🎬 Movies', count: movieCount },
                        { key: 'tvseries', label: '📺 TV', count: tvCount },
                        { key: 'anime', label: '⛩️ Anime', count: animeCount },
                    ].map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                            padding: '7px 16px',
                            background: activeTab === tab.key ? 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(59,130,246,0.3))' : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${activeTab === tab.key ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.08)'}`,
                            color: activeTab === tab.key ? 'white' : '#aaa',
                            borderRadius: '10px', cursor: 'pointer', fontSize: '0.85rem',
                            fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: '6px'
                        }}>
                            {tab.label}
                            <span style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 7px', borderRadius: '10px', fontSize: '0.75rem' }}>{tab.count}</span>
                        </button>
                    ))}
                </div>
                {loading ? (
                    <p style={{ color: '#555' }}>Loading...</p>
                ) : filteredReviews.length === 0 ? (
                    <p style={{ color: '#555', textAlign: 'center', padding: '30px' }}>No reviews yet!</p>
                ) : (
                    filteredReviews.map(review => (
                        <div key={review.review_id} onClick={() => navigate(getDetailPath(review))}
                            style={{ display: 'flex', gap: '15px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '15px', marginBottom: '12px', cursor: 'pointer' }}>
                            {review.content_poster && review.content_poster !== 'N/A' ? (
                                <img src={review.content_poster} alt={review.content_title} style={{ width: '60px', height: '85px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} />
                            ) : (
                                <div style={{ width: '60px', height: '85px', background: 'rgba(124,58,237,0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>🎬</div>
                            )}
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                                    <h4 style={{ color: 'white', fontSize: '0.95rem', fontWeight: '600' }}>{review.content_title}</h4>
                                    <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '10px', background: review.content_type.toLowerCase() === 'movie' ? 'rgba(124,58,237,0.2)' : review.content_type.toLowerCase() === 'tvseries' ? 'rgba(59,130,246,0.2)' : 'rgba(16,185,129,0.2)', color: review.content_type.toLowerCase() === 'movie' ? '#a78bfa' : review.content_type.toLowerCase() === 'tvseries' ? '#60a5fa' : '#34d399' }}>
                                        {review.content_type.toLowerCase() === 'movie' ? '🎬' : review.content_type.toLowerCase() === 'tvseries' ? '📺' : '⛩️'} {review.content_type}
                                    </span>
                                </div>
                                <span style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', padding: '3px 12px', borderRadius: '20px', color: 'white', fontSize: '0.78rem' }}>{medalEmoji[review.medal]} {review.medal}</span>
                                <p style={{ color: '#999', fontSize: '0.85rem', marginTop: '8px', lineHeight: '1.5' }}>{review.review_text}</p>
                                <p style={{ color: '#555', fontSize: '0.78rem', marginTop: '5px' }}>{new Date(review.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

export default Profile