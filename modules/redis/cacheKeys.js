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
  blog: "blog-list",
  blogDetail: (slug) => `blog-list:${slug}`,
  customization: "customization",
  materialsGuide: "materialsGuide",
  sustainability: "sustainability",
  ergonomichair: "ergonomichair",
  auth: "auth",
};

module.exports = cacheKeys;
