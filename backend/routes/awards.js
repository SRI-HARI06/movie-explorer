const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM awards ORDER BY year_won DESC');
        const moviesDict = {};
        result.rows.forEach(row => {
            if (!moviesDict[row.imdb_id]) {
                moviesDict[row.imdb_id] = {
                    imdb_id: row.imdb_id,
                    title: row.title,
                    poster_url: row.poster_url,
                    release_year: row.release_year,
                    awards: []
                };
            }
            moviesDict[row.imdb_id].awards.push({
                award_name: row.award_name,
                category: row.category,
                year_won: row.year_won
            });
        });
        res.json(Object.values(moviesDict));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;