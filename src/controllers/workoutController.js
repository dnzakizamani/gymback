import * as workoutService from '../services/workoutService.js';
import { successResponse, successWithMessage, paginatedResponse } from '../utils/responseFormatter.js';
import ApiError from '../utils/ApiError.js';

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

export const getWorkoutCalendar = async (req, res, next) => {
  try {
    const { year, month } = req.query;

    if (!year || !month) {
      throw ApiError.badRequest('year and month parameters are required');
    }

    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      throw ApiError.badRequest('Invalid year or month parameter');
    }

    const days = await workoutService.getWorkoutDaysForMonth(req.user.id, yearNum, monthNum);
    successResponse(res, days);
  } catch (error) {
    next(error);
  }
};

export const getWorkoutsByDate = async (req, res, next) => {
  try {
    const { date } = req.query;

    if (!date) {
      throw ApiError.badRequest('date parameter is required');
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      throw ApiError.badRequest('Invalid date format. Use YYYY-MM-DD');
    }

    const workouts = await workoutService.getWorkoutsByDate(req.user.id, date);
    successResponse(res, workouts);
  } catch (error) {
    next(error);
  }
};
