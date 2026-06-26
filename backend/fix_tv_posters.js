const axios = require('axios');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
});

const OMDB_KEY = process.env.OMDB_API_KEY;
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fixPosters() {
    const result = await pool.query('SELECT imdb_id, title FROM tv_series');
    console.log(`Fixing ${result.rows.length} TV series posters...`);

    for (const show of result.rows) {
        try {
            const res = await axios.get(`http://www.omdbapi.com/?i=${show.imdb_id}&apikey=${OMDB_KEY}`);
            const data = res.data;

            if (data.Response === 'True' && data.Poster && data.Poster !== 'N/A') {
                await pool.query(
                    'UPDATE tv_series SET poster_path = $1 WHERE imdb_id = $2',
                    [data.Poster, show.imdb_id]
                );
                console.log(`✅ Fixed: ${show.title}`);
            } else {
                console.log(`❌ No poster: ${show.title}`);
            }
            await delay(200);
        } catch (err) {
            console.log(`❌ Error for ${show.title}:`, err.message);
        }
    }

    console.log('Done!');
    pool.end();
}

fixPosters();