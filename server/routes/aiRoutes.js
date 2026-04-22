import express from 'express';
import { generateResumeQuestions, generateDocumentQuestions, generateQuestions, generateQuizQuestions, askFollowUp, evaluateAnswer } from '../controllers/aiController.js';

const router = express.Router();

router.post('/generate-resume-questions', generateResumeQuestions);
router.post('/generate-document-questions', generateDocumentQuestions);
router.post('/generate-questions', generateQuestions);
router.post('/generate-quiz-questions', generateQuizQuestions);
router.post('/follow-up', askFollowUp);
router.post('/evaluate-answer', evaluateAnswer);

export default router;