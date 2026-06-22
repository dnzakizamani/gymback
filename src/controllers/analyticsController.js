import * as analyticsService from '../services/analyticsService.js';
import { successResponse } from '../utils/responseFormatter.js';

export const getOverview = async (req, res, next) => {
  try {
    const data = await analyticsService.getAnalyticsOverview(req.user.id);
    successResponse(res, data);
  } catch (error) {
    next(error);
  }
};

export const getPersonalRecords = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const data = await analyticsService.getPersonalRecords(req.user.id, limit);
    successResponse(res, data);
  } catch (error) {
    next(error);
  }
};

export const getVolumeChart = async (req, res, next) => {
  try {
    const { period = 'monthly', months = 6 } = req.query;
    const data = await analyticsService.getVolumeChart(
      req.user.id,
      period,
      parseInt(months)
    );
    successResponse(res, data);
  } catch (error) {
    next(error);
  }
};

export const getFrequency = async (req, res, next) => {
  try {
    const data = await analyticsService.getWorkoutFrequency(req.user.id);
    successResponse(res, data);
  } catch (error) {
    next(error);
  }
};

export const getWeeklyFrequency = async (req, res, next) => {
  try {
    const data = await analyticsService.getWeeklyFrequency(req.user.id);
    successResponse(res, data);
  } catch (error) {
    next(error);
  }
};

export const getMuscleDistribution = async (req, res, next) => {
  try {
    const data = await analyticsService.getMuscleDistribution(req.user.id);
    successResponse(res, data);
  } catch (error) {
    next(error);
  }
};
