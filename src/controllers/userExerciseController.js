import * as userExerciseService from '../services/userExerciseService.js';
import { successResponse, successWithMessage } from '../utils/responseFormatter.js';

export const getUserExercises = async (req, res, next) => {
  try {
    const { muscleGroup, includeStats } = req.query;
    const exercises = await userExerciseService.getUserExercises(req.user.id, {
      muscleGroup,
      includeStats: includeStats === 'true'
    });
    successResponse(res, exercises);
  } catch (error) {
    next(error);
  }
};

export const addUserExercise = async (req, res, next) => {
  try {
    const userExercise = await userExerciseService.addUserExercise(req.user.id, req.body);
    successResponse(res, userExercise, 201);
  } catch (error) {
    next(error);
  }
};

export const updateUserExercise = async (req, res, next) => {
  try {
    const userExercise = await userExerciseService.updateUserExercise(
      req.user.id,
      req.params.id,
      req.body
    );
    successResponse(res, userExercise);
  } catch (error) {
    next(error);
  }
};

export const deleteUserExercise = async (req, res, next) => {
  try {
    await userExerciseService.deleteUserExercise(req.user.id, req.params.id);
    successWithMessage(res, 'Exercise removed from your list');
  } catch (error) {
    next(error);
  }
};
