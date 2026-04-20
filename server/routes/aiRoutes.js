import express from 'express';
import { askFollowUp } from '../controllers/aiController.js';

const router = express.Router();

router.post('/follow-up', askFollowUp);

export default router;
