const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// Get watchlist
router.get('/', auth, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM watchlist WHERE user_id=$1 ORDER BY added_at DESC',
            [req.user.user_id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add to watchlist
router.post('/', auth, async (req, res) => {
    const { imdb_id, title, poster_url, genre, release_year, content_type } = req.body;
    try {
        await pool.query(`
            INSERT INTO watchlist (user_id, imdb_id, title, poster_url, genre, release_year, content_type)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT DO NOTHING
        `, [req.user.user_id, imdb_id, title, poster_url, genre, release_year, content_type || 'Movie']);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Remove from watchlist
router.delete('/:imdbId', auth, async (req, res) => {
    try {
        await pool.query('DELETE FROM watchlist WHERE user_id=$1 AND imdb_id=$2',
            [req.user.user_id, req.params.imdbId]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;