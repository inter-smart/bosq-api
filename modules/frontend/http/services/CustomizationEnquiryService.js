const { models } = require("../../../../database/models");
const {
  validateRecaptcha,
} = require("../../../../services/RecaptchaValidation");
const EmailService = require("../../../../services/EmailService");
const { ErrorHandler } = require("../traits/errorHandler");
const {
  RESPONSE_MESSAGES,
  ERROR_CODES,
  HTTP_STATUS,
} = require("../traits/constants");

const dataModel = models.CustomizationEnquiry;

class CustomizationEnquiryService {
  static async store(data) {
    try {
      const token = data?.recaptcha_token;

      if (!token) {
        throw ErrorHandler.createError(
          RESPONSE_MESSAGES.ERROR.RECAPTCHA_MISSING,
          HTTP_STATUS.BAD_REQUEST,
          ERROR_CODES.VALIDATION_ERROR,
        );
      }

      const { success, score } = await validateRecaptcha(token);

      if (!success || score < 0.5) {
        throw ErrorHandler.createError(
          RESPONSE_MESSAGES.ERROR.RECAPTCHA_FAILED,
          HTTP_STATUS.FORBIDDEN,
          ERROR_CODES.VALIDATION_ERROR,
        );
      }

      const { dropdown_id } = data;

      // Sanitize state_id — convert falsy values to null (column is nullable)
      if (!data.state_id) {
        data.state_id = null;
      } else {
        const isExist = await models.EnquiryDropdown.findOne({
          where: { id: dropdown_id },
        });
        if (!isExist) {
          throw ErrorHandler.createError(
            RESPONSE_MESSAGES.ERROR.INVALID_CUSTOMIZATION_OPTION,
            HTTP_STATUS.BAD_REQUEST,
            ERROR_CODES.VALIDATION_ERROR,
          );
        }
      }
      // Sanitize state_id — convert falsy values to null (column is nullable)
      if (!data.state_id) {
        data.state_id = null;
      } else {
        const stateExists = await models.State.findOne({
          where: { id: data.state_id },
        });
        if (!stateExists) {
          throw ErrorHandler.createError(
            RESPONSE_MESSAGES.ERROR.INVALID_STATE,
            HTTP_STATUS.BAD_REQUEST,
            ERROR_CODES.VALIDATION_ERROR,
          );
        }
      }

      const option = await models.EnquiryDropdown.findOne({
        where: { id: data.dropdown_id },
      });
      const state = data.state_id
        ? await models.State.findOne({ where: { id: data.state_id } })
        : null;

      const emailData = {
        ...data,
        option_label: option?.title || null,
        state_label: state?.name || null,
      };
      const enquiry = await dataModel.create(data);

      await Promise.all([
        EmailService.sendGeneralEnquiry(emailData),
        EmailService.sendGeneralEnquiryAdmin(emailData),
      ]).catch((error) => {
        console.error("Failed to send emails:", error);
      });
      return enquiry;
    } catch (error) {
      console.error("Error creating contact enquiry:", error.message);
      throw error;
    }
  }
}

module.exports = CustomizationEnquiryService;
