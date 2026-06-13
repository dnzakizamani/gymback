import * as statsService from '../services/statsService.js';
import { successResponse } from '../utils/responseFormatter.js';

export const getExerciseProgress = async (req, res, next) => {
  try {
    const progress = await statsService.getExerciseProgress(req.user.id, req.params.userExerciseId);
    successResponse(res, progress);
  } catch (error) {
    next(error);
  }
};

export const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await statsService.getDashboardStats(req.user.id);
    successResponse(res, stats);
  } catch (error) {
    next(error);
  }
};

export const getPersonalRecord = async (req, res, next) => {
  try {
    const pr = await statsService.getPersonalRecord(req.user.id, req.params.userExerciseId);
    successResponse(res, pr);
  } catch (error) {
    next(error);
  }
};
