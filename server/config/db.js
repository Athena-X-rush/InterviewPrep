import pg from 'pg';
const { Pool } = pg;

let pool = null;

const connectDB = async () => {
  if (pool) {
    return pool;
  }

  try {
    const postgresUri = process.env.POSTGRES_URI || 'postgresql://postgres:postgres@localhost:5432/aiquiz';
    
    pool = new Pool({
      connectionString: postgresUri,
    });

    await pool.query('SELECT NOW()');
    console.log('PostgreSQL connected successfully');
    return pool;
  } catch (error) {
    console.error('PostgreSQL connection error:', error.message);
    console.error('Set a valid POSTGRES_URI in your env');
    throw error;
  }
};

export default connectDB;
