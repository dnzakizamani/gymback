import { Router } from 'express';
import { body } from 'express-validator';
import * as workoutController from '../controllers/workoutController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(authenticate);

router.get('/', workoutController.getWorkouts);
router.get('/:id', workoutController.getWorkoutById);

router.post(
  '/',
  [
    body('userExerciseId').notEmpty().withMessage('User exercise ID is required'),
    body('workoutDate').notEmpty().withMessage('Workout date is required'),
    body('sets').isArray({ min: 1 }).withMessage('At least one set is required'),
    body('sets.*.setNumber').isInt({ min: 1 }).withMessage('Set number must be a positive integer'),
    body('sets.*.weight').isFloat({ gt: 0 }).withMessage('Weight must be greater than 0'),
    body('sets.*.reps').isInt({ min: 1 }).withMessage('Reps must be a positive integer')
  ],
  validate,
  workoutController.createWorkout
);

router.put(
  '/:id',
  [
    body('workoutDate').optional().notEmpty(),
    body('sets').optional().isArray({ min: 1 }),
    body('sets.*.setNumber').optional().isInt({ min: 1 }),
    body('sets.*.weight').optional().isFloat({ gt: 0 }),
    body('sets.*.reps').optional().isInt({ min: 1 })
  ],
  validate,
  workoutController.updateWorkout
);

router.delete('/:id', workoutController.deleteWorkout);

export default router;
