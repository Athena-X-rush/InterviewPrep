import express from 'express';
import { generateResumeQuestions, generateDocumentQuestions, generateQuestions, generateQuizQuestions, askFollowUp, evaluateAnswer } from '../controllers/aiController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/generate-resume-questions', authMiddleware, generateResumeQuestions);
router.post('/generate-document-questions', authMiddleware, generateDocumentQuestions);
router.post('/generate-questions', authMiddleware, generateQuestions);
router.post('/generate-quiz-questions', authMiddleware, generateQuizQuestions);
router.post('/follow-up', authMiddleware, askFollowUp);
router.post('/evaluate-answer', authMiddleware, evaluateAnswer);

export default router;