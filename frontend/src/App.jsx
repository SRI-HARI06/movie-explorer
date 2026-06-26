import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import Search from './pages/Search'
import MovieDetail from './pages/MovieDetail'
import TVDetail from './pages/TVDetail'
import AnimeDetail from './pages/AnimeDetail'
import Movies from './pages/Movies'
import Watchlist from './pages/Watchlist'
import Communities from './pages/Communities'
import Awards from './pages/Awards'
import Profile from './pages/Profile'
import Chatbot from './pages/Chatbot'
import Recommendations from './pages/Recommendations'
import Navbar from './components/Navbar'
import TVSeries from './pages/TVSeries'
import Anime from './pages/Anime'
import Connections from './pages/Connections'

function PrivateRoute({ children }) {
    const { user, loading } = useAuth()
    if (loading) return <div className="loading">Loading...</div>
    return user ? children : <Navigate to="/login" />
}

function App() {
    const { user } = useAuth()
    return (
        <div className="app">
            {user && <Navbar />}
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
                <Route path="/search" element={<PrivateRoute><Search /></PrivateRoute>} />
                <Route path="/movie/:imdbId" element={<PrivateRoute><MovieDetail /></PrivateRoute>} />
                <Route path="/tv/:showId" element={<PrivateRoute><TVDetail /></PrivateRoute>} />
                <Route path="/anime/:malId" element={<PrivateRoute><AnimeDetail /></PrivateRoute>} />
                <Route path="/movies" element={<PrivateRoute><Movies /></PrivateRoute>} />
                <Route path="/tvseries" element={<PrivateRoute><TVSeries /></PrivateRoute>} />
                <Route path="/anime" element={<PrivateRoute><Anime /></PrivateRoute>} />
                <Route path="/watchlist" element={<PrivateRoute><Watchlist /></PrivateRoute>} />
                <Route path="/communities" element={<PrivateRoute><Communities /></PrivateRoute>} />
                <Route path="/awards" element={<PrivateRoute><Awards /></PrivateRoute>} />
                <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                <Route path="/chatbot" element={<PrivateRoute><Chatbot /></PrivateRoute>} />
                <Route path="/recommendations" element={<PrivateRoute><Recommendations /></PrivateRoute>} />
                <Route path="/connections" element={<PrivateRoute><Connections /></PrivateRoute>} />
            </Routes>
        </div>
    )
}

export default App