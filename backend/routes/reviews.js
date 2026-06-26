const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// ⚠️ This must come FIRST before /:contentId/:contentType
// Get user reviews
router.get('/user/all', auth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT review_id, content_id, content_type, content_title, 
                   content_poster, medal, review_text, created_at
            FROM reviews WHERE user_id=$1 ORDER BY created_at DESC
        `, [req.user.user_id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get reviews for content
router.get('/:contentId/:contentType', auth, async (req, res) => {
    const { contentId, contentType } = req.params;
    try {
        const result = await pool.query(`
            SELECT r.review_id, u.username, r.medal, r.review_text, r.created_at,
                   COUNT(rl.like_id) as like_count,
                   MAX(CASE WHEN rl.user_id=$1 THEN 1 ELSE 0 END) as user_liked
            FROM reviews r
            JOIN users u ON r.user_id = u.user_id
            LEFT JOIN review_likes rl ON r.review_id = rl.review_id
            WHERE r.content_id=$2 AND r.content_type=$3
            GROUP BY r.review_id, u.username
            ORDER BY like_count DESC, r.created_at DESC
        `, [req.user.user_id, contentId, contentType]);

        const medalResult = await pool.query(`
            SELECT medal, COUNT(*) as count FROM reviews
            WHERE content_id=$1 AND content_type=$2
            GROUP BY medal ORDER BY count DESC
        `, [contentId, contentType]);

        const medalCounts = { 'Absolute Cinema': 0, 'Gold': 0, 'Silver': 0, 'Bronze': 0, 'No Medal': 0 };
        medalResult.rows.forEach(r => { medalCounts[r.medal] = parseInt(r.count); });
        const topMedal = medalResult.rows[0]?.medal || null;

        res.json({ reviews: result.rows, medalCounts, topMedal });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Submit review
router.post('/', auth, async (req, res) => {
    const { content_id, content_type, content_title, content_poster, medal, review_text } = req.body;
    try {
        await pool.query(`
            INSERT INTO reviews (user_id, content_id, content_type, content_title, content_poster, medal, review_text)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (user_id, content_id, content_type)
            DO UPDATE SET medal=$6, review_text=$7
        `, [req.user.user_id, content_id, content_type, content_title, content_poster, medal, review_text]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Like review
router.post('/:reviewId/like', auth, async (req, res) => {
    const { reviewId } = req.params;
    try {
        const existing = await pool.query(
            'SELECT like_id FROM review_likes WHERE review_id=$1 AND user_id=$2',
            [reviewId, req.user.user_id]
        );
        if (existing.rows.length > 0) {
            await pool.query('DELETE FROM review_likes WHERE review_id=$1 AND user_id=$2',
                [reviewId, req.user.user_id]);
        } else {
            await pool.query('INSERT INTO review_likes (review_id, user_id) VALUES ($1, $2)',
                [reviewId, req.user.user_id]);
        }
        const count = await pool.query('SELECT COUNT(*) FROM review_likes WHERE review_id=$1', [reviewId]);
        res.json({ liked: existing.rows.length === 0, count: parseInt(count.rows[0].count) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Get genre stats for analytics
router.get('/genre-stats', auth, async (req, res) => {
    const userId = req.user.user_id;
    try {
        // Movie genres
        const movieGenres = await pool.query(`
            SELECT m.genre FROM reviews r
            JOIN movies m ON m.imdb_id = r.content_id
            WHERE r.user_id = $1 AND r.content_type = 'movie'
            AND m.genre IS NOT NULL
        `, [userId]);

        // TV genres
        const tvGenres = await pool.query(`
            SELECT t.genre FROM reviews r
            JOIN tv_series t ON t.imdb_id = r.content_id
            WHERE r.user_id = $1 AND r.content_type = 'TVSeries'
            AND t.genre IS NOT NULL
        `, [userId]);

        // Anime genres
        const animeGenres = await pool.query(`
            SELECT a.genre FROM reviews r
            JOIN anime a ON CAST(a.mal_id AS VARCHAR) = r.content_id
            WHERE r.user_id = $1 AND r.content_type = 'Anime'
            AND a.genre IS NOT NULL
        `, [userId]);

        res.json({
            movie: movieGenres.rows.map(r => r.genre),
            tv: tvGenres.rows.map(r => r.genre),
            anime: animeGenres.rows.map(r => r.genre)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;