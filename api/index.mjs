import app from '../server/app.js';
import connectDB from '../server/config/db.js';

let dbInitPromise = null;

async function ensureDbConnected() {
  if (!dbInitPromise) {
    dbInitPromise = connectDB();
  }
  return dbInitPromise;
}

export default async function handler(req, res) {
  try {
    await ensureDbConnected();
    return app(req, res);
  } catch (error) {
    console.error('API bootstrap error:', error.message);
    return res.status(500).json({ message: 'Server failed to initialize database connection' });
  }
}
