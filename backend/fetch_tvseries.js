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

// 50 popular TV series IMDB IDs
const tvIds = [
    'tt0944947', // Game of Thrones
    'tt0903747', // Breaking Bad
    'tt0306414', // The Wire
    'tt1475582', // Sherlock
    'tt0455275', // Prison Break
    'tt0773262', // Dexter
    'tt1856010', // House of Cards
    'tt2356777', // True Detective
    'tt0108778', // Friends
    'tt0386676', // The Office
    'tt1674771', // Peaky Blinders
    'tt2575988', // Stranger Things
    'tt1831164', // Homeland
    'tt0141842', // The Sopranos
    'tt0098904', // Seinfeld
    'tt0185906', // Band of Brothers
    'tt0417299', // Avatar: The Last Airbender
    'tt1520211', // The Walking Dead
    'tt2085059', // Black Mirror
    'tt3032476', // Better Call Saul
    'tt1856013', // House of Cards US
    'tt4574334', // Stranger Things S2
    'tt0264235', // Monk
    'tt0367279', // Arrested Development
    'tt1475582', // Sherlock
    'tt0472954', // Rome
    'tt1442437', // Modern Family
    'tt3498781', // Narcos
    'tt0318871', // Justified
    'tt1533395', // Parks and Recreation
    'tt0397442', // Battlestar Galactica
    'tt1124373', // Lost
    'tt0436992', // Doctor Who
    'tt2442560', // Peaky Blinders S2
    'tt0813715', // Heroes
    'tt1051220', // Game of Thrones S2
    'tt0112159', // X-Files
    'tt0092455', // Star Trek TNG
    'tt1219024', // Boardwalk Empire
    'tt1spell',  
    'tt2707408', // Narcos
    'tt1632701', // Suits
    'tt1561755', // Mindhunter
    'tt0348914', // Curb Your Enthusiasm
    'tt0411008', // Lost S2
    'tt5180504', // The Witcher
    'tt7366338', // Chernobyl
    'tt8111088', // The Boys
    'tt1442449', // Dark
    'tt0460681'  // Supernatural
];

async function fetchAndSaveTVSeries() {
    console.log('Starting TV Series fetch using OMDB API...');
    let saved = 0;

    for (const imdbId of tvIds) {
        try {
            const response = await axios.get(
                `http://www.omdbapi.com/?i=${imdbId}&apikey=${OMDB_KEY}`
            );
            const m = response.data;

            if (m.Response !== 'True') {
                console.log(`❌ Skipping ${imdbId}: ${m.Error}`);
                continue;
            }

            if (m.Type !== 'series') {
                console.log(`⏭️ Skipping ${m.Title}: not a series`);
                continue;
            }

            const year = m.Year ? parseInt(m.Year) : null;
            const poster = m.Poster !== 'N/A' ? m.Poster : null;
            const rating = m.imdbRating !== 'N/A' ? parseFloat(m.imdbRating) : null;
            const votes = m.imdbVotes !== 'N/A'
                ? parseInt(m.imdbVotes.replace(/,/g, ''))
                : null;
            const seasons = m.totalSeasons ? parseInt(m.totalSeasons) : null;

            await pool.query(`
                INSERT INTO tv_series (
                    imdb_id, title, overview, poster_path,
                    first_air_date, release_year, genre,
                    language, vote_average, vote_count, seasons
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                ON CONFLICT (imdb_id) DO NOTHING
            `, [
                imdbId,
                m.Title,
                m.Plot,
                poster,
                m.Released,
                year,
                m.Genre,
                'en',
                rating,
                votes,
                seasons
            ]);

            saved++;
            console.log(`✅ ${saved}: ${m.Title} (${m.Year})`);
            await delay(200);

        } catch (err) {
            console.log(`❌ Error for ${imdbId}:`, err.message);
        }
    }

    console.log(`\n🎉 Done! Saved ${saved} TV series to database!`);
    pool.end();
}

fetchAndSaveTVSeries();