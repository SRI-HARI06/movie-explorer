const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');

// Register
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING user_id, username, email',
            [username, email, hashedPassword]
        );
        const user = result.rows[0];
        const token = jwt.sign({ user_id: user.user_id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user });
    } catch (err) {
        if (err.code === '23505') {
            res.status(400).json({ error: 'Username or email already exists!' });
        } else {
            res.status(500).json({ error: err.message });
        }
    }
});

// Login
router.post('/login', async (req, res) => {
    const { login, password } = req.body;
    try {
        // Accept either username or email
        const result = await pool.query(
            'SELECT * FROM users WHERE email=$1 OR username=$1',
            [login]
        );
        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid username/email or password!' });
        }
        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid email or password!' });
        }
        const token = jwt.sign({ user_id: user.user_id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { user_id: user.user_id, username: user.username, email: user.email, created_at: user.created_at } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;