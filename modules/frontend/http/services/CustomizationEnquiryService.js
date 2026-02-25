const { Op } = require("sequelize");
const { models } = require("../../../../database/models");
const {
  validateRecaptcha,
} = require("../../../../services/RecaptchaValidation");
const EmailService = require("../../../../services/EmailService");

const dataModel = models.CustomizationEnquiry;

class CustomizationEnquiryService {
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

      const { dropdown_id } = data;

      // Sanitize state_id — convert falsy values to null (column is nullable)
      if (!data.state_id) {
        data.state_id = null;
      } else {
        const isExist = await models.EnquiryDropdown.findOne({
          where: { id: dropdown_id },
        });
        if (!isExist) {
          throw new Error("Invalid customization option");
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
          throw new Error("Invalid state");
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
        EmailService.sendCustomizationEnquiry(emailData),
        EmailService.sendCustomizationEnquiryAdmin(emailData),
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
