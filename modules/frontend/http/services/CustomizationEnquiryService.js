const { Op } = require("sequelize");
const { models } = require("../../../../database/models");
const {
  validateRecaptcha,
} = require("../../../../services/RecaptchaValidation");

const dataModel = models.CustomizationEnquiry;

class ContactEnquiryService {
  static async store(data) {
    try {
      // ✅ Correct token key
      const token = data?.recaptcha_token;

      if (!token) {
        throw new Error("reCAPTCHA token missing");
      }

      const { success, score, action } = await validateRecaptcha(token);

      // ✅ v3 validation
      if (!success || score < 0.5) {
        const error = new Error(
          "reCAPTCHA verification failed. Please try again.",
        );
        error.statusCode = 403;
        throw error;
      }

      const { options_id } = data;

      const isExist = await models.CustomizationOptions.findOne({
        where: { id: options_id },
      });

      if (!isExist) {
        throw new Error("Invalid customization option");
      }

      // Sanitize state_id — convert falsy values to null (column is nullable)
      if (!data.state_id) {
        data.state_id = null;
      } else {
        const stateExists = await models.State.findOne({
          where: { id: data.state_id },
        });
        if (!stateExists) {
          throw new Error("Invalid state");
        }
      }

      const enquiry = await dataModel.create(data);

      return enquiry;
    } catch (error) {
      console.error("Error creating contact enquiry:", error.message);
      throw error;
    }
  }

  
}

module.exports = ContactEnquiryService;
