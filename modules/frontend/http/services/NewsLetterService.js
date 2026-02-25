const { models } = require("../../../../database/models");
const EmailService = require("../../../../services/EmailService");
const {
  validateRecaptcha,
} = require("../../../../services/RecaptchaValidation");
const { ErrorHandler } = require("../traits/errorHandler");
const {
  RESPONSE_MESSAGES,
  ERROR_CODES,
  HTTP_STATUS,
} = require("../traits/constants");

class NewsLetterService {
  static async store(data) {
    try {
      // ✅ Correct token key
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

      // check user already exist
      const existingEntry = await models.NewsLetter.findOne({
        where: { email: data.email },
      });

      if (existingEntry) {
        throw ErrorHandler.createError(
          RESPONSE_MESSAGES.ERROR.EMAIL_ALREADY_EXISTS,
          HTTP_STATUS.CONFLICT,
          ERROR_CODES.DUPLICATE_ERROR,
        );
      }

      const enquiry = await models.NewsLetter.create({
        email: data.email,
      });

      await Promise.all([
        EmailService.sendNewsletterConfirmation(data.email),
        EmailService.sendNewsletterAdmin(data.email),
      ]).catch((error) => {
        console.error("Failed to send newsletter emails:", error);
      });

      return {
        data: enquiry,
        message: "Newsletter subscription successful",
      };
    } catch (error) {
      console.error("Error creating contact enquiry:", error.message);
      throw error;
    }
  }
}

module.exports = NewsLetterService;
