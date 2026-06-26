const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/:userId', async (req, res) => {
    const userId = parseInt(req.params.userId);
    const K = 3; // Number of nearest neighbours

    if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    try {
        // Step 1: Get current user's ratings
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

        const myVector = {};
        myReviews.rows.forEach(r => {
            myVector[r.content_id] = parseInt(r.score);
        });

        const myMovieIds = Object.keys(myVector);

        if (myMovieIds.length === 0) {
            return res.json({ 
                recommendations: [], 
                neighbours: [],
                message: 'Review some movies first!' 
            });
        }

        // Step 2: Get all other users
        const otherUsers = await pool.query(`
            SELECT DISTINCT user_id, username FROM users
            WHERE user_id != $1
        `, [userId]);

        if (otherUsers.rows.length === 0) {
            return res.json({ 
                recommendations: [], 
                neighbours: [],
                message: 'No other users found!' 
            });
        }

        // Step 3: Get all other users reviews
        const otherUserIds = otherUsers.rows.map(r => r.user_id);

        const allReviews = await pool.query(`
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

        // Step 4: Build vectors for each user
        const userVectors = {};
        allReviews.rows.forEach(r => {
            if (!userVectors[r.user_id]) userVectors[r.user_id] = {};
            userVectors[r.user_id][r.content_id] = parseInt(r.score);
        });

        // Step 5: Cosine Similarity function
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

        // Step 6: Calculate similarity with ALL other users
        const similarities = otherUsers.rows.map(user => {
            const sim = cosineSimilarity(myVector, userVectors[user.user_id] || {});
            return {
                user_id: user.user_id,
                username: user.username,
                similarity: parseFloat(sim.toFixed(4))
            };
        });

        // Step 7: Sort and pick TOP K nearest neighbours
        const kNeighbours = similarities
            .filter(u => u.similarity > 0)
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, K);

        if (kNeighbours.length === 0) {
            return res.json({ 
                recommendations: [], 
                neighbours: [],
                message: 'No similar users found!' 
            });
        }

        // Step 8: Collect movies from K neighbours weighted by similarity
        const movieScores = {};
        const neighbourIds = kNeighbours.map(n => n.user_id);

        allReviews.rows.forEach(r => {
            if (!neighbourIds.includes(r.user_id)) return;
            if (myMovieIds.includes(r.content_id)) return; // skip already seen

            const neighbour = kNeighbours.find(n => n.user_id === r.user_id);
            const weight = neighbour.similarity * parseInt(r.score);

            if (!movieScores[r.content_id]) movieScores[r.content_id] = 0;
            movieScores[r.content_id] += weight;
        });

        // Step 9: Sort movies by score
        const topMovieIds = Object.entries(movieScores)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([id]) => id);

        if (topMovieIds.length === 0) {
            return res.json({ 
                recommendations: [], 
                neighbours: kNeighbours,
                message: 'No new movies to recommend!' 
            });
        }

        // Step 10: Fetch movie details
        const movieDetails = await pool.query(`
            SELECT * FROM movies WHERE imdb_id = ANY($1)
        `, [topMovieIds]);

        const sorted = topMovieIds
            .map(id => movieDetails.rows.find(m => m.imdb_id === id))
            .filter(Boolean);

        res.json({
            recommendations: sorted,
            neighbours: kNeighbours,
            k: K,
            algorithm: 'KNN with Cosine Similarity'
        });

    } catch (err) {
        console.error('KNN error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;