import getPool from '../config/db.js';

const Score = {
  async createTable() {
    const pool = await getPool();
    await pool.query(`
      CREATE TABLE IF NOT EXISTS scores (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        value NUMERIC NOT NULL,
        activity_type VARCHAR(20) DEFAULT 'quiz' CHECK (activity_type IN ('quiz', 'interview')),
        topic VARCHAR(255) DEFAULT 'General',
        difficulty VARCHAR(50) DEFAULT 'medium',
        mode_name VARCHAR(255) DEFAULT '',
        total_questions INTEGER DEFAULT 0,
        correct_answers INTEGER DEFAULT 0,
        accuracy NUMERIC DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  },

  async create(data) {
    const pool = await getPool();
    const result = await pool.query(
      `INSERT INTO scores (user_id, value, activity_type, topic, difficulty, mode_name, total_questions, correct_answers, accuracy)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [data.user, data.value, data.activityType, data.topic, data.difficulty, data.modeName, data.totalQuestions, data.correctAnswers, data.accuracy]
    );
    return {
      _id: result.rows[0].id,
      ...result.rows[0]
    };
  },

  async find(query) {
    const pool = await getPool();
    let sql = 'SELECT * FROM scores';
    const params = [];

    if (query.user) {
      sql += ' WHERE user_id = $1';
      params.push(query.user);
      sql += ' ORDER BY created_at DESC';
      sql += ' LIMIT $2';
      params.push(query.limit || 8);
    }

    const result = await pool.query(sql, params);
    return result.rows.map(row => ({
      _id: row.id,
      ...row
    }));
  },

  async aggregate(pipeline) {
    const pool = await getPool();

    const matchStage = pipeline.find(stage => stage.$match);
    const groupStage = pipeline.find(stage => stage.$group);

    if (matchStage && matchStage.$match.user) {
      const userId = matchStage.$match.user;
      const result = await pool.query(`
        SELECT
          SUM(s.value) as totalPoints,
          COUNT(*) as attempts,
          SUM(CASE WHEN s.activity_type = 'quiz' THEN 1 ELSE 0 END) as quizAttempts,
          SUM(CASE WHEN s.activity_type = 'interview' THEN 1 ELSE 0 END) as interviewAttempts,
          AVG(s.accuracy) as averageAccuracy
        FROM scores s
        WHERE s.user_id = $1
      `, [userId]);

      return result.rows.map(row => ({
        _id: userId,
        totalPoints: Number(row.totalpoints) || 0,
        attempts: Number(row.attempts) || 0,
        quizAttempts: Number(row.quizattempts) || 0,
        interviewAttempts: Number(row.interviewattempts) || 0,
        averageAccuracy: Number(row.averageaccuracy) || 0
      }));
    }

    if (groupStage && groupStage.$group._id === '$user') {
      const result = await pool.query(`
        SELECT
          s.user_id as _id,
          u.name,
          SUM(s.value) as totalPoints,
          COUNT(*) as attempts,
          SUM(CASE WHEN s.activity_type = 'quiz' THEN 1 ELSE 0 END) as quizAttempts,
          SUM(CASE WHEN s.activity_type = 'interview' THEN 1 ELSE 0 END) as interviewAttempts,
          AVG(s.accuracy) as averageAccuracy,
          MAX(s.value) as bestScore,
          MAX(s.created_at) as recentActivityAt
        FROM scores s
        JOIN users u ON s.user_id = u.id
        GROUP BY s.user_id, u.name
        ORDER BY (SUM(s.value) * 0.65 + AVG(s.accuracy) * 0.35) DESC,
                 SUM(s.value) DESC,
                 AVG(s.accuracy) DESC,
                 MAX(s.value) DESC,
                 MAX(s.created_at) DESC
      `);

      return result.rows.map(row => ({
        _id: row._id,
        user: { name: row.name },
        totalPoints: Number(row.totalpoints),
        attempts: Number(row.attempts),
        quizAttempts: Number(row.quizattempts),
        interviewAttempts: Number(row.interviewattempts),
        averageAccuracy: Number(row.averageaccuracy),
        bestScore: Number(row.bestscore),
        recentActivityAt: row.recentactivityat,
        rankingScore: Math.round((Number(row.totalpoints) * 0.65 + Number(row.averageaccuracy) * 0.35))
      }));
    }

    return [];
  }
};

export default Score;