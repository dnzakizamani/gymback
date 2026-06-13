import { Router } from 'express';
import * as exerciseController from '../controllers/exerciseController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', optionalAuth, exerciseController.getAllExercises);
router.get('/:id', exerciseController.getExerciseById);

export default router;
