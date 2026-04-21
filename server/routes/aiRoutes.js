import express from 'express';
import { generateResumeQuestions, generateQuestions, askFollowUp } from '../controllers/aiController.js';

const router = express.Router();

router.post('/generate-resume-questions', generateResumeQuestions);
router.post('/generate-questions', generateQuestions);
router.post('/follow-up', askFollowUp);

export default router;