import express from 'express';
import {
  submitScore,
  getLeaderboard,
  getMyPerformance,
} from '../controllers/quizController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/leaderboard', authMiddleware, getLeaderboard);
router.get('/summary', authMiddleware, getMyPerformance);
router.post('/submit', authMiddleware, submitScore);

export default router;
