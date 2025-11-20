// ============================================
// Response Constants
// ============================================

const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    REQUEST_TIMEOUT: 408,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504
};

const RESPONSE_MESSAGES = {
    SUCCESS: {
        DATA_RETRIEVED: 'Data retrieved successfully',
        DATA_CREATED: 'Data created successfully',
        DATA_UPDATED: 'Data updated successfully',
        DATA_DELETED: 'Data deleted successfully',
        OPERATION_SUCCESSFUL: 'Operation completed successfully',
        LOGIN_SUCCESSFUL: 'Login successful',
        LOGOUT_SUCCESSFUL: 'Logout successful',
        STATS_RETRIEVED: 'Statistics retrieved successfully',
        FEATURED_RETRIEVED: 'Featured items retrieved successfully',
        SEARCH_COMPLETED: 'Search completed successfully'
    },
    ERROR: {
        INTERNAL_SERVER: 'Internal server error occurred',
        DATABASE_CONNECTION: 'Database connection failed',
        DATABASE_TIMEOUT: 'Database operation timed out',
        DATA_FETCH_FAILED: 'Failed to fetch data',
        DATA_NOT_FOUND: 'Requested data not found',
        UNAUTHORIZED_ACCESS: 'Unauthorized access',
        FORBIDDEN_ACCESS: 'Access forbidden',
        VALIDATION_FAILED: 'Validation failed',
        DUPLICATE_ENTRY: 'Duplicate entry found',
        INVALID_CREDENTIALS: 'Invalid credentials provided',
        TOKEN_EXPIRED: 'Authentication token expired',
        TOKEN_INVALID: 'Invalid authentication token',
        SEARCH_QUERY_TOO_SHORT: 'Search query must be at least 2 characters long',
        INVALID_PARAMETERS: 'Invalid parameters provided',
        RATE_LIMIT_EXCEEDED: 'Too many requests, please try again later',
        SERVICE_UNAVAILABLE: 'Service temporarily unavailable'
    }
};

const ERROR_CODES = {
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    DB_CONNECTION_ERROR: 'DB_CONNECTION_ERROR',
    DB_TIMEOUT_ERROR: 'DB_TIMEOUT_ERROR',
    DATA_FETCH_ERROR: 'DATA_FETCH_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    AUTH_ERROR: 'AUTH_ERROR',
    NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
    DUPLICATE_ERROR: 'DUPLICATE_ERROR',
    PERMISSION_ERROR: 'PERMISSION_ERROR',
    RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR'
};

module.exports = {
    HTTP_STATUS,
    RESPONSE_MESSAGES,
    ERROR_CODES
};
