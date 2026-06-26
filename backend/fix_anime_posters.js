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

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fixAnimePosters() {
    const result = await pool.query('SELECT mal_id, title FROM anime');
    console.log(`Fixing ${result.rows.length} anime posters...`);

    for (const anime of result.rows) {
        try {
            const res = await axios.get(`https://api.jikan.moe/v4/anime/${anime.mal_id}`);
            const data = res.data.data;

            // Use webp format instead of jpg - less likely to be blocked
            const poster = data?.images?.webp?.large_image_url ||
                          data?.images?.jpg?.large_image_url ||
                          null;

            if (poster) {
                await pool.query(
                    'UPDATE anime SET poster_path = $1 WHERE mal_id = $2',
                    [poster, anime.mal_id]
                );
                console.log(`✅ Fixed: ${anime.title}`);
            } else {
                console.log(`❌ No poster: ${anime.title}`);
            }

            await delay(1000); // Jikan rate limit
        } catch (err) {
            console.log(`❌ Error for ${anime.title}:`, err.message);
            await delay(1000);
        }
    }

    console.log('Done!');
    pool.end();
}

fixAnimePosters();