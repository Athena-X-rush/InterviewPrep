import bcrypt from 'bcryptjs';
import getPool from '../config/db.js';

const User = {
  async createTable() {
    const pool = await getPool();
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  },

  async findOne(query) {
    const pool = await getPool();
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [query.email]);
    if (result.rows.length === 0) return null;
    return {
      _id: result.rows[0].id,
      ...result.rows[0],
      matchPassword: async function(enteredPassword) {
        return bcrypt.compare(enteredPassword, this.password);
      }
    };
  },

  async findById(id) {
    const pool = await getPool();
    const result = await pool.query('SELECT id, name, email, created_at FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;
    return {
      _id: result.rows[0].id,
      name: result.rows[0].name,
      email: result.rows[0].email,
      created_at: result.rows[0].created_at
    };
  },

  async create(data) {
    const pool = await getPool();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);
    const result = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *',
      [data.name, data.email, hashedPassword]
    );
    return {
      _id: result.rows[0].id,
      ...result.rows[0]
    };
  }
};

export default User;
