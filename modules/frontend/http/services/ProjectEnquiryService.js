const { models } = require("../../../../database/models");
const {
  validateRecaptcha,
} = require("../../../../services/RecaptchaValidation");
const EmailService = require("../../../../services/EmailService");

class ProjectEnquiryService {
  static async store(data) {
    try {
      const token = data?.recaptcha_token;

      if (!token) {
        throw new Error("reCAPTCHA token missing");
      }

      const { success, score } = await validateRecaptcha(token);

      if (!success || score < 0.5) {
        const error = new Error(
          "reCAPTCHA verification failed. Please try again.",
        );
        error.statusCode = 403;
        throw error;
      }

      const { project_id } = data;

      const projectExists = await models.Projects.findOne({
        where: { id: project_id },
      });

      if (!projectExists) {
        throw new Error("Invalid project");
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
