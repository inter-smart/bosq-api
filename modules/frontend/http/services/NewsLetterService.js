const { models } = require("../../../../database/models");
const {
  validateRecaptcha,
} = require("../../../../services/RecaptchaValidation");

class NewsLetterService {
  static async store(data) {
    try {
      // ✅ Correct token key
      // const token = data?.recaptcha_token;

      // if (!token) {
      //   throw new Error("reCAPTCHA token missing");
      // }

      // const { success, score, action } = await validateRecaptcha(token);

      // console.log("reCAPTCHA result:", { success, score, action });

      // // ✅ v3 validation
      // if (!success || score < 0.5) {
      //   const error = new Error(
      //     "reCAPTCHA verification failed. Please try again.",
      //   );
      //   error.statusCode = 403;
      //   throw error;
      // }

      // check user already exist
      const existingEntry = await models.NewsLetter.findOne({
        where: { email: data.email },
      });

      if (existingEntry) {
        const error = new Error("You already have a career enquiry with this email");
        error.statusCode = 409; // Conflict
        throw error;
      }

      const enquiry = await models.NewsLetter.create({
        email: data.email,
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
