// src/api/scores.js
// API module for score-related operations

const { query } = require('../db');

// Get all scores
const getAllScores = async () => {
  try {
    const result = await query('SELECT * FROM scores ORDER BY score DESC');
    return result.rows;
  } catch (error) {
    console.error('Error fetching scores:', error);
    throw error;
  }
};

// Get scores by game_id
const getScoresByGame = async (gameId) => {
  try {
    const result = await query('SELECT * FROM scores WHERE game_id = $1 ORDER BY score DESC', [gameId]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching scores by game:', error);
    throw error;
  }
};

// Add a new score
const addScore = async (gameId, playerId, score) => {
  try {
    const result = await query(
      'INSERT INTO scores (game_id, player_id, score) VALUES ($1, $2, $3) RETURNING *',
      [gameId, playerId, score]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error adding score:', error);
    throw error;
  }
};

module.exports = {
  getAllScores,
  getScoresByGame,
  addScore,
}; 