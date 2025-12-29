const { mediaWithoutType } = require("../mediaButtonHelper");

function buildFaqData(faqCms, categories) {
  return {
    title: faqCms.title,
    title_ar: faqCms.title_ar,
    item: categories.map((cat) => ({
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
};
