const cacheKeys = require("../../../redis/cacheKeys");
const { getCache, setCache } = require("../../../redis/redisService");
const { models } = require("../../../../database/models");
const {
  singleMediaWithoutType,
  mediaWithoutType,
} = require("../traits/mediaButtonHelper");
const {
  sendErrorResponse,
} = require("../../../admin/http/traits/responseHandler");
const { buildTitleSection } = require("../traits/dataManipulations/common");
const { buildFaqData } = require("../traits/dataManipulations/faqs");
const cacheKey = cacheKeys.faq;

class FaqService {
  static async getData(req, res) {
    try {
      const cachedData = await getCache(cacheKey);

      if (cachedData) {
        return {
          data: cachedData,
          fromCache: true,
          message: "FAQs fetched from cache",
        };
      }

      const [faqCms, faqCategory] = await Promise.all([
        models.FaqCms.findOne(),
        models.FaqCategory.findAll({
          where: { status: true },
          include: [
            {
              model: models.FaqList,
              as: "faq_lists",
              attributes: [
                "id",
                "question",
                "question_ar",
                "answer",
                "answer_ar",
                "sort_order",
              ],
            },
          ],
          order: [["sort_order", "ASC"],
         [{ model: models.FaqList, as: "faq_lists" }, "sort_order", "ASC"]],
          
        }),
      ]);

      console.log(faqCategory);

      if (!faqCms) {
        throw new Error("No FAQ CMS data found");
      }

      if (!faqCategory) {
        throw new Error("No FAQ data found");
      }

      const heroData = buildTitleSection(faqCms);
      const faqData = buildFaqData(faqCms, faqCategory);

      const result = {
        heroData,
        faqData,
      };

      await setCache(cacheKey, result);

      return {
        data: result,
        fromCache: false,
        message: "FAQs fetched successfully",
      };
    } catch (error) {
      return sendErrorResponse(res, error, "Internal Server Error", 500);
    }
  }
}

module.exports = FaqService;
