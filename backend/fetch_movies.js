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

// 50 popular movies by IMDB ID
const movieIds = [
    'tt0468569', 'tt0111161', 'tt0137523', 'tt0110912', 'tt0133093',
    'tt0816692', 'tt1375666', 'tt0068646', 'tt0071562', 'tt0050083',
    'tt0108052', 'tt0167260', 'tt0120737', 'tt0167261', 'tt0080684',
    'tt0076759', 'tt0120689', 'tt0317248', 'tt0114369', 'tt0102926',
    'tt0172495', 'tt0245429', 'tt0209144', 'tt0482571', 'tt0407887',
    'tt1853728', 'tt0993846', 'tt2015381', 'tt0910970', 'tt0114709',
    'tt0325980', 'tt0435761', 'tt1130884', 'tt0364569', 'tt4154796',
    'tt4154756', 'tt0848228', 'tt2395427', 'tt3498820', 'tt1270797',
    'tt0266543', 'tt0382932', 'tt0892769', 'tt1201607', 'tt0361748',
    'tt1345836', 'tt0120586', 'tt0107290', 'tt0088763', 'tt0062622'
];

async function fetchAndSaveMovies() {
    console.log('Starting movie fetch using OMDB API...');
    let saved = 0;

    for (const imdbId of movieIds) {
        try {
            const response = await axios.get(
                `http://www.omdbapi.com/?i=${imdbId}&apikey=${OMDB_KEY}`
            );
            const m = response.data;

            if (m.Response !== 'True') {
                console.log(`❌ Skipping ${imdbId}: ${m.Error}`);
                continue;
            }

            // Only English movies
            if (m.Language && !m.Language.includes('English')) {
                console.log(`⏭️ Skipping ${m.Title}: not English`);
                continue;
            }

            const year = m.Year ? parseInt(m.Year) : null;
            const poster = m.Poster !== 'N/A' ? m.Poster : null;
            const rating = m.imdbRating !== 'N/A' ? parseFloat(m.imdbRating) : null;
            const votes = m.imdbVotes !== 'N/A'
                ? parseInt(m.imdbVotes.replace(/,/g, ''))
                : null;

            await pool.query(`
                INSERT INTO movies (
                    imdb_id, title, overview, poster_path,
                    release_date, release_year, genre,
                    language, popularity, vote_average, vote_count
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                ON CONFLICT (imdb_id) DO NOTHING
            `, [
                imdbId,                // ✅ FIX: now goes to imdb_id (TEXT)
                m.Title,
                m.Plot,
                poster,
                m.Released,
                year,
                m.Genre,
                'en',
                null,
                rating,
                votes
            ]);

            saved++;
            console.log(`✅ ${saved}/${movieIds.length}: ${m.Title} (${m.Year})`);
            await delay(200);

        } catch (err) {
            console.log(`❌ Error for ${imdbId}:`, err.message);
        }
    }

    console.log(`\n🎉 Done! Saved ${saved} movies to database!`);
    pool.end();
}

fetchAndSaveMovies();
