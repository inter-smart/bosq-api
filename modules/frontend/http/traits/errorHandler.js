
// ============================================
// Reusable Error Handler
// ============================================

const { ApiResponse } = require('./response');
const { HTTP_STATUS, RESPONSE_MESSAGES, ERROR_CODES } = require('./constants');

class ErrorHandler {
    
    /**
     * Handle controller errors with standardized responses
     * @param {object} error - Error object
     * @param {object} res - Express response object
     * @param {string} context - Context where error occurred (optional)
     */
    static handleControllerError(error, res, context = 'operation') {
        
        // Log error for debugging
        this.logError(error, context);
        
        // Handle specific database errors
        if (error.name === 'SequelizeConnectionError') {
            return ApiResponse.error(res, {
                message: RESPONSE_MESSAGES.ERROR.DATABASE_CONNECTION,
                status: HTTP_STATUS.SERVICE_UNAVAILABLE,
                error_code: ERROR_CODES.DB_CONNECTION_ERROR
            });
        }
        
        if (error.name === 'SequelizeTimeoutError') {
            return ApiResponse.error(res, {
                message: RESPONSE_MESSAGES.ERROR.DATABASE_TIMEOUT,
                status: HTTP_STATUS.REQUEST_TIMEOUT,
                error_code: ERROR_CODES.DB_TIMEOUT_ERROR
            });
        }
        
        if (error.name === 'SequelizeValidationError') {
            return ApiResponse.error(res, {
                message: RESPONSE_MESSAGES.ERROR.VALIDATION_FAILED,
                status: HTTP_STATUS.BAD_REQUEST,
                error_code: ERROR_CODES.VALIDATION_ERROR,
                errors: error.errors?.map(err => ({
                    field: err.path,
                    message: err.message
                }))
            });
        }
        
        if (error.name === 'SequelizeUniqueConstraintError') {
            return ApiResponse.error(res, {
                message: RESPONSE_MESSAGES.ERROR.DUPLICATE_ENTRY,
                status: HTTP_STATUS.CONFLICT,
                error_code: ERROR_CODES.DUPLICATE_ERROR
            });
        }
        
        // Handle JWT errors
        if (error.name === 'JsonWebTokenError') {
            return ApiResponse.error(res, {
                message: RESPONSE_MESSAGES.ERROR.TOKEN_INVALID,
                status: HTTP_STATUS.UNAUTHORIZED,
                error_code: ERROR_CODES.AUTH_ERROR
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return ApiResponse.error(res, {
                message: RESPONSE_MESSAGES.ERROR.TOKEN_EXPIRED,
                status: HTTP_STATUS.UNAUTHORIZED,
                error_code: ERROR_CODES.AUTH_ERROR
            });
        }
        
        // Handle custom application errors
        if (error.isOperational) {
            return ApiResponse.error(res, {
                message: error.message,
                status: error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR,
                error_code: error.errorCode || ERROR_CODES.INTERNAL_ERROR
            });
        }
        
        // Handle fetch/service errors
        if (error.message && error.message.includes('Failed to fetch')) {
            return ApiResponse.error(res, {
                message: RESPONSE_MESSAGES.ERROR.DATA_FETCH_FAILED,
                status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
                error_code: ERROR_CODES.DATA_FETCH_ERROR
            });
        }
        
        // Generic error handling
        if (process.env.NODE_ENV === 'development') {
            return ApiResponse.error(res, {
                message: error.message || RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER,
                status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
                error_code: ERROR_CODES.INTERNAL_ERROR,
                errors: {
                    stack: error.stack,
                    name: error.name
                }
            });
        } else {
            // Production - don't expose internal details
            return ApiResponse.error(res, {
                message: RESPONSE_MESSAGES.ERROR.INTERNAL_SERVER,
                status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
                error_code: ERROR_CODES.INTERNAL_ERROR
            });
        }
    }
    
    /**
     * Create custom application error
     * @param {string} message - Error message
     * @param {number} statusCode - HTTP status code
     * @param {string} errorCode - Application error code
     */
    static createError(message, statusCode = 500, errorCode = ERROR_CODES.INTERNAL_ERROR) {
        const error = new Error(message);
        error.statusCode = statusCode;
        error.errorCode = errorCode;
        error.isOperational = true;
        return error;
    }
    
    /**
     * Log error for debugging
     * @param {object} error - Error object
     * @param {string} context - Context where error occurred
     */
    static logError(error, context = 'unknown') {
        const errorLog = {
            context,
            message: error.message,
            name: error.name,
            stack: error.stack,
            timestamp: new Date().toISOString()
        };
        
        // In production, you might want to use a proper logging service
        console.error(`[ERROR] ${context}:`, errorLog);
        
        // Here you could integrate with logging services like:
        // - Winston
        // - Bunyan
        // - Pino
        // - External services like LogRocket, Sentry, etc.
    }
    
    /**
     * Async wrapper for controller methods
     * @param {function} fn - Controller function
     * @param {string} context - Context name for error logging
     */
    static asyncWrapper(fn, context = 'controller') {
        return (req, res, next) => {
            Promise.resolve(fn(req, res, next))
                .catch(error => this.handleControllerError(error, res, context));
        };
    }
}

module.exports = { ErrorHandler };