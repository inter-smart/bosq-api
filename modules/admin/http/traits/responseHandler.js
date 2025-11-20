class CustomError extends Error {
  constructor(message, status = 500, code = 'CUSTOM_ERROR', details = null) {
    super(message);
    this.name = 'CustomError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

const sendSuccessResponse = (res, data = null, message = 'Success', statusCode = 200) => {
  const response = {
    success: true,
    message,
    statusCode,
    timestamp: new Date().toISOString(),
  };
  if (data !== null) response.data = data;
  res.status(statusCode).json(response);
};

const sendCustomError = (res, message, status = 400, code = 'CUSTOM_ERROR', details = null) => {
  const error = new CustomError(message, status, code, details);
  sendErrorResponse(res, error);
};

const sendErrorResponse = (res, error, defaultMessage = 'Internal Server Error', defaultStatus = 500) => {
  if (!res || typeof res.status !== 'function') {
    console.error('Invalid response object:', error);
    return;
  }

  console.error('Error occurred:', {
    name: error?.name,
    message: error?.message,
    stack: error?.stack,
    timestamp: new Date().toISOString(),
  });

  let statusCode = defaultStatus;
  let errorMessage = defaultMessage;
  let errorCode = 'INTERNAL_ERROR';
  let errorDetails = null;

  switch (true) {
    case error instanceof CustomError:
      statusCode = error.status;
      errorMessage = error.message;
      errorCode = error.code;
      errorDetails = error.details;
      break;

    case typeof error === 'string':
      errorMessage = error;
      errorCode = defaultStatus === 409 ? 'CONFLICT' : 'INTERNAL_ERROR';
      break;

    case error?.array instanceof Function:
      statusCode = 422;
      errorMessage = 'Validation failed';
      errorCode = 'VALIDATION_ERROR';
      errorDetails = error.array().map(err => ({
        field: err.param,
        message: err.msg,
        value: err.value,
      }));
      break;

    case error?.name === 'SequelizeValidationError':
      statusCode = 422;
      errorMessage = 'Database validation failed';
      errorCode = 'DATABASE_VALIDATION_ERROR';
      errorDetails = error.errors.map(e => ({
        field: e.path,
        message: e.message,
        value: e.value,
      }));
      break;

    case error?.name === 'SequelizeUniqueConstraintError':
      statusCode = 409;
      errorMessage = 'Resource already exists';
      errorCode = 'DUPLICATE_RESOURCE';
      errorDetails = error.errors.map(e => ({
        field: e.path,
        message: `${e.path} must be unique`,
        value: e.value,
      }));
      break;

    case error?.name === 'SequelizeForeignKeyConstraintError':
      statusCode = 422;
      errorMessage = 'Invalid reference to related resource';
      errorCode = 'FOREIGN_KEY_ERROR';
      errorDetails = [{ field: error.index, message: 'Referenced resource does not exist' }];
      break;

    case error?.name === 'SequelizeConnectionError':
      statusCode = 503;
      errorMessage = 'Database connection failed';
      errorCode = 'DATABASE_CONNECTION_ERROR';
      break;

    case error?.name === 'JsonWebTokenError':
      statusCode = 401;
      errorMessage = 'Invalid token';
      errorCode = 'INVALID_TOKEN';
      break;

    case error?.name === 'TokenExpiredError':
      statusCode = 401;
      errorMessage = 'Token has expired';
      errorCode = 'TOKEN_EXPIRED';
      break;

    case error?.name === 'ValidationError':
      statusCode = 422;
      errorMessage = 'Validation failed';
      errorCode = 'MONGOOSE_VALIDATION_ERROR';
      errorDetails = Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message,
        value: error.errors[key].value,
      }));
      break;

    case error?.name === 'CastError':
      statusCode = 400;
      errorMessage = 'Invalid data format';
      errorCode = 'CAST_ERROR';
      errorDetails = [{
        field: error.path,
        message: `Invalid ${error.kind} format`,
        value: error.value,
      }];
      break;

    case error?.status || error?.statusCode:
      statusCode = error.status || error.statusCode;
      errorMessage = error.message || defaultMessage;
      errorCode = getErrorCodeFromStatus(statusCode);
      break;

    case error?.message:
      errorMessage = error.message;
      errorCode = 'UNKNOWN_ERROR';
      break;
  }

  const response = {
    success: false,
    error: {
      message: errorMessage,
      code: errorCode,
      statusCode,
      ...(errorDetails && { details: errorDetails }),
      ...(process.env.NODE_ENV === 'development' && { stack: error?.stack }),
    },
    timestamp: new Date().toISOString(),
  };

  res.status(statusCode).json(response);
};

const getErrorCodeFromStatus = (status) => {
  const statusCodes = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'UNPROCESSABLE_ENTITY',
    429: 'TOO_MANY_REQUESTS',
    500: 'INTERNAL_SERVER_ERROR',
    501: 'NOT_IMPLEMENTED',
    503: 'SERVICE_UNAVAILABLE',
  };
  return statusCodes[status] || 'UNKNOWN_ERROR';
};

// Utility error responders
const sendValidationError = (res, errors, message = 'Validation failed') =>
  sendErrorResponse(res, new CustomError(message, 422, 'VALIDATION_ERROR', errors));

const sendNotFoundError = (res, resource = 'Resource', message = null) =>
  sendErrorResponse(res, new CustomError(message || `${resource} not found`, 404, 'NOT_FOUND'));

const sendUnauthorizedError = (res, message = 'Unauthorized access') =>
  sendErrorResponse(res, new CustomError(message, 401, 'UNAUTHORIZED'));

const sendForbiddenError = (res, message = 'Access forbidden') =>
  sendErrorResponse(res, new CustomError(message, 403, 'FORBIDDEN'));

const sendConflictError = (res, resource = 'Resource', message = null) =>
  sendErrorResponse(res, new CustomError(message || `${resource} already exists`, 409, 'CONFLICT'));

module.exports = {
  CustomError,
  sendSuccessResponse,
  sendErrorResponse,
  sendCustomError,         
  sendValidationError,
  sendNotFoundError,
  sendUnauthorizedError,
  sendForbiddenError,
  sendConflictError,
};
