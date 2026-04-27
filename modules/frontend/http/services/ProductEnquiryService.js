const { models } = require("../../../../database/models");
const { validateRecaptcha } = require("../../../../services/RecaptchaValidation");
const { handleFileUploadStore } = require("../../../admin/http/middleware/multerMiddleware");
const { ErrorHandler } = require("../traits/errorHandler");
const { RESPONSE_MESSAGES, ERROR_CODES, HTTP_STATUS } = require("../traits/constants");
const EmailService = require("../../../../services/EmailService");

class ProductEnquiryService {
  static async store(req, res) {
    try {
      const data = req.body;
      const token = data?.recaptcha_token;

      if (!token) {
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.RECAPTCHA_MISSING, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
      }

      const { success, score } = await validateRecaptcha(token);

      if (!success || score < 0.5) {
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.RECAPTCHA_FAILED, HTTP_STATUS.FORBIDDEN, ERROR_CODES.VALIDATION_ERROR);
      }

      const { product_id } = data;

      const productExists = await models.ProductVariants.findOne({
        where: { id: product_id },
      });

      if (!productExists) {
        throw ErrorHandler.createError(RESPONSE_MESSAGES.ERROR.INVALID_PRODUCT, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
      }

      const fileFields = ["media_path"];
      handleFileUploadStore(req, fileFields);

      const enquiry = await models.ProductEnquiry.create({
        product_id: data.product_id,
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        city: data.city || null,
        media_path: data.media_path || null,
        message: data.message,
      });

      const adminData = {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        city: data.city || null,
        message: data.message,
        product_name: productExists.title || null,
      };

      await Promise.all([
        EmailService.sendQueryAcknowledgement(data.email, data.name, data.message),
        EmailService.sendProductEnquiryAdmin(adminData),
      ]);

      return enquiry;
    } catch (error) {
      console.error("Error creating product enquiry:", error.message);
      throw error;
    }
  }
}

module.exports = ProductEnquiryService;
