// server.js
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.get('/api/scores', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT name, score FROM scores ORDER BY score DESC LIMIT 10'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching scores:', err);
        res.status(500).json({ error: 'Failed to fetch scores' });
    }
});

app.post('/api/scores', async (req, res) => {
    const { name, score } = req.body;
    
    console.log('Received score submission:', { name, score, body: req.body });
    
    // Enhanced validation
    if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: 'Name is required' });
    }
    
    if (score === undefined || score === null) {
        return res.status(400).json({ error: 'Score is required' });
    }
    
    // Convert score to number if it's a string
    const numericScore = typeof score === 'string' ? parseInt(score, 10) : score;
    
    if (isNaN(numericScore)) {
        return res.status(400).json({ error: 'Score must be a valid number' });
    }
    
    try {
        await pool.query(
            'INSERT INTO scores (name, score) VALUES ($1, $2)',
            [name.trim(), numericScore]
        );
        res.status(201).json({ message: 'Score saved successfully' });
    } catch (err) {
        console.error('Error saving score:', err);
        res.status(500).json({ error: 'Failed to save score', details: err.message });
    }
});

// Catch-all route to serve index.html for any non-API routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}); 