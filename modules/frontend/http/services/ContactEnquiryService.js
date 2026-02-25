const { models } = require("../../../../database/models");
const EmailService = require("../../../../services/EmailService");
const {
  validateRecaptcha,
} = require("../../../../services/RecaptchaValidation");

class ContactEnquiryService {
  static async store(data) {
    try {
      // ✅ Correct token key
      const token = data?.recaptcha_token;

      if (!token) {
        throw new Error("reCAPTCHA token missing");
      }

      const { success, score } = await validateRecaptcha(token);

      // ✅ v3 validation
      if (!success || score < 0.5) {
        const error = new Error(
          "reCAPTCHA verification failed. Please try again.",
        );
        error.statusCode = 403;
        throw error;
      }

      const isExist = await models.ContactEnquiry.findOne({
        where: { email: data.email, type: data.type },
      });

      if (isExist) {
        throw new Error(`You already have a enquiry with this email`);
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
