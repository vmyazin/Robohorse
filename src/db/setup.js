// src/db/setup.js
// Database setup script to create the scores table

const { pool } = require('./index');

// SQL query to create the scores table
const createScoresTable = `
  CREATE TABLE IF NOT EXISTS scores (
    id SERIAL PRIMARY KEY,
    game_id VARCHAR(255) NOT NULL,
    player_id VARCHAR(255) NOT NULL,
    score INTEGER NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

// Execute the query to create the table
async function setupDatabase() {
  try {
    await pool.query(createScoresTable);
    console.log('Scores table created successfully');
    
    // Close the pool after setup
    pool.end();
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

// Run the setup
setupDatabase(); 