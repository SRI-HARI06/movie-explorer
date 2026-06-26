const express = require('express');
const router = express.Router();
const axios = require('axios');
const pool = require('../db');

const OMDB_KEY = process.env.OMDB_API_KEY;

// Search movies
router.get('/search', async (req, res) => {
    const { query } = req.query;
    try {
        const response = await axios.get(`http://www.omdbapi.com/?s=${query}&apikey=${OMDB_KEY}`);
        const data = response.data;
        if (data.Response === 'True') {
            const details = await Promise.all(
                data.Search.slice(0, 8).map(m =>
                    axios.get(`http://www.omdbapi.com/?i=${m.imdbID}&apikey=${OMDB_KEY}`).then(r => r.data)
                )
            );
            res.json({ movies: details });
        } else {
            res.json({ movies: [] });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get movie detail
router.get('/detail/:imdbId', async (req, res) => {
    try {
        const response = await axios.get(`http://www.omdbapi.com/?i=${req.params.imdbId}&apikey=${OMDB_KEY}`);
        res.json(response.data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get new releases
router.get('/new-releases', async (req, res) => {
    const ids = ['tt9603212', 'tt20969586', 'tt10466872', 'tt3566834', 'tt14916990', 'tt13186482', 'tt0172922', 'tt12584954'];
    try {
        const movies = await Promise.all(
            ids.map(id => axios.get(`http://www.omdbapi.com/?i=${id}&apikey=${OMDB_KEY}`).then(r => r.data))
        );
        res.json(movies.filter(m => m.Response === 'True'));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Search TV Series
router.get('/tvsearch', async (req, res) => {
    const { query } = req.query;
    try {
        const response = await axios.get(`https://api.tvmaze.com/search/shows?q=${query}`);
        const shows = response.data
            .filter(item => item.show.image)
            .slice(0, 8)
            .map(item => item.show);
        res.json({ shows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Search Anime
router.get('/animesearch', async (req, res) => {
    const { query } = req.query;
    try {
        const response = await axios.get(`https://api.jikan.moe/v4/anime?q=${query}&limit=8`);
        res.json({ anime: response.data.data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Movies by genre - from local database
router.get('/by-genre', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM movies ORDER BY vote_average DESC NULLS LAST'
        );
        const moviesByGenre = {};
        result.rows.forEach(movie => {
            if (!movie.genre) return;
            movie.genre.split(',').forEach(g => {
                const genre = g.trim();
                if (!moviesByGenre[genre]) moviesByGenre[genre] = [];
                const exists = moviesByGenre[genre].find(m => m.imdb_id === movie.imdb_id);
                if (!exists) moviesByGenre[genre].push(movie);
            });
        });
        res.json(moviesByGenre);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// TV Series by genre - from local database
router.get('/tv-by-genre', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT tv_id, imdb_id, title, overview, poster_path,
                    release_year, genre, vote_average, vote_count, seasons
             FROM tv_series ORDER BY vote_average DESC NULLS LAST`
        );
        const byGenre = {};
        result.rows.forEach(show => {
            if (!show.genre) return;
            show.genre.split(',').forEach(g => {
                const genre = g.trim();
                if (!byGenre[genre]) byGenre[genre] = [];
                const exists = byGenre[genre].find(s => s.imdb_id === show.imdb_id);
                if (!exists) byGenre[genre].push(show);
            });
        });
        res.json(byGenre);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Anime by genre - from local database
router.get('/anime-by-genre', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT anime_id, mal_id, title, overview, poster_path,
                    release_year, genre, vote_average, vote_count, episodes, status
             FROM anime ORDER BY vote_average DESC NULLS LAST`
        );
        const byGenre = {};
        result.rows.forEach(anime => {
            if (!anime.genre) return;
            anime.genre.split(',').forEach(g => {
                const genre = g.trim();
                if (!byGenre[genre]) byGenre[genre] = [];
                const exists = byGenre[genre].find(a => a.mal_id === anime.mal_id);
                if (!exists) byGenre[genre].push(anime);
            });
        });
        res.json(byGenre);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get TV series detail from local DB
router.get('/tv-detail/:imdbId', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM tv_series WHERE imdb_id = $1',
            [req.params.imdbId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'TV series not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get anime detail from local DB
router.get('/anime-detail/:malId', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM anime WHERE mal_id = $1',
            [req.params.malId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Anime not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;