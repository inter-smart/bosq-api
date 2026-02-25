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

class ProjectEnquiryService {
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

      const { project_id } = data;

      const projectExists = await models.Projects.findOne({
        where: { id: project_id },
      });

      if (!projectExists) {
        throw ErrorHandler.createError(
          RESPONSE_MESSAGES.ERROR.INVALID_PROJECT,
          HTTP_STATUS.BAD_REQUEST,
          ERROR_CODES.VALIDATION_ERROR,
        );
      }

      const enquiry = await models.ProjectEnquiry.create({
        project_id: data.project_id,
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        message: data.message,
      });

      const emailData = {
        ...data,
        project_title: projectExists.title || null,
      };

      await Promise.all([
        EmailService.sendProjectEnquiry(emailData),
        EmailService.sendProjectEnquiryAdmin(emailData),
      ]).catch((error) => {
        console.error("Failed to send emails:", error);
      });

      return enquiry;
    } catch (error) {
      console.error("Error creating project enquiry:", error.message);
      throw error;
    }
  }
}

module.exports = ProjectEnquiryService;
