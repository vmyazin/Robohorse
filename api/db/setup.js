import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

console.log('Database URL:', process.env.DATABASE_URL ? 'Set (value hidden)' : 'Not set');

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const setupDatabase = async () => {
    try {
        console.log('Testing database connection...');
        const testResult = await pool.query('SELECT NOW()');
        console.log('Database connection successful:', testResult.rows[0]);
        
        console.log('Creating scores table if it does not exist...');
        // Create scores table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS scores (
                id SERIAL PRIMARY KEY,
                name VARCHAR(6) NOT NULL,
                score INTEGER NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Check if the table was created successfully
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'scores'
            )
        `);
        
        if (tableCheck.rows[0].exists) {
            console.log('Scores table exists or was created successfully');
        } else {
            console.error('Failed to create scores table');
        }
        
        console.log('Database setup completed successfully');
    } catch (err) {
        console.error('Error setting up database:', err);
        process.exit(1);
    } finally {
        await pool.end();
    }
};

setupDatabase(); 