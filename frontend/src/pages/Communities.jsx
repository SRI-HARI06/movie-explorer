import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import API from '../utils/api'

const genreIcons = {
    'Action': '💥', 'Drama': '🎭', 'Comedy': '😂', 'Horror': '👻',
    'Sci-Fi': '🚀', 'Romance': '❤️', 'Thriller': '🔪', 'Animation': '🎨'
}

function PostCard({ post, currentUser, onLike, onDelete }) {
    return (
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '18px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.9rem', color: 'white' }}>
                        {post.username[0].toUpperCase()}
                    </div>
                    <div>
                        <p style={{ color: 'white', fontWeight: '600', fontSize: '0.9rem', margin: 0 }}>{post.username}</p>
                        <p style={{ color: '#555', fontSize: '0.75rem', margin: 0 }}>{new Date(post.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                </div>
                {post.username === currentUser && (
                    <button onClick={() => onDelete(post.post_id)} style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '4px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.78rem', fontFamily: 'Inter, sans-serif' }}>🗑️ Delete</button>
                )}
            </div>
            <p style={{ color: '#ccc', lineHeight: '1.6', margin: '0 0 12px 0', fontSize: '0.95rem' }}>{post.post_text}</p>
            <button onClick={() => onLike(post.post_id)} style={{ background: post.user_liked ? 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(59,130,246,0.3))' : 'rgba(255,255,255,0.06)', border: `1px solid ${post.user_liked ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.1)'}`, color: post.user_liked ? '#c4b5fd' : '#888', padding: '6px 16px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'Inter, sans-serif' }}>
                ❤️ {post.like_count} {post.user_liked ? 'Liked' : 'Like'}
            </button>
        </div>
    )
}

function CommunityDetail({ community, currentUser, onBack }) {
    const [posts, setPosts] = useState([])
    const [newPost, setNewPost] = useState('')
    const [loading, setLoading] = useState(true)
    const [posting, setPosting] = useState(false)

    useEffect(() => { fetchPosts() }, [community.community_id])

    const fetchPosts = async () => {
        setLoading(true)
        const res = await API.get(`/communities/${community.community_id}/posts`)
        setPosts(res.data)
        setLoading(false)
    }

    const handlePost = async () => {
        if (!newPost.trim()) return
        setPosting(true)
        const res = await API.post(`/communities/${community.community_id}/posts`, { text: newPost })
        setPosts([res.data, ...posts])
        setNewPost('')
        setPosting(false)
    }

    const handleLike = async (postId) => {
        const res = await API.post(`/communities/posts/${postId}/like`)
        setPosts(posts.map(p => p.post_id === postId ? { ...p, like_count: res.data.count, user_liked: res.data.liked } : p))
    }

    const handleDelete = async (postId) => {
        if (!confirm('Delete this post?')) return
        await API.delete(`/communities/posts/${postId}`)
        setPosts(posts.filter(p => p.post_id !== postId))
    }

    return (
        <div style={{ maxWidth: '800px', margin: '30px auto', padding: '0 20px' }}>
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '25px', marginBottom: '20px' }}>
                <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#aaa', padding: '6px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', marginBottom: '15px', fontFamily: 'Inter, sans-serif' }}>⬅ Back</button>
                <h2 style={{ fontSize: '1.8rem', fontWeight: '700', background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>
                    {genreIcons[community.genre] || '🎬'} {community.genre} Community
                </h2>
                <p style={{ color: '#666', fontSize: '0.9rem' }}>{community.description}</p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
                <textarea value={newPost} onChange={e => setNewPost(e.target.value)}
                    placeholder={`Share your thoughts about ${community.genre} movies...`} rows={3}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px 16px', color: 'white', fontSize: '0.95rem', resize: 'vertical', fontFamily: 'Inter, sans-serif', marginBottom: '12px', boxSizing: 'border-box', outline: 'none' }}
                />
                <button onClick={handlePost} disabled={posting || !newPost.trim()} style={{ padding: '10px 25px', background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', border: 'none', borderRadius: '10px', color: 'white', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', opacity: posting || !newPost.trim() ? 0.6 : 1, fontFamily: 'Inter, sans-serif' }}>
                    {posting ? 'Posting...' : 'Post 💬'}
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#555' }}>Loading posts...</div>
            ) : posts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', color: '#555' }}>
                    <p style={{ fontSize: '3rem', marginBottom: '15px' }}>💬</p>
                    <p>No posts yet. Start the conversation!</p>
                </div>
            ) : posts.map(post => (
                <PostCard key={post.post_id} post={post} currentUser={currentUser} onLike={handleLike} onDelete={handleDelete} />
            ))}
        </div>
    )
}

function Communities() {
    const [communities, setCommunities] = useState([])
    const [selected, setSelected] = useState(null)
    const [loading, setLoading] = useState(true)
    const { user } = useAuth()

    useEffect(() => {
        API.get('/communities').then(res => {
            setCommunities(res.data)
            setLoading(false)
        })
    }, [])

    if (selected) return <CommunityDetail community={selected} currentUser={user?.username} onBack={() => setSelected(null)} />

    return (
        <div style={{ minHeight: '100vh' }}>
            <div style={{ textAlign: 'center', padding: '50px 20px 30px', background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.1) 0%, transparent 70%)' }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: '800', background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>🎭 Movie Communities</h2>
                <p style={{ color: '#666', fontSize: '0.95rem' }}>Join a genre community and discuss your favourite films!</p>
            </div>

            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#555' }}>Loading...</div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                        {communities.map(community => (
                            <div key={community.community_id} onClick={() => setSelected(community)}
                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '25px 20px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s' }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.borderColor = 'rgba(167,139,250,0.4)' }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}
                            >
                                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>{genreIcons[community.genre] || '🎬'}</div>
                                <h3 style={{ color: 'white', fontSize: '1.05rem', fontWeight: '600', marginBottom: '8px' }}>{community.genre}</h3>
                                <p style={{ color: '#666', fontSize: '0.82rem', lineHeight: '1.5', marginBottom: '12px' }}>{community.description}</p>
                                <span style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '0.82rem', fontWeight: '600' }}>
                                    💬 {community.post_count} posts
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Communities