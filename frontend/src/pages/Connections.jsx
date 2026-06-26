import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../utils/api'

const medalEmoji = { 'Absolute Cinema': '🎖️', 'Gold': '🥇', 'Silver': '🥈', 'Bronze': '🥉', 'No Medal': '🚫' }

function Connections() {
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [connections, setConnections] = useState([])
    const [activity, setActivity] = useState([])
    const [selectedUser, setSelectedUser] = useState(null)
    const [friendProfile, setFriendProfile] = useState(null)
    const [activeTab, setActiveTab] = useState('connections')
    const [loading, setLoading] = useState(false)
    const [profileLoading, setProfileLoading] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        fetchConnections()
        fetchActivity()
    }, [])

    const fetchConnections = async () => {
        try {
            const res = await API.get('/connections')
            setConnections(res.data)
        } catch (err) { console.error(err) }
    }

    const fetchActivity = async () => {
        try {
            const res = await API.get('/connections/activity/feed')
            setActivity(res.data)
        } catch (err) { console.error(err) }
    }

    const handleSearch = async () => {
        if (!searchQuery.trim()) return
        setLoading(true)
        try {
            const res = await API.get(`/connections/search?query=${searchQuery}`)
            setSearchResults(res.data)
        } catch (err) { console.error(err) }
        setLoading(false)
    }

    const handleConnect = async (targetUserId) => {
        try {
            const res = await API.post(`/connections/${targetUserId}`)
            // Update search results
            setSearchResults(prev => prev.map(u =>
                u.user_id === targetUserId
                    ? { ...u, is_connected: res.data.connected }
                    : u
            ))
            // Refresh connections list
            fetchConnections()
            fetchActivity()
        } catch (err) { console.error(err) }
    }

    const handleViewProfile = async (userId) => {
        setSelectedUser(userId)
        setProfileLoading(true)
        try {
            const res = await API.get(`/connections/profile/${userId}`)
            setFriendProfile(res.data)
        } catch (err) { console.error(err) }
        setProfileLoading(false)
    }

    const getDetailPath = (review) => {
        if (review.content_type === 'TVSeries') return `/tv/${review.content_id}`
        if (review.content_type === 'Anime') return `/anime/${review.content_id}`
        return `/movie/${review.content_id}`
    }

    return (
        <div style={{ maxWidth: '900px', margin: '30px auto', padding: '0 20px' }}>

            {/* Header */}
            <div style={{ textAlign: 'center', padding: '30px 20px', background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.1) 0%, transparent 70%)', borderRadius: '20px', marginBottom: '25px' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: '800', background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>👥 Connections</h2>
                <p style={{ color: '#666', fontSize: '0.9rem' }}>Connect with friends and see what they're watching</p>
            </div>

            {/* Search Bar */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
                <h3 style={{ color: 'white', fontSize: '1rem', fontWeight: '600', marginBottom: '12px' }}>🔍 Find Users</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                        type="text"
                        placeholder="Search by username or email..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 16px', color: 'white', fontSize: '0.9rem', outline: 'none', fontFamily: 'Inter, sans-serif' }}
                    />
                    <button onClick={handleSearch} disabled={loading}
                        style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', border: 'none', borderRadius: '10px', color: 'white', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                        {loading ? '...' : 'Search'}
                    </button>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                    <div style={{ marginTop: '15px' }}>
                        {searchResults.map(user => (
                            <div key={user.user_id} style={{ display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '12px 15px', marginBottom: '8px' }}>
                                <div style={{ width: '42px', height: '42px', background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '1rem', flexShrink: 0 }}>
                                    {user.username[0].toUpperCase()}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ color: 'white', fontWeight: '600', fontSize: '0.9rem' }}>{user.username}</p>
                                    <p style={{ color: '#666', fontSize: '0.78rem' }}>💬 {user.review_count} reviews</p>
                                </div>
                                <button onClick={() => handleViewProfile(user.user_id)}
                                    style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#aaa', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'Inter, sans-serif', marginRight: '6px' }}>
                                    👁 View
                                </button>
                                <button onClick={() => handleConnect(user.user_id)}
                                    style={{ padding: '6px 14px', background: user.is_connected ? 'rgba(239,68,68,0.15)' : 'linear-gradient(135deg, #7c3aed, #3b82f6)', border: `1px solid ${user.is_connected ? 'rgba(239,68,68,0.3)' : 'transparent'}`, borderRadius: '8px', color: user.is_connected ? '#fca5a5' : 'white', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                                    {user.is_connected ? '✕ Disconnect' : '+ Connect'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {searchResults.length === 0 && searchQuery && !loading && (
                    <p style={{ color: '#555', textAlign: 'center', marginTop: '15px', fontSize: '0.85rem' }}>No users found!</p>
                )}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                {[
                    { key: 'connections', label: `👥 My Connections (${connections.length})` },
                    { key: 'activity', label: `📰 Recent Activity (${activity.length})` }
                ].map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                        padding: '8px 18px',
                        background: activeTab === tab.key ? 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(59,130,246,0.3))' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${activeTab === tab.key ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.08)'}`,
                        color: activeTab === tab.key ? 'white' : '#aaa',
                        borderRadius: '10px', cursor: 'pointer', fontSize: '0.85rem',
                        fontFamily: 'Inter, sans-serif'
                    }}>{tab.label}</button>
                ))}
            </div>

            {/* Connections List */}
            {activeTab === 'connections' && (
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px' }}>
                    {connections.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#555' }}>
                            <p style={{ fontSize: '2rem', marginBottom: '10px' }}>👥</p>
                            <p>No connections yet! Search for users to connect.</p>
                        </div>
                    ) : (
                        connections.map(conn => (
                            <div key={conn.user_id} style={{ display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '15px', marginBottom: '10px' }}>
                                <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '1.2rem', flexShrink: 0 }}>
                                    {conn.username[0].toUpperCase()}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ color: 'white', fontWeight: '600', fontSize: '0.95rem', marginBottom: '3px' }}>{conn.username}</p>
                                    <p style={{ color: '#666', fontSize: '0.78rem' }}>💬 {conn.review_count} reviews • Connected {new Date(conn.connected_since).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                </div>
                                <button onClick={() => handleViewProfile(conn.user_id)}
                                    style={{ padding: '8px 16px', background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(59,130,246,0.3))', border: '1px solid rgba(167,139,250,0.3)', borderRadius: '10px', color: 'white', fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                                    View Profile
                                </button>
                                <button onClick={() => handleConnect(conn.user_id)}
                                    style={{ padding: '8px 16px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', color: '#fca5a5', fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                                    Disconnect
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Activity Feed */}
            {activeTab === 'activity' && (
                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px' }}>
                    {activity.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#555' }}>
                            <p style={{ fontSize: '2rem', marginBottom: '10px' }}>📰</p>
                            <p>No activity yet! Connect with users to see their reviews.</p>
                        </div>
                    ) : (
                        activity.map(review => (
                            <div key={review.review_id} onClick={() => navigate(getDetailPath(review))}
                                style={{ display: 'flex', gap: '15px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '15px', marginBottom: '10px', cursor: 'pointer' }}>
                                {review.content_poster && review.content_poster !== 'N/A' ? (
                                    <img src={review.content_poster} alt={review.content_title} style={{ width: '55px', height: '75px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} />
                                ) : (
                                    <div style={{ width: '55px', height: '75px', background: 'rgba(124,58,237,0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>🎬</div>
                                )}
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', flexWrap: 'wrap' }}>
                                        <div style={{ width: '24px', height: '24px', background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '0.7rem' }}>
                                            {review.username[0].toUpperCase()}
                                        </div>
                                        <span style={{ color: '#a78bfa', fontWeight: '600', fontSize: '0.85rem' }}>{review.username}</span>
                                        <span style={{ color: '#555', fontSize: '0.78rem' }}>reviewed</span>
                                        <span style={{ color: 'white', fontWeight: '600', fontSize: '0.85rem' }}>{review.content_title}</span>
                                    </div>
                                    <span style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', padding: '2px 10px', borderRadius: '20px', color: 'white', fontSize: '0.75rem' }}>{medalEmoji[review.medal]} {review.medal}</span>
                                    <p style={{ color: '#999', fontSize: '0.82rem', marginTop: '6px', lineHeight: '1.5' }}>{review.review_text}</p>
                                    <p style={{ color: '#555', fontSize: '0.75rem', marginTop: '4px' }}>{new Date(review.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Friend Profile Modal */}
            {selectedUser && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
                    onClick={(e) => { if (e.target === e.currentTarget) setSelectedUser(null) }}>
                    <div style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '30px', width: '100%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }}>
                        {profileLoading ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#555' }}>Loading profile...</div>
                        ) : friendProfile ? (
                            <>
                                {/* Friend Header */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                                    <div style={{ width: '60px', height: '60px', background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '1.5rem' }}>
                                        {friendProfile.user.username[0].toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ color: 'white', fontSize: '1.2rem', fontWeight: '700' }}>{friendProfile.user.username}</h3>
                                        <p style={{ color: '#666', fontSize: '0.82rem' }}>📧 {friendProfile.user.email}</p>
                                    </div>
                                    <button onClick={() => setSelectedUser(null)}
                                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#aaa', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>✕</button>
                                </div>

                                {/* Stats */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
                                    {[
                                        { value: friendProfile.reviews.length, label: 'Reviews' },
                                        { value: friendProfile.watchlistCount, label: 'Watchlist' },
                                        { value: friendProfile.isConnected ? '✅' : '➕', label: friendProfile.isConnected ? 'Connected' : 'Not Connected' }
                                    ].map((stat, i) => (
                                        <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '15px', textAlign: 'center' }}>
                                            <p style={{ color: 'white', fontSize: '1.5rem', fontWeight: '700', marginBottom: '4px' }}>{stat.value}</p>
                                            <p style={{ color: '#666', fontSize: '0.78rem' }}>{stat.label}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Connect/Disconnect button */}
                                <button onClick={() => { handleConnect(friendProfile.user.user_id); setFriendProfile(prev => ({ ...prev, isConnected: !prev.isConnected })) }}
                                    style={{ width: '100%', padding: '10px', marginBottom: '20px', background: friendProfile.isConnected ? 'rgba(239,68,68,0.15)' : 'linear-gradient(135deg, #7c3aed, #3b82f6)', border: `1px solid ${friendProfile.isConnected ? 'rgba(239,68,68,0.3)' : 'transparent'}`, borderRadius: '10px', color: friendProfile.isConnected ? '#fca5a5' : 'white', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                                    {friendProfile.isConnected ? '✕ Disconnect' : '+ Connect'}
                                </button>

                                {/* Recent Reviews */}
                                <h4 style={{ color: '#aaa', fontSize: '0.9rem', fontWeight: '600', marginBottom: '12px' }}>📋 Recent Reviews</h4>
                                {friendProfile.reviews.length === 0 ? (
                                    <p style={{ color: '#555', textAlign: 'center', padding: '20px' }}>No reviews yet!</p>
                                ) : (
                                    friendProfile.reviews.map(review => (
                                        <div key={review.review_id} onClick={() => { navigate(getDetailPath(review)); setSelectedUser(null) }}
                                            style={{ display: 'flex', gap: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '12px', marginBottom: '8px', cursor: 'pointer' }}>
                                            {review.content_poster && review.content_poster !== 'N/A' ? (
                                                <img src={review.content_poster} alt={review.content_title} style={{ width: '45px', height: '65px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} />
                                            ) : (
                                                <div style={{ width: '45px', height: '65px', background: 'rgba(124,58,237,0.2)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>🎬</div>
                                            )}
                                            <div style={{ flex: 1 }}>
                                                <h5 style={{ color: 'white', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>{review.content_title}</h5>
                                                <span style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', padding: '2px 8px', borderRadius: '10px', color: 'white', fontSize: '0.72rem' }}>{medalEmoji[review.medal]} {review.medal}</span>
                                                <p style={{ color: '#999', fontSize: '0.78rem', marginTop: '5px', lineHeight: '1.4' }}>{review.review_text?.slice(0, 80)}...</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    )
}

export default Connections