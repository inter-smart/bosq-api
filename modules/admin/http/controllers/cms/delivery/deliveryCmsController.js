const { body, validationResult } = require("express-validator");
const { sequelize, models } = require('../../../../../../database/models');
const { sendValidationError, sendSuccessResponse, sendErrorResponse } = require("../../../traits/responseHandler");
const { validationRequestPost } = require("../../../request/cms/delivery/deliveryCmsRequest");
const { handleFileUploadUpdate } = require("../../../../http/middleware/multerMiddleware");



const DataModel = models.DeliveryCms;


class DeliveryCmsController {

    //DATA VIEW  START
    static async index(req, res) {
        try {
            let data = await DataModel.findOne();

            if (!data) {
                data = await DataModel.create({});
            }

            return sendSuccessResponse(res, data, 'Data fetched  successfully', 200);
        } catch (error) {
            console.error("Index Error:", error);
            return sendErrorResponse(res, "Internal Server Error", 500, "INTERNAL_ERROR");
        }
    }


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
                "banner_media_desktop_path",
                "banner_media_mobile_path",
                "delivery_media_path"
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

            await transaction.commit();
            return sendSuccessResponse(res, data, 'Data updated successfully', 200);

        } catch (error) {
            await transaction.rollback();
            console.error('Data save error:', error);
            return sendErrorResponse(res, error);
        }
    }




}

module.exports = DeliveryCmsController;
