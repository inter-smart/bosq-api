const { mediaWithoutType } = require("../mediaButtonHelper");

function buildFaqData(faqCms, categories) {
  return {
    title: faqCms.banner_title,
    title_ar: faqCms.banner_title_ar,
    media: mediaWithoutType(faqCms, "banner_media_desktop_path", "banner_media_mobile_path", "banner_media_alt", "banner_media_alt_ar"),
    list: categories.map((cat) => ({
      id: cat.id,
      title: cat.title,
      title_ar: cat.title_ar,
      faqs: cat.faq_lists.map((faq) => ({
        id: faq.id,
        question: faq.question,
        question_ar: faq.question_ar,
        answer: faq.answer,
        answer_ar: faq.answer_ar,
      })),
    })),
  };
}


function buildMoreFaqData(faqCms, categories) {
  return {
    title: faqCms.title,
    title_ar: faqCms.title_ar,
    media: mediaWithoutType(faqCms, "banner_media_desktop_path", "banner_media_mobile_path", "banner_media_alt", "banner_media_alt_ar"),
    list: categories.map((cat) => ({
      id: cat.id,
      title: cat.title,
      title_ar: cat.title_ar,
      faqs: cat.faq_lists.map((faq) => ({
        id: faq.id,
        question: faq.question,
        question_ar: faq.question_ar,
        answer: faq.answer,
        answer_ar: faq.answer_ar,
      })),
    })),
  };
}

module.exports = {
  buildFaqData,
  buildMoreFaqData
};
