import { errorResponse } from '../utils/responseFormatter.js';

export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.isOperational) {
    return errorResponse(res, err.statusCode, getErrorCode(err.statusCode), err.message, err.details);
  }

  return errorResponse(res, 500, 'INTERNAL_ERROR', 'Something went wrong');
};

const getErrorCode = (statusCode) => {
  const codes = {
    400: 'VALIDATION_ERROR',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    500: 'INTERNAL_ERROR'
  };
  return codes[statusCode] || 'INTERNAL_ERROR';
};
