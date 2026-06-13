import * as exerciseService from '../services/exerciseService.js';
import { successResponse, paginatedResponse } from '../utils/responseFormatter.js';

export const getAllExercises = async (req, res, next) => {
  try {
    const { muscleGroup, equipment, search, page, limit } = req.query;
    const result = await exerciseService.getAllExercises({
      muscleGroup,
      equipment,
      search,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20
    });
    paginatedResponse(res, result.data, result.pagination);
  } catch (error) {
    next(error);
  }
};

export const getExerciseById = async (req, res, next) => {
  try {
    const exercise = await exerciseService.getExerciseById(req.params.id);
    successResponse(res, exercise);
  } catch (error) {
    next(error);
  }
};

export const getAllMuscleGroups = async (req, res, next) => {
  try {
    const muscleGroups = await exerciseService.getAllMuscleGroups();
    successResponse(res, muscleGroups);
  } catch (error) {
    next(error);
  }
};

export const getAllEquipment = async (req, res, next) => {
  try {
    const equipment = await exerciseService.getAllEquipment();
    successResponse(res, equipment);
  } catch (error) {
    next(error);
  }
};
