const express = require('express');
const router = express.Router();
const pool = require('../db');

// Helper function to calculate genre scores
const getGenreScores = async (userId, contentType) => {
    const genreScore = {};

    // Get genres from watchlist (only for movies)
    if (contentType === 'movie') {
        const watchlistResult = await pool.query(
            `SELECT genre FROM watchlist WHERE user_id = $1 AND genre IS NOT NULL`,
            [userId]
        );
        watchlistResult.rows.forEach(row => {
            if (!row.genre) return;
            row.genre.split(',').forEach(g => {
                const genre = g.trim();
                genreScore[genre] = (genreScore[genre] || 0) + 1;
            });
        });
    }

    // Get genres from reviews with medal weight
    let reviewQuery = '';
    if (contentType === 'movie') {
        reviewQuery = `
            SELECT m.genre,
                CASE r.medal
                    WHEN 'Gold'   THEN 3
                    WHEN 'Silver' THEN 2
                    WHEN 'Bronze' THEN 1
                    ELSE 1
                END as weight
            FROM reviews r
            JOIN movies m ON m.imdb_id = r.content_id
            WHERE r.user_id = $1 AND r.content_type = 'movie'
        `;
    } else if (contentType === 'tv') {
        reviewQuery = `
            SELECT t.genre,
                CASE r.medal
                    WHEN 'Gold'   THEN 3
                    WHEN 'Silver' THEN 2
                    WHEN 'Bronze' THEN 1
                    ELSE 1
                END as weight
            FROM reviews r
            JOIN tv_series t ON t.imdb_id = r.content_id
            WHERE r.user_id = $1 AND r.content_type = 'TVSeries'
        `;
    } else if (contentType === 'anime') {
        reviewQuery = `
            SELECT a.genre,
                CASE r.medal
                    WHEN 'Gold'   THEN 3
                    WHEN 'Silver' THEN 2
                    WHEN 'Bronze' THEN 1
                    ELSE 1
                END as weight
            FROM reviews r
            JOIN anime a ON CAST(a.mal_id AS VARCHAR) = r.content_id
            WHERE r.user_id = $1 AND r.content_type = 'Anime'
        `;
    }

    const reviewResult = await pool.query(reviewQuery, [userId]);
    reviewResult.rows.forEach(row => {
        if (!row.genre) return;
        row.genre.split(',').forEach(g => {
            const genre = g.trim();
            genreScore[genre] = (genreScore[genre] || 0) + Number(row.weight);
        });
    });

    return genreScore;
};

// ── Movie Recommendations ──────────────────────────────────────────
router.get('/movies/:userId', async (req, res) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) return res.status(400).json({ error: 'Invalid user ID' });

    try {
        const genreScore = await getGenreScores(userId, 'movie');
        const topGenres = Object.entries(genreScore)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([genre]) => genre);

        if (topGenres.length === 0) {
            const popular = await pool.query(
                `SELECT * FROM movies ORDER BY vote_average DESC NULLS LAST LIMIT 10`
            );
            return res.json({ recommendations: popular.rows, basedOn: 'popular', topGenres: [] });
        }

        // Get seen movies
        const watchlistSeen = await pool.query(
            `SELECT imdb_id FROM watchlist WHERE user_id = $1`, [userId]
        );
        const reviewsSeen = await pool.query(
            `SELECT content_id as imdb_id FROM reviews WHERE user_id = $1 AND content_type = 'movie'`, [userId]
        );
        const seenIds = [
            ...watchlistSeen.rows.map(r => r.imdb_id),
            ...reviewsSeen.rows.map(r => r.imdb_id)
        ].filter(Boolean);

        const genreConditions = topGenres.map((g, i) => `genre ILIKE $${i + 1}`).join(' OR ');
        const params = topGenres.map(g => `%${g}%`);

        let query = `
            SELECT *, (
                ${topGenres.map((g, i) => `(CASE WHEN genre ILIKE $${i + 1} THEN ${3 - i} ELSE 0 END)`).join(' + ')}
            ) as score
            FROM movies WHERE (${genreConditions})
        `;

        if (seenIds.length > 0) {
            query += ` AND imdb_id != ALL($${topGenres.length + 1})`;
            params.push(seenIds);
        }
        query += ` ORDER BY score DESC, vote_average DESC NULLS LAST LIMIT 10`;

        const result = await pool.query(query, params);
        res.json({ recommendations: result.rows, basedOn: 'user_behaviour', topGenres });

    } catch (err) {
        console.error('Movie recommendation error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ── TV Series Recommendations ──────────────────────────────────────
router.get('/tv/:userId', async (req, res) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) return res.status(400).json({ error: 'Invalid user ID' });

    try {
        const genreScore = await getGenreScores(userId, 'tv');
        const topGenres = Object.entries(genreScore)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([genre]) => genre);

        if (topGenres.length === 0) {
            const popular = await pool.query(
                `SELECT * FROM tv_series ORDER BY vote_average DESC NULLS LAST LIMIT 10`
            );
            return res.json({ recommendations: popular.rows, basedOn: 'popular', topGenres: [] });
        }

        // Get seen TV series
        const reviewsSeen = await pool.query(
            `SELECT content_id FROM reviews WHERE user_id = $1 AND content_type = 'TVSeries'`, [userId]
        );
        const seenIds = reviewsSeen.rows.map(r => r.content_id).filter(Boolean);

        const genreConditions = topGenres.map((g, i) => `genre ILIKE $${i + 1}`).join(' OR ');
        const params = topGenres.map(g => `%${g}%`);

        let query = `
            SELECT *, (
                ${topGenres.map((g, i) => `(CASE WHEN genre ILIKE $${i + 1} THEN ${3 - i} ELSE 0 END)`).join(' + ')}
            ) as score
            FROM tv_series WHERE (${genreConditions})
        `;

        if (seenIds.length > 0) {
            query += ` AND imdb_id != ALL($${topGenres.length + 1})`;
            params.push(seenIds);
        }
        query += ` ORDER BY score DESC, vote_average DESC NULLS LAST LIMIT 10`;

        const result = await pool.query(query, params);
        res.json({ recommendations: result.rows, basedOn: 'user_behaviour', topGenres });

    } catch (err) {
        console.error('TV recommendation error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ── Anime Recommendations ──────────────────────────────────────────
router.get('/anime/:userId', async (req, res) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) return res.status(400).json({ error: 'Invalid user ID' });

    try {
        const genreScore = await getGenreScores(userId, 'anime');
        const topGenres = Object.entries(genreScore)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([genre]) => genre);

        if (topGenres.length === 0) {
            const popular = await pool.query(
                `SELECT * FROM anime ORDER BY vote_average DESC NULLS LAST LIMIT 10`
            );
            return res.json({ recommendations: popular.rows, basedOn: 'popular', topGenres: [] });
        }

        // Get seen anime
        const reviewsSeen = await pool.query(
            `SELECT content_id FROM reviews WHERE user_id = $1 AND content_type = 'Anime'`, [userId]
        );
        const seenIds = reviewsSeen.rows.map(r => r.content_id).filter(Boolean);

        const genreConditions = topGenres.map((g, i) => `genre ILIKE $${i + 1}`).join(' OR ');
        const params = topGenres.map(g => `%${g}%`);

        let query = `
            SELECT *, (
                ${topGenres.map((g, i) => `(CASE WHEN genre ILIKE $${i + 1} THEN ${3 - i} ELSE 0 END)`).join(' + ')}
            ) as score
            FROM anime WHERE (${genreConditions})
        `;

        if (seenIds.length > 0) {
            query += ` AND CAST(mal_id AS VARCHAR) != ALL($${topGenres.length + 1})`;
            params.push(seenIds);
        }
        query += ` ORDER BY score DESC, vote_average DESC NULLS LAST LIMIT 10`;

        const result = await pool.query(query, params);
        res.json({ recommendations: result.rows, basedOn: 'user_behaviour', topGenres });

    } catch (err) {
        console.error('Anime recommendation error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Keep old route working for backwards compatibility
router.get('/:userId', async (req, res) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) return res.status(400).json({ error: 'Invalid user ID' });

    try {
        const genreScore = await getGenreScores(userId, 'movie');
        const topGenres = Object.entries(genreScore)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([genre]) => genre);

        if (topGenres.length === 0) {
            const popular = await pool.query(
                `SELECT * FROM movies ORDER BY vote_average DESC NULLS LAST LIMIT 10`
            );
            return res.json({ recommendations: popular.rows, basedOn: 'popular', topGenres: [] });
        }

        const watchlistSeen = await pool.query(
            `SELECT imdb_id FROM watchlist WHERE user_id = $1`, [userId]
        );
        const reviewsSeen = await pool.query(
            `SELECT content_id as imdb_id FROM reviews WHERE user_id = $1 AND content_type = 'movie'`, [userId]
        );
        const seenIds = [
            ...watchlistSeen.rows.map(r => r.imdb_id),
            ...reviewsSeen.rows.map(r => r.imdb_id)
        ].filter(Boolean);

        const genreConditions = topGenres.map((g, i) => `genre ILIKE $${i + 1}`).join(' OR ');
        const params = topGenres.map(g => `%${g}%`);

        let query = `
            SELECT *, (
                ${topGenres.map((g, i) => `(CASE WHEN genre ILIKE $${i + 1} THEN ${3 - i} ELSE 0 END)`).join(' + ')}
            ) as score
            FROM movies WHERE (${genreConditions})
        `;

        if (seenIds.length > 0) {
            query += ` AND imdb_id != ALL($${topGenres.length + 1})`;
            params.push(seenIds);
        }
        query += ` ORDER BY score DESC, vote_average DESC NULLS LAST LIMIT 10`;

        const result = await pool.query(query, params);
        res.json({ recommendations: result.rows, basedOn: 'user_behaviour', topGenres });

    } catch (err) {
        console.error('Recommendation error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;