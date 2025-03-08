// src/test-api.js
// Script to test the scores API endpoints

const fetch = require('node-fetch');
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}/api/scores`;

// Test data
const testScores = [
  {
    gameId: 'test-game-1',
    playerId: 'player-123',
    score: 5000
  },
  {
    gameId: 'test-game-1',
    playerId: 'player-456',
    score: 7500
  },
  {
    gameId: 'test-game-2',
    playerId: 'player-789',
    score: 3000
  }
];

// Function to add a score
async function addScore(scoreData) {
  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(scoreData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Score added successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Error adding score:', error);
  }
}

// Function to get all scores
async function getAllScores() {
  try {
    const response = await fetch(BASE_URL);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ All scores retrieved successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ Error getting all scores:', error);
  }
}

// Function to get scores by game ID
async function getScoresByGame(gameId) {
  try {
    const response = await fetch(`${BASE_URL}/${gameId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✅ Scores for game ${gameId} retrieved successfully:`, data);
    return data;
  } catch (error) {
    console.error(`❌ Error getting scores for game ${gameId}:`, error);
  }
}

// Run the tests
async function runTests() {
  console.log('🧪 Starting API tests...');
  
  // Add multiple test scores
  for (const scoreData of testScores) {
    await addScore(scoreData);
  }
  
  // Get all scores
  await getAllScores();
  
  // Get scores for specific games
  await getScoresByGame('test-game-1');
  await getScoresByGame('test-game-2');
  
  console.log('🧪 API tests completed.');
}

runTests(); 