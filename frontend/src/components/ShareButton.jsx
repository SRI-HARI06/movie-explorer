import { useState } from 'react'

function ShareButton({ title, text, url, type = 'default' }) {
    const [copied, setCopied] = useState(false)
    const [showMenu, setShowMenu] = useState(false)

    const shareUrl = url || window.location.href
    const shareText = text || title

    // Native share (mobile)
    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: title,
                    text: shareText,
                    url: shareUrl
                })
            } catch (err) {
                console.log('Share cancelled')
            }
        } else {
            setShowMenu(!showMenu)
        }
    }

    // Copy link
    const handleCopy = () => {
        navigator.clipboard.writeText(`${shareText}\n${shareUrl}`)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        setShowMenu(false)
    }

    // Share platforms
    const platforms = [
        {
            name: 'WhatsApp',
            emoji: '💬',
            color: '#25D366',
            url: `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`
        },
        {
            name: 'Twitter/X',
            emoji: '🐦',
            color: '#1DA1F2',
            url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
        },
        {
            name: 'Telegram',
            emoji: '✈️',
            color: '#0088cc',
            url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
        },
        {
            name: 'Facebook',
            emoji: '👤',
            color: '#1877F2',
            url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`
        },
        {
            name: 'Reddit',
            emoji: '🤖',
            color: '#FF4500',
            url: `https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`
        },
        {
            name: 'Email',
            emoji: '📧',
            color: '#888',
            url: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`
        }
    ]

    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
                onClick={handleNativeShare}
                style={{
                    padding: '7px 16px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '10px',
                    color: '#aaa',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#aaa' }}
            >
                🔗 Share
            </button>

            {/* Share Menu (for desktop) */}
            {showMenu && (
                <>
                    {/* Backdrop */}
                    <div onClick={() => setShowMenu(false)}
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }} />

                    {/* Menu */}
                    <div style={{
                        position: 'absolute', bottom: '110%', left: '50%',
                        transform: 'translateX(-50%)',
                        background: '#1a1a1a',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '14px',
                        padding: '12px',
                        zIndex: 999,
                        minWidth: '200px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                    }}>
                        <p style={{ color: '#666', fontSize: '0.75rem', marginBottom: '10px', textAlign: 'center' }}>Share via</p>

                        {platforms.map(platform => (
                            <a key={platform.name}
                                href={platform.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setShowMenu(false)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '8px 12px', borderRadius: '8px',
                                    color: 'white', textDecoration: 'none',
                                    fontSize: '0.85rem', marginBottom: '4px',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                <span style={{ fontSize: '1.1rem' }}>{platform.emoji}</span>
                                <span>{platform.name}</span>
                            </a>
                        ))}

                        {/* Divider */}
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', margin: '8px 0' }} />

                        {/* Copy Link */}
                        <button onClick={handleCopy}
                            style={{
                                width: '100%', padding: '8px 12px',
                                background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)',
                                border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`,
                                borderRadius: '8px', color: copied ? '#34d399' : '#aaa',
                                fontSize: '0.82rem', cursor: 'pointer',
                                fontFamily: 'Inter, sans-serif',
                                display: 'flex', alignItems: 'center', gap: '8px'
                            }}>
                            {copied ? '✅ Copied!' : '🔗 Copy Link'}
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}

export default ShareButton