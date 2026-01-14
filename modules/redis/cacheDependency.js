const cacheKeys = require("./cacheKeys");

/**
 * Cache dependencies mapping
 * Maps model names to the cache keys that should be invalidated when that model changes
 *
 * Usage:
 * - When a model is created, updated, deleted, status changed, or sort order changed,
 *   all associated cache keys will be invalidated
 */
const cacheDependencies = {
  // Home Module
  HomeBanner: [cacheKeys.home],
  HomeBrands: [cacheKeys.home],
  HomeTestimonials: [cacheKeys.home],
  HomeServices: [cacheKeys.home],
  FindYourFits: [cacheKeys.home],
  HomeCms: [cacheKeys.home],

  // About Module
  AboutCms: [cacheKeys.about],
  AboutJourneys: [cacheKeys.about],
  WhyBosq: [cacheKeys.about],
  AboutTestimonials: [cacheKeys.about],
  AboutOurClients: [cacheKeys.about],

  // Materials Module
  MaterialsCms: [cacheKeys.materials],
  Materials: [cacheKeys.materials],

  // Sustainability Module
  SustainabilityCms: [cacheKeys.sustainability],
  Sustainability: [cacheKeys.sustainability],

  // Legal Pages
  PrivacyPolicyCms: [cacheKeys.privacyPolicy],
  Policies: [cacheKeys.privacyPolicy],
  TermsAndConditions: [cacheKeys.termsAndConditions],
  Faq: [cacheKeys.termsAndConditions],
  ReturnPolicyCms: [cacheKeys.returnPolicy],
  ReturnPolicies: [cacheKeys.returnPolicy],
  WarrantyPolicy: [cacheKeys.warrantyPolicy],
  DeliveryCms: [cacheKeys.deliveryPolicy],
  DeliveryTime: [cacheKeys.deliveryPolicy],
  DeliveryMethods: [cacheKeys.deliveryPolicy],
  // FAQ Module
  FaqList: [cacheKeys.faq],
  FaqCategory: [cacheKeys.faq],

  // Contact Module
  Contact: [cacheKeys.contact],
  ContactCms: [cacheKeys.contact],

  // Projects Module
  Projects: [cacheKeys.projects, cacheKeys.home],
  ProjectsCms: [cacheKeys.projects],

  // Services Module
  Services: [cacheKeys.services],
  ServicesCms: [cacheKeys.services],

  // News/Blog Module
  News: [cacheKeys.news, cacheKeys.about],
  NewsCms: [cacheKeys.news],
  NewsCategories: [cacheKeys.news],

  Blogs: [
    cacheKeys.blog, // static list cache
    (row) => cacheKeys.blogDetail(row.slug), // dynamic individual blog cache
  ],
  BlogCms: [cacheKeys.blog],
  BlogCategories: [cacheKeys.blog],

  // CUSTOMIZATION
  CustomizationCms: [cacheKeys.customization],
  CustomizationFeatures: [cacheKeys.customization],
  CustomizationOptions: [cacheKeys.customization],
  CustomizationProcess: [cacheKeys.customization],
};

module.exports = cacheDependencies;
