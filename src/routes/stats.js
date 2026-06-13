import { Router } from 'express';
import * as statsController from '../controllers/statsController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/dashboard', statsController.getDashboardStats);
router.get('/exercise/:userExerciseId', statsController.getExerciseProgress);
router.get('/pr/:userExerciseId', statsController.getPersonalRecord);

export default router;
