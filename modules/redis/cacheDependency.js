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
  AboutTeam: [cacheKeys.about],
  AboutTimeline: [cacheKeys.about],
  
  // Materials Module
  MaterialsCms: [cacheKeys.materials],
  Materials: [cacheKeys.materials],
  
  // Sustainability Module
  SustainabilityCms: [cacheKeys.sustainability],
  Sustainability: [cacheKeys.sustainability],
  
  // Legal Pages
  TermsAndConditions: [cacheKeys.termsAndConditions],
  PrivacyPolicy: [cacheKeys.privacyPolicy],
  
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
  News: [cacheKeys.news],
  NewsCms: [cacheKeys.news],
  NewsCategories: [cacheKeys.news],

  Blogs: [cacheKeys.blog],
  BlogCms: [cacheKeys.blog],
  BlogCategories: [cacheKeys.blog],
};

module.exports = cacheDependencies;