const { body, validationResult } = require("express-validator");
const { sequelize, models } = require('../../../../../../database/models');
const { sendValidationError, sendSuccessResponse, sendErrorResponse } = require("../../../traits/responseHandler");
const { validationRequestPost } = require("../../../request/cms/home/HomeCmsRequest");
const { handleFileUploadUpdate } = require("../../../../http/middleware/multerMiddleware");
const { getCache, invalidateCache, setCache } = require("../../../../../redis/redisService");



const DataModel = models.HomeCms;
const cacheKey = 'home_cms_data';

class HomeCmsController {

    //DATA VIEW  START
    static async index(req, res) {
        try {

            const getCachedData = await getCache(cacheKey)

            // if (getCachedData) {
            //     return sendSuccessResponse(res, getCachedData, 'Data fetched from cache', 200);
            // }

            let data = await DataModel.findOne();

            if (!data) {
                data = await DataModel.create({});
            }

            await setCache(cacheKey, data);

            return sendSuccessResponse(res, data, 'Data fetched  successfully', 200);
        } catch (error) {
            console.error("Index Error:", error);
            return sendErrorResponse(res, "Internal Server Error", 500, "INTERNAL_ERROR");
        }
    }
    //DATA VIEW  END



    //DATA UPDATE  START
    static async update(req, res) {
        await Promise.all(validationRequestPost.map(validation => validation.run(req)));
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return sendValidationError(res, errors.array());
        }

        const transaction = await sequelize.transaction();

        try {
            const existingData = await DataModel.findOne();
            const fileFields = [
                "about_media_path",
                "journey_media_desktop_path",
                "journey_media_mobile_path",
                "form_media_path",
            ];

            let data;

            if (existingData) {
                data = existingData;
                await handleFileUploadUpdate(req, data, fileFields);
                await data.update(req.body, { transaction });
            } else {
                data = await DataModel.create(req.body, { transaction });
                await handleFileUploadUpdate(req, data, fileFields);
            }

            await invalidateCache(cacheKey);
            await transaction.commit();
            return sendSuccessResponse(res, data, 'Data updated successfully', 200);

        } catch (error) {
            await transaction.rollback();
            console.error('Data save error:', error);
            return sendErrorResponse(res, error.message);
        }
    }
    //DATA UPDATE  END




}

module.exports = HomeCmsController;
