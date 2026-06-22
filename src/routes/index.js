import { Router } from 'express';
import authRoutes from './auth.js';
import exerciseRoutes from './exercises.js';
import userExerciseRoutes from './userExercises.js';
import workoutRoutes from './workouts.js';
import statsRoutes from './stats.js';
import analyticsRoutes from './analytics.js';
import * as exerciseController from '../controllers/exerciseController.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/exercises', exerciseRoutes);
router.use('/user-exercises', userExerciseRoutes);
router.use('/workouts', workoutRoutes);
router.use('/stats', statsRoutes);
router.use('/analytics', analyticsRoutes);

// Master data top-level routes
router.get('/muscle-groups', exerciseController.getAllMuscleGroups);
router.get('/equipment', exerciseController.getAllEquipment);

// Aliases for stats routes
router.use('/progress', statsRoutes);

export default router;
