// server.js
import express from 'express';
import cors from 'cors';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { dirname } from 'path';

// Initialize environment variables
dotenv.config();

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { Pool } = pg;
const app = express();
const port = process.env.PORT || 4270;

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Always use SSL with Neon database
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Database connection error:', err.stack);
    } else {
        console.log('Database connected successfully:', res.rows[0]);
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.get('/api/scores', async (req, res) => {
    try {
        console.log('GET /api/scores - Fetching scores from database');
        const result = await pool.query(
            'SELECT player_id as name, score FROM scores WHERE game_id = $1 ORDER BY score DESC LIMIT 10',
            ['robohorse-v1']
        );
        console.log('GET /api/scores - Fetched scores:', result.rows);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching scores:', err);
        res.status(500).json({ error: 'Failed to fetch scores', details: err.message });
    }
});

// Route to get scores for a specific game (used by test pages)
app.get('/api/scores/:gameId', async (req, res) => {
    const { gameId } = req.params;
    
    try {
        console.log(`GET /api/scores/${gameId} - Fetching scores for game: ${gameId}`);
        const result = await pool.query(
            'SELECT player_id as name, score FROM scores WHERE game_id = $1 ORDER BY score DESC LIMIT 10',
            [gameId]
        );
        console.log(`GET /api/scores/${gameId} - Fetched scores:`, result.rows);
        res.json(result.rows);
    } catch (err) {
        console.error(`Error fetching scores for game ${gameId}:`, err);
        res.status(500).json({ error: 'Failed to fetch scores', details: err.message });
    }
});

app.post('/api/scores', async (req, res) => {
    // Check if this is a test page request with gameId and playerId
    if (req.body.gameId && req.body.playerId) {
        const { gameId, playerId, score } = req.body;
        
        console.log('POST /api/scores - Received test data:', { gameId, playerId, score });
        
        // Basic validation for test page
        if (!gameId || !playerId || !score) {
            console.error('Invalid test score data:', { gameId, playerId, score });
            return res.status(400).json({ error: 'Invalid score data' });
        }
        
        try {
            await pool.query(
                'INSERT INTO scores (game_id, player_id, score) VALUES ($1, $2, $3)',
                [gameId, playerId.trim(), parseInt(score, 10)]
            );
            console.log('POST /api/scores - Test score saved successfully');
            res.status(201).json({ message: 'Score saved successfully' });
        } catch (err) {
            console.error('Error saving test score:', err);
            res.status(500).json({ error: 'Failed to save score', details: err.message });
        }
    } else {
        // This is a main game request
        const { name, score } = req.body;
        
        console.log('POST /api/scores - Received game data:', { name, score });
        
        // Basic validation for main game
        if (!name || !score || typeof score !== 'string') {
            console.error('Invalid game score data:', { name, score, scoreType: typeof score });
            return res.status(400).json({ error: 'Invalid score data' });
        }
        
        try {
            await pool.query(
                'INSERT INTO scores (game_id, player_id, score) VALUES ($1, $2, $3)',
                ['robohorse-v1', name.trim(), parseInt(score, 10)]
            );
            console.log('POST /api/scores - Game score saved successfully');
            res.status(201).json({ message: 'Score saved successfully' });
        } catch (err) {
            console.error('Error saving game score:', err);
            res.status(500).json({ error: 'Failed to save score', details: err.message });
        }
    }
});

// Catch-all route to serve index.html for any non-API routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err.stack);
    res.status(500).json({ error: 'Something broke!', details: err.message });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}); 