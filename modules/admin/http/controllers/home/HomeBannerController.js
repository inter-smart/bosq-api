const { validationResult } = require('express-validator');
const { sequelize, models } = require('../../../../../database/models');
const { sendValidationError, sendSuccessResponse, sendErrorResponse, sendNotFoundError } = require("../../traits/responseHandler");
const { validationRequestPost, validateId } = require("../../request/home/HomeBannerRequest");
const { handleFileUploadStore, handleFileUploadUpdate } = require('../../middleware/multerMiddleware');
const { paginate } = require('../../../http/traits/datatablePaginationHelper');


const DataModel = models.HomeBanner;

class HomeBannerController {
    static async index(req, res) {
        try {
            const result = await paginate(DataModel, req, {
                order: [['sort_order', 'ASC'], ['createdAt', 'DESC']],
                searchFields: ['name', 'title', 'keywords'],
            });

            const response = {
                list: result.data,
                pagination: result.pagination
            };

            sendSuccessResponse(res, response, 'Data retrieved successfully');
        } catch (error) {
            console.error('Data index error:', error);
            sendErrorResponse(res, error);
        }
    }


    static async store(req, res) {
        await Promise.all(validationRequestPost.map(validation => validation.run(req)));
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return sendValidationError(res, errors.array());
        }

        const transaction = await sequelize.transaction();

        try {
            const fileFields = ["media_desktop_path","media_mobile_path"];
            handleFileUploadStore(req, fileFields);

            // Create data with transaction
            const data = await DataModel.create(req.body, { transaction });

            // Commit the transaction
            await transaction.commit();
            sendSuccessResponse(res, data, 'Data created successfully', 201);

        } catch (error) {
            console.error('Data creation error:', error);
            await transaction.rollback();
            sendErrorResponse(res, error);
        }
    }


    static async show(req, res) {
        // Run ID validation
        await Promise.all(validateId.map(validation => validation.run(req)));
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return sendValidationError(res, errors.array());
        }

        try {
            const { id } = req.params;

            const data = await DataModel.findByPk(id);

            if (!data) {
                return sendNotFoundError(res, 'Data');
            }

            sendSuccessResponse(res, data, 'Data retrieved successfully');

        } catch (error) {
            console.error('Data show error:', error);
            sendErrorResponse(res, error);
        }
    }

    static async update(req, res) {
        await Promise.all([...validateId, ...validationRequestPost].map(v => v.run(req)));
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return sendValidationError(res, errors.array());
        }

        const transaction = await sequelize.transaction();

        try {
            const { id } = req.params;

            const data = await DataModel.findByPk(id, { transaction });
            if (!data) {
                await transaction.rollback();
                return sendNotFoundError(res, 'Data');
            }

            

            const fileFields = ["media_desktop_path","media_mobile_path"];
            await handleFileUploadUpdate(req, data, fileFields);

            await data.update(req.body, { transaction });

            await transaction.commit();

            const updatedData = await DataModel.findByPk(data.id);

            return sendSuccessResponse(res, updatedData, 'Data updated successfully');

        } catch (error) {
            await transaction.rollback();
            console.error('Data update error:', error);
            return sendErrorResponse(res, error);
        }
    }


    static async destroy(req, res) {
        // Run ID validation
        await Promise.all(validateId.map(validation => validation.run(req)));
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return sendValidationError(res, errors.array());
        }

        try {
            const { id } = req.params;

            const data = await DataModel.findByPk(id);
            if (!data) {
                return sendNotFoundError(res, 'Data');
            }

            // Soft delete
            await data.destroy();

            sendSuccessResponse(res, { id }, 'Data deleted successfully');

        } catch (error) {
            console.error('Data deletion error:', error);
            sendErrorResponse(res, error);
        }
    }


}

module.exports = HomeBannerController;