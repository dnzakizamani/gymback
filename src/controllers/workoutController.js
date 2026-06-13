import * as workoutService from '../services/workoutService.js';
import { successResponse, successWithMessage, paginatedResponse } from '../utils/responseFormatter.js';

export const getWorkouts = async (req, res, next) => {
  try {
    const { userExerciseId, page, limit } = req.query;
    const result = await workoutService.getWorkouts(req.user.id, {
      userExerciseId,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10
    });
    paginatedResponse(res, result.data, result.pagination);
  } catch (error) {
    next(error);
  }
};

export const getWorkoutById = async (req, res, next) => {
  try {
    const workout = await workoutService.getWorkoutById(req.user.id, req.params.id);
    successResponse(res, workout);
  } catch (error) {
    next(error);
  }
};

export const createWorkout = async (req, res, next) => {
  try {
    const workout = await workoutService.createWorkout(req.user.id, req.body);
    successResponse(res, workout, 201);
  } catch (error) {
    next(error);
  }
};

export const updateWorkout = async (req, res, next) => {
  try {
    const workout = await workoutService.updateWorkout(req.user.id, req.params.id, req.body);
    successResponse(res, workout);
  } catch (error) {
    next(error);
  }
};

export const deleteWorkout = async (req, res, next) => {
  try {
    await workoutService.deleteWorkout(req.user.id, req.params.id);
    successWithMessage(res, 'Workout deleted successfully');
  } catch (error) {
    next(error);
  }
};
