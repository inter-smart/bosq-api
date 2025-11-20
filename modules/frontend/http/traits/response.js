// ============================================
//  Standardized Response Utility
// ============================================

class ApiResponse {
    
    /**
     * Success response format
     * @param {object} res - Express response object
     * @param {object} options - Response options
     */
    static success(res, { message, data = null, status = 200, meta = null }) {
        const response = {
            success: true,
            status_code: status,
            message,
            timestamp: new Date().toISOString()
        };

        if (data !== null) {
            response.data = data;
        }

        if (meta !== null) {
            response.meta = meta;
        }

        return res.status(status).json(response);
    }

    /**
     * Error response format
     * @param {object} res - Express response object
     * @param {object} options - Error options
     */
    static error(res, { message, status = 500, errors = null, error_code = null }) {
        const response = {
            success: false,
            status_code: status,
            message,
            timestamp: new Date().toISOString()
        };

        if (error_code) {
            response.error_code = error_code;
        }

        if (errors) {
            response.errors = errors;
        }

        return res.status(status).json(response);
    }

    /**
     * Paginated response format
     * @param {object} res - Express response object
     * @param {object} options - Pagination options
     */
    static paginated(res, { message, data, pagination, status = 200 }) {
        return res.status(status).json({
            success: true,
            status_code: status,
            message,
            data,
            pagination,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Validation error response
     * @param {object} res - Express response object
     * @param {array} validationErrors - Array of validation errors
     */
    static validationError(res, validationErrors) {
        return this.error(res, {
            message: 'Validation failed',
            status: 400,
            error_code: 'VALIDATION_ERROR',
            errors: validationErrors
        });
    }
}

module.exports = { ApiResponse };