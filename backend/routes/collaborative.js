const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/:userId', async (req, res) => {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    try {
        // Step 1: Get current user's reviewed movies with scores
        const myReviews = await pool.query(`
            SELECT content_id,
                CASE medal
                    WHEN 'Gold'   THEN 3
                    WHEN 'Silver' THEN 2
                    WHEN 'Bronze' THEN 1
                    ELSE 1
                END as score
            FROM reviews
            WHERE user_id = $1 AND content_type = 'movie'
        `, [userId]);

        const myMovies = {};
        myReviews.rows.forEach(r => {
            myMovies[r.content_id] = parseInt(r.score);
        });

        const myMovieIds = Object.keys(myMovies);

        if (myMovieIds.length === 0) {
            return res.json({ recommendations: [], message: 'Review some movies first!' });
        }

        // Step 2: Find other users who watched same movies
        const otherUsers = await pool.query(`
            SELECT DISTINCT user_id FROM reviews
            WHERE content_id = ANY($1)
            AND user_id != $2
            AND content_type = 'movie'
        `, [myMovieIds, userId]);

        if (otherUsers.rows.length === 0) {
            return res.json({ recommendations: [], message: 'No similar users found yet!' });
        }

        const otherUserIds = otherUsers.rows.map(r => r.user_id);

        // Step 3: Get all reviews of similar users
        const otherReviews = await pool.query(`
            SELECT user_id, content_id,
                CASE medal
                    WHEN 'Gold'   THEN 3
                    WHEN 'Silver' THEN 2
                    WHEN 'Bronze' THEN 1
                    ELSE 1
                END as score
            FROM reviews
            WHERE user_id = ANY($1)
            AND content_type = 'movie'
        `, [otherUserIds]);

        // Step 4: Calculate similarity score (Cosine Similarity)
        const userVectors = {};
        otherReviews.rows.forEach(r => {
            if (!userVectors[r.user_id]) userVectors[r.user_id] = {};
            userVectors[r.user_id][r.content_id] = parseInt(r.score);
        });

        const cosineSimilarity = (vecA, vecB) => {
            const allMovies = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
            let dotProduct = 0, magA = 0, magB = 0;
            allMovies.forEach(movie => {
                const a = vecA[movie] || 0;
                const b = vecB[movie] || 0;
                dotProduct += a * b;
                magA += a * a;
                magB += b * b;
            });
            if (magA === 0 || magB === 0) return 0;
            return dotProduct / (Math.sqrt(magA) * Math.sqrt(magB));
        };

        // Step 5: Calculate similarity with each other user
        const similarities = {};
        otherUserIds.forEach(uid => {
            similarities[uid] = cosineSimilarity(myMovies, userVectors[uid] || {});
        });

        // Step 6: Collect movie recommendations weighted by similarity
        const movieScores = {};
        otherReviews.rows.forEach(r => {
            // Skip movies current user already reviewed
            if (myMovieIds.includes(r.content_id)) return;

            const sim = similarities[r.user_id] || 0;
            if (sim <= 0) return;

            if (!movieScores[r.content_id]) movieScores[r.content_id] = 0;
            movieScores[r.content_id] += sim * parseInt(r.score);
        });

        // Step 7: Sort by score and get top 10
        const topMovieIds = Object.entries(movieScores)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([id]) => id);

        if (topMovieIds.length === 0) {
            return res.json({ recommendations: [], message: 'No new recommendations found!' });
        }

        // Step 8: Fetch movie details from DB
        const movieDetails = await pool.query(`
            SELECT * FROM movies
            WHERE imdb_id = ANY($1)
        `, [topMovieIds]);

        // Sort by score order
        const sorted = topMovieIds
            .map(id => movieDetails.rows.find(m => m.imdb_id === id))
            .filter(Boolean);

        // Step 9: Find most similar user for display
        const mostSimilarUserId = Object.entries(similarities)
            .sort((a, b) => b[1] - a[1])[0]?.[0];

        const similarUser = await pool.query(`
            SELECT username FROM users WHERE user_id = $1
        `, [mostSimilarUserId]);

        res.json({
            recommendations: sorted,
            similarUser: similarUser.rows[0]?.username || 'another user',
            totalSimilarUsers: otherUserIds.length
        });

    } catch (err) {
        console.error('Collaborative filtering error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;