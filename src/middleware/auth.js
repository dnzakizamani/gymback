import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { errorResponse } from '../utils/responseFormatter.js';
import prisma from '../config/database.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 401, 'UNAUTHORIZED', 'No token provided');
    }
    
    const token = authHeader.split(' ')[1];
    
    const decoded = jwt.verify(token, config.jwt.secret);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });
    
    if (!user) {
      return errorResponse(res, 401, 'UNAUTHORIZED', 'User not found');
    }
    
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 401, 'UNAUTHORIZED', 'Token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      return errorResponse(res, 401, 'UNAUTHORIZED', 'Invalid token');
    }
    return errorResponse(res, 500, 'INTERNAL_ERROR', 'Authentication error');
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });
    
    if (user) {
      req.user = user;
    }
    
    next();
  } catch (error) {
    next();
  }
};
