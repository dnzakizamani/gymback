import { validationResult } from 'express-validator';
import { errorResponse } from '../utils/responseFormatter.js';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const details = errors.array().map(err => ({
      field: err.path,
      message: err.msg
    }));
    
    return errorResponse(res, 400, 'VALIDATION_ERROR', 'Invalid input data', details);
  }
  
  next();
};
