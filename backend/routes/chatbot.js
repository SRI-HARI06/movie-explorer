const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const axios = require('axios');

const ML_SERVICE = 'http://localhost:8000';

router.post('/', auth, async (req, res) => {
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
        return res.status(400).json({ error: 'Message is required' });
    }

    try {
        // Step 1: Get all movies from database
        const result = await pool.query(`
            SELECT imdb_id, title, overview, genre,
                   poster_path, release_year, vote_average
            FROM movies
            WHERE overview IS NOT NULL
        `);

        const movies = result.rows;

        if (movies.length === 0) {
            return res.json({
                response: "I don't have any movies in my database yet!",
                movies: []
            });
        }

        // Step 2: Send to Python ML service
        const mlResponse = await axios.post(`${ML_SERVICE}/match`, {
            query: message,
            movies: movies
        });

        const topMatches = mlResponse.data.matches;

        if (!topMatches || topMatches.length === 0) {
            return res.json({
                response: "Hmm, I couldn't find a match! Try describing the story differently.",
                movies: []
            });
        }

        // Step 3: Build response
        const topMovie = topMatches[0];
        const otherMovies = topMatches.slice(1).map(m => m.title).join(', ');

        let responseText = `🎬 Based on your description, I think you're looking for **${topMovie.title}** (${topMovie.release_year})!\n\n`;
        responseText += `📖 "${topMovie.overview}"\n\n`;

        if (otherMovies) {
            responseText += `I also found some similar movies: ${otherMovies}`;
        }

        res.json({
            response: responseText,
            movies: topMatches,
            algorithm: mlResponse.data.algorithm
        });

    } catch (err) {
        // If Python service is down, fallback message
        if (err.code === 'ECONNREFUSED') {
            return res.status(503).json({ 
                error: 'ML service is not running! Start it with: python app.py' 
            });
        }
        console.error('Chatbot error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;