// src/server.js
// Express server configuration for Robohorse game

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import scores API
const scoresApi = require('./api/scores');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/playtest', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'playtest.html'));
});

app.get('/test/scoreboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'scoreboard-test.html'));
});

app.get('/legacy', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'gallop-protocol-game.html'));
});

app.get('/scoreboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'scoreboard.html'));
});

// Scores API endpoints
app.get('/api/scores', async (req, res, next) => {
  try {
    const scores = await scoresApi.getAllScores();
    res.json(scores);
  } catch (error) {
    next(error);
  }
});

app.get('/api/scores/:gameId', async (req, res, next) => {
  try {
    const scores = await scoresApi.getScoresByGame(req.params.gameId);
    res.json(scores);
  } catch (error) {
    next(error);
  }
});

app.post('/api/scores', async (req, res, next) => {
  try {
    const { gameId, playerId, score } = req.body;
    
    if (!gameId || !playerId || score === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const newScore = await scoresApi.addScore(gameId, playerId, score);
    res.status(201).json(newScore);
  } catch (error) {
    next(error);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
}); 