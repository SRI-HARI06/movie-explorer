const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// Search users
router.get('/search', auth, async (req, res) => {
    const { query } = req.query;
    const userId = req.user.user_id;
    try {
        const result = await pool.query(`
            SELECT u.user_id, u.username, u.email,
                COUNT(r.review_id) as review_count,
                CASE WHEN c.connection_id IS NOT NULL THEN true ELSE false END as is_connected
            FROM users u
            LEFT JOIN reviews r ON r.user_id = u.user_id
            LEFT JOIN connections c ON c.user_id = $1 AND c.connected_user_id = u.user_id
            WHERE u.user_id != $1
            AND (u.username ILIKE $2 OR u.email ILIKE $2)
            GROUP BY u.user_id, u.username, u.email, c.connection_id
            LIMIT 10
        `, [userId, `%${query}%`]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all connections
router.get('/', auth, async (req, res) => {
    const userId = req.user.user_id;
    try {
        const result = await pool.query(`
            SELECT u.user_id, u.username, u.email,
                COUNT(r.review_id) as review_count,
                c.created_at as connected_since
            FROM connections c
            JOIN users u ON u.user_id = c.connected_user_id
            LEFT JOIN reviews r ON r.user_id = u.user_id
            WHERE c.user_id = $1
            GROUP BY u.user_id, u.username, u.email, c.created_at
            ORDER BY c.created_at DESC
        `, [userId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Connect with user
router.post('/:targetUserId', auth, async (req, res) => {
    const userId = req.user.user_id;
    const targetUserId = parseInt(req.params.targetUserId);
    try {
        // Check if already connected
        const existing = await pool.query(
            'SELECT * FROM connections WHERE user_id = $1 AND connected_user_id = $2',
            [userId, targetUserId]
        );

        if (existing.rows.length > 0) {
            // Disconnect
            await pool.query(
                'DELETE FROM connections WHERE user_id = $1 AND connected_user_id = $2',
                [userId, targetUserId]
            );
            return res.json({ connected: false, message: 'Disconnected!' });
        }

        // Connect
        await pool.query(
            'INSERT INTO connections (user_id, connected_user_id) VALUES ($1, $2)',
            [userId, targetUserId]
        );
        res.json({ connected: true, message: 'Connected!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get friend's profile and reviews
router.get('/profile/:targetUserId', auth, async (req, res) => {
    const targetUserId = parseInt(req.params.targetUserId);
    const userId = req.user.user_id;
    try {
        // Get user info
        const userResult = await pool.query(
            'SELECT user_id, username, email, created_at FROM users WHERE user_id = $1',
            [targetUserId]
        );
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get their reviews
        const reviewResult = await pool.query(`
            SELECT * FROM reviews
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT 20
        `, [targetUserId]);

        // Get their watchlist count
        const watchlistResult = await pool.query(
            'SELECT COUNT(*) FROM watchlist WHERE user_id = $1',
            [targetUserId]
        );

        // Check if connected
        const connResult = await pool.query(
            'SELECT * FROM connections WHERE user_id = $1 AND connected_user_id = $2',
            [userId, targetUserId]
        );

        res.json({
            user: userResult.rows[0],
            reviews: reviewResult.rows,
            watchlistCount: parseInt(watchlistResult.rows[0].count),
            isConnected: connResult.rows.length > 0
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get recent activity of all connections
router.get('/activity/feed', auth, async (req, res) => {
    const userId = req.user.user_id;
    try {
        const result = await pool.query(`
            SELECT r.*, u.username
            FROM reviews r
            JOIN users u ON u.user_id = r.user_id
            WHERE r.user_id IN (
                SELECT connected_user_id FROM connections WHERE user_id = $1
            )
            ORDER BY r.created_at DESC
            LIMIT 20
        `, [userId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;