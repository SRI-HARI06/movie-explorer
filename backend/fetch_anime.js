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

// 50 popular anime MAL IDs
const animeIds = [
    1,      // Cowboy Bebop
    5114,   // Fullmetal Alchemist Brotherhood
    9253,   // Steins Gate
    28977,  // Mushishi
    11757,  // Sword Art Online
    16498,  // Attack on Titan
    38000,  // Demon Slayer
    20,     // Naruto
    21,     // One Piece
    269,    // Bleach
    1535,   // Death Note
    22319,  // Tokyo Ghoul
    31240,  // Re Zero
    40748,  // Jujutsu Kaisen
    38524,  // Vinland Saga
    37779,  // Kimetsu no Yaiba
    30,     // Neon Genesis Evangelion
    33,     // Rurouni Kenshin
    227,    // FLCL
    457,    // Trigun
    478,    // Ghost in the Shell SAC
    889,    // Black Lagoon
    918,    // Gintama
    1575,   // Code Geass
    2904,   // Code Geass R2
    4224,   // Toradora
    6547,   // Angel Beats
    7791,   // Fairy Tail
    8769,   // Ano Hi Mita Hana
    9756,   // Mirai Nikki
    10162,  // Hunter x Hunter
    13601,  // Sword Art Online Extra
    14813,  // Yahari Ore
    15335,  // Shingeki no Kyojin
    17074,  // Kill la Kill
    19815,  // No Game No Life
    20583,  // Shigatsu wa Kimi no Uso
    21459,  // Overlord
    23273,  // Parasyte
    23755,  // Assassination Classroom
    28851,  // Koe no Katachi
    32281,  // Kimi no Na wa
    32935,  // Dragon Ball Super
    33352,  // One Punch Man S2
    34096,  // Made in Abyss
    35760,  // Darling in the FranXX
    36474,  // A Silent Voice
    37510,  // Mob Psycho 100
    39535,  // Beastars
    41467   // Mushoku Tensei
];

async function fetchAndSaveAnime() {
    console.log('Starting Anime fetch using Jikan API...');
    let saved = 0;

    for (const malId of animeIds) {
        try {
            const response = await axios.get(
                `https://api.jikan.moe/v4/anime/${malId}`
            );
            const a = response.data.data;

            if (!a) {
                console.log(`❌ Skipping ${malId}: no data`);
                continue;
            }

            const year = a.aired?.prop?.from?.year || null;
            const poster = a.images?.jpg?.large_image_url || null;
            const rating = a.score || null;
            const votes = a.scored_by || null;
            const genres = a.genres?.map(g => g.name).join(', ') || null;
            const episodes = a.episodes || null;
            const status = a.status || null;

            await pool.query(`
                INSERT INTO anime (
                    mal_id, title, overview, poster_path,
                    release_year, genre, episodes,
                    vote_average, vote_count, status
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                ON CONFLICT (mal_id) DO NOTHING
            `, [
                malId,
                a.title_english || a.title,
                a.synopsis,
                poster,
                year,
                genres,
                episodes,
                rating,
                votes,
                status
            ]);

            saved++;
            console.log(`✅ ${saved}: ${a.title_english || a.title}`);
            await delay(1000); // Jikan API rate limit

        } catch (err) {
            console.log(`❌ Error for ${malId}:`, err.message);
        }
    }

    console.log(`\n🎉 Done! Saved ${saved} anime to database!`);
    pool.end();
}

fetchAndSaveAnime();