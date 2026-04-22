const { validationResult } = require("express-validator");
const { sequelize, models } = require("../../../../../database/models/index.js");
const { sendValidationError, sendSuccessResponse, sendErrorResponse, sendNotFoundError } = require("../../traits/responseHandler.js");

const DataModel = models.MailerSettings;
const MAILER_TYPES = ["auth", "enquiries", "newsletter", "orders", "admin"];

class MailerSettingsController {
  static async index(req, res) {
    try {
      let rows = await DataModel.findAll();

      const existingTypes = rows.map((r) => r.type);
      const missingTypes = MAILER_TYPES.filter((t) => !existingTypes.includes(t));

      for (const type of missingTypes) {
        await DataModel.create({ type, to_email: "", cc_emails: null });
      }

      if (missingTypes.length > 0) {
        rows = await DataModel.findAll({ order: [["id", "ASC"]] });
      }

      return sendSuccessResponse(res, rows, "Data fetched successfully", 200);
    } catch (error) {
      console.error("MailerSettings index error:", error);
      return sendErrorResponse(res, "Internal Server Error", 500, "INTERNAL_ERROR");
    }
  }

  static async update(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendValidationError(res, errors.array());
    }

    const { type } = req.params;
    const { to_email, cc_emails } = req.body;

    const transaction = await sequelize.transaction();

    try {
      const data = await DataModel.findOne({ where: { type } });

      if (!data) {
        await transaction.rollback();
        return sendNotFoundError(res, "Mailer settings not found");
      }

      await data.update({ to_email, cc_emails: cc_emails || null }, { transaction });

      await transaction.commit();
      return sendSuccessResponse(res, data, "Mailer settings updated successfully", 200);
    } catch (error) {
      await transaction.rollback();
      console.error("MailerSettings update error:", error);
      return sendErrorResponse(res, error);
    }
  }
}

module.exports = MailerSettingsController;
