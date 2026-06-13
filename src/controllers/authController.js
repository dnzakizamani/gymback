import * as authService from '../services/authService.js';
import { successResponse, successWithMessage } from '../utils/responseFormatter.js';
import config from '../config/index.js';

export const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    successResponse(res, result, 201);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    successResponse(res, result);
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    successWithMessage(res, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.user.id);
    successResponse(res, user);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const user = await authService.updateProfile(req.user.id, req.body);
    successResponse(res, user);
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    await authService.changePassword(req.user.id, req.body);
    successWithMessage(res, 'Password updated successfully');
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// GOOGLE AUTH
// ============================================================================

export const getGoogleAuthUrl = async (req, res, next) => {
  try {
    const url = authService.getGoogleAuthUrl();
    successResponse(res, { url });
  } catch (error) {
    next(error);
  }
};

export const handleGoogleCallback = async (req, res, next) => {
  try {
    const { code } = req.query;
    const result = await authService.handleGoogleCallback(code);

    // Redirect to frontend with token
    res.redirect(`${config.google.frontendUrl}/auth/callback?token=${result.token}`);
  } catch (error) {
    console.error('Google auth error:', error);
    // Redirect to frontend with error
    res.redirect(`${config.google.frontendUrl}/login?error=google_auth_failed`);
  }
};
