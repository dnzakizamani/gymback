import { Router } from 'express';
import { body } from 'express-validator';
import * as userExerciseController from '../controllers/userExerciseController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(authenticate);

router.get('/', userExerciseController.getUserExercises);

router.post(
  '/',
  [
    body('exerciseId').notEmpty().withMessage('Exercise ID is required')
  ],
  validate,
  userExerciseController.addUserExercise
);

router.put(
  '/:id',
  [
    body('customName').optional().isString(),
    body('notes').optional().isString()
  ],
  validate,
  userExerciseController.updateUserExercise
);

router.delete('/:id', userExerciseController.deleteUserExercise);

export default router;
