import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import app from './app.js';
import User from './models/User.js';
import Score from './models/Score.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

const PORT = process.env.PORT || 5050;

const startServer = async () => {
  await connectDB();
  await User.createTable();
  await Score.createTable();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

startServer();
