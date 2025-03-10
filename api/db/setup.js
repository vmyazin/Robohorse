const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const setupDatabase = async () => {
    try {
        // Create scores table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS scores (
                id SERIAL PRIMARY KEY,
                name VARCHAR(6) NOT NULL,
                score INTEGER NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        console.log('Database setup completed successfully');
    } catch (err) {
        console.error('Error setting up database:', err);
    } finally {
        await pool.end();
    }
};

setupDatabase(); 