const { body, validationResult } = require("express-validator");
const { sequelize, models } = require("../../../../../database/models");
const {
  sendValidationError,
  sendSuccessResponse,
  sendErrorResponse,
} = require("../../traits/responseHandler");
const { handleFileUploadUpdate } = require("../../middleware/multerMiddleware");
const { validationRequest } = require("../../request/projects/cmsRequest");
const { invalidateCache } = require("../../../../redis/redisService");
const cacheKeys = require("../../../../redis/cacheKeys");

const DataModel = models.ProjectsCms;
const cacheKey = cacheKeys.projects;
class ProjectsCmsController {
  //DATA VIEW  START
  static async index(req, res) {
    try {
      let data = await DataModel.findOne();

      if (!data) {
        data = await DataModel.create({});
      }

      return sendSuccessResponse(res, data, "Data fetched  successfully", 200);
    } catch (error) {
      console.error("Index Error:", error);
      return sendErrorResponse(
        res,
        "Internal Server Error",
        500,
        "INTERNAL_ERROR",
      );
    }
  }
  //DATA VIEW  END

  //DATA UPDATE  START
  static async update(req, res) {
    await Promise.all(
      validationRequest.map((validation) => validation.run(req)),
    );
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationError(res, errors.array());
    }

    const transaction = await sequelize.transaction();

    try {
      const existingData = await DataModel.findOne();
      const fileFields = [
        "media_desktop_path",
        "media_mobile_path",
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
      return sendSuccessResponse(res, data, "Data updated successfully", 200);
    } catch (error) {
      await transaction.rollback();
      console.error("Data save error:", error);
      return sendErrorResponse(res, error);
    }
  }
  //DATA UPDATE  END
}

module.exports = ProjectsCmsController;
