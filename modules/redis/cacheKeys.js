const landingPage = require("../../database/models/landingPage/landingPage");

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
  projects: "projects",
  blog: "blog-list",
  landingPage: "landingPage",
  blogDetail: (slug) => `blog-list:${slug}`,

  news: "news-list",
  newsDetail: (slug) => `news-list:${slug}`,
  customization: "customization",
  materialsGuide: "materialsGuide",
  sustainability: "sustainability",
  ergonomichair: "ergonomichair",
  auth: "auth",
  siteSettings: "siteSettings",
  listingDropdownFilters: "listingDropdownFilters",
  productBaseDetail: (slug) => `productBaseDetail:${slug}`,
  productVariantRelatedModels: (product_base_id) => `productVariantRelatedModels:${product_base_id}`,
  state: "state",
  country: "country",
  coupons: "coupons",
  blogList: (page, limit) => `blog-list:page:${page}:limit:${limit}`,
  newsList: (page, limit) => `news-list:page:${page}:limit:${limit}`,
  landingPageDetails: (slug) => `landingPage:${slug}`,

};

module.exports = cacheKeys;
