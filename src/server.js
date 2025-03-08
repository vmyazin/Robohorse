// src/server.js
// Express server configuration for Robohorse game

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

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

app.get('/legacy', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'gallop-protocol-game.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
}); 