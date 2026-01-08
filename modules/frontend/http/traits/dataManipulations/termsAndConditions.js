function buildFaqData(cms, faq) {
  return {
    title: cms.faq_title,
    title_ar: cms.faq_title_ar,

    items: faq.map((item) => ({
      id: item.id,
      question: item.question,
      question_ar: item.question_ar,
      answer: item.answer,
      answer_ar: item.answer_ar,
    })),
  };
}

module.exports = {
  buildFaqData,
};
