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

class ContactEnquiryService {
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

      const enquiry = await models.ContactEnquiry.create({
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        message: data.message,
        type: data.type || "contact",
      });

      await Promise.all([
        EmailService.sendContactEnquiry(data),
        EmailService.sendContactEnquiryAdmin(data),
      ])
        .then(() => {
          console.log("All emails sent successfully");
        })
        .catch((error) => {
          console.error("Failed to send email:", error);
        });
      return enquiry;
    } catch (error) {
      console.error("Error creating contact enquiry:", error.message);
      throw error;
    }
  }
}

module.exports = ContactEnquiryService;
