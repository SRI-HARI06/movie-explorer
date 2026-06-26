import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import API from '../utils/api'

function Register() {
    const [form, setForm] = useState({ username: '', email: '', password: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            const res = await API.post('/auth/register', form)
            login(res.data.token, res.data.user)
            navigate('/')
        } catch (err) {
            setError(err.response?.data?.error || 'Something went wrong!')
        }
        setLoading(false)
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.15) 0%, transparent 70%)'
        }}>
            <div style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '20px',
                padding: '40px',
                width: '420px'
            }}>
                <h1 style={{
                    textAlign: 'center',
                    fontSize: '1.8rem',
                    fontWeight: '800',
                    background: 'linear-gradient(135deg, #a78bfa, #60a5fa)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '8px'
                }}>🎬 Movie Explorer</h1>
                <h2 style={{ textAlign: 'center', color: 'white', fontSize: '1.2rem', marginBottom: '25px', fontWeight: '600' }}>
                    Create Account
                </h2>

                {error && (
                    <div style={{
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.3)',
                        color: '#fca5a5',
                        padding: '12px',
                        borderRadius: '10px',
                        marginBottom: '15px',
                        fontSize: '0.9rem'
                    }}>{error}</div>
                )}

                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Username"
                        value={form.username}
                        onChange={e => setForm({ ...form, username: e.target.value })}
                        required
                        style={inputStyle}
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        required
                        style={{ ...inputStyle, marginTop: '10px' }}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={form.password}
                        onChange={e => setForm({ ...form, password: e.target.value })}
                        required
                        style={{ ...inputStyle, marginTop: '10px' }}
                    />
                    <button type="submit" disabled={loading} style={btnStyle}>
                        {loading ? 'Creating account...' : 'Register'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', color: '#666', marginTop: '20px', fontSize: '0.9rem' }}>
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: '#a78bfa', fontWeight: '500' }}>Login here</Link>
                </p>
            </div>
        </div>
    )
}

const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    color: 'white',
    fontSize: '0.95rem',
    outline: 'none',
    fontFamily: 'Inter, sans-serif'
}

const btnStyle = {
    width: '100%',
    padding: '12px',
    marginTop: '15px',
    background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'Inter, sans-serif'
}

export default Register