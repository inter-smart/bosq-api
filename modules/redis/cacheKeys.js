
const cacheKeys = {
  home: "home",
  about: "about",
  termsAndConditions: "termsAndConditions",
  privacyPolicy: "privacyPolicy",
  returnPolicy: "returnPolicy",
  warrantyPolicy: "warrantyPolicy",
  deliveryPolicy: "deliveryPolicy",
  faq: "faq",
  contact: "contact",
  projects: "home",
  blog: "blog",
  blogDetail: (slug) => `blog:detail:${slug}`,
  customization: "customization",
  materialsGuide: "materialsGuide",
};

module.exports = cacheKeys;
