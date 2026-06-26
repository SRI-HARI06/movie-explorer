const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// Get all communities
router.get('/', auth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT c.community_id, c.genre, c.description,
                   COUNT(cp.post_id) as post_count
            FROM communities c
            LEFT JOIN community_posts cp ON c.community_id = cp.community_id
            GROUP BY c.community_id ORDER BY c.genre
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get community posts
router.get('/:id/posts', auth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT cp.post_id, u.username, cp.post_text, cp.created_at,
                   COUNT(pl.like_id) as like_count,
                   MAX(CASE WHEN pl.user_id=$1 THEN 1 ELSE 0 END) as user_liked
            FROM community_posts cp
            JOIN users u ON cp.user_id = u.user_id
            LEFT JOIN post_likes pl ON cp.post_id = pl.post_id
            WHERE cp.community_id=$2
            GROUP BY cp.post_id, u.username
            ORDER BY cp.created_at DESC
        `, [req.user.user_id, req.params.id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create post
router.post('/:id/posts', auth, async (req, res) => {
    try {
        const result = await pool.query(`
            INSERT INTO community_posts (community_id, user_id, post_text)
            VALUES ($1, $2, $3) RETURNING post_id, post_text, created_at
        `, [req.params.id, req.user.user_id, req.body.text]);
        res.json({
            ...result.rows[0],
            username: req.user.username,
            like_count: 0,
            user_liked: false
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Like post
router.post('/posts/:postId/like', auth, async (req, res) => {
    try {
        const existing = await pool.query(
            'SELECT like_id FROM post_likes WHERE post_id=$1 AND user_id=$2',
            [req.params.postId, req.user.user_id]
        );
        if (existing.rows.length > 0) {
            await pool.query('DELETE FROM post_likes WHERE post_id=$1 AND user_id=$2',
                [req.params.postId, req.user.user_id]);
        } else {
            await pool.query('INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2)',
                [req.params.postId, req.user.user_id]);
        }
        const count = await pool.query('SELECT COUNT(*) FROM post_likes WHERE post_id=$1', [req.params.postId]);
        res.json({ liked: existing.rows.length === 0, count: parseInt(count.rows[0].count) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete post
router.delete('/posts/:postId', auth, async (req, res) => {
    try {
        await pool.query('DELETE FROM community_posts WHERE post_id=$1 AND user_id=$2',
            [req.params.postId, req.user.user_id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;