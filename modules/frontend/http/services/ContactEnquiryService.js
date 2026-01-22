const { models } = require("../../../../database/models");
const { validateRecaptcha } = require("../../../../services/RecaptchaValidation");

class ContactEnquiryService {
  static async store(data) {
    try {
      // ✅ Correct token key
      const token = data?.recaptcha_token;

      if (!token) {
        throw new Error("reCAPTCHA token missing");
      }

      const { success, score, action } = await validateRecaptcha(token);

      console.log("reCAPTCHA result:", { success, score, action });

      // ✅ v3 validation
      if (!success || score < 0.5) {
        const error = new Error("reCAPTCHA verification failed. Please try again.");
        error.statusCode = 403;
        throw error;
      }

      const enquiry = await models.ContactEnquiry.create({
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        message: data.message,
      });

      return enquiry;
    } catch (error) {
      console.error("Error creating contact enquiry:", error.message);
      throw error;
    }
  }
}


module.exports = ContactEnquiryService;
