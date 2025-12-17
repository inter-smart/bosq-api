const sequelize = require("../config/index");

const defineAdminUser = require("./adminuser");

// HOME
const defineHomeCms = require("./cms/home/homeCms");
const defineHomeBanner = require("./cms/home/homeBanner");
const defineSmartSpaceCalculator = require("./cms/home/smartSpaceCalculator");
const defineHomeBrands = require("./cms/home/homeBrands");
const defineFindYourFIts = require("./cms/home/fIndYourFits");

// CONTACT
const defineContactCms = require("./cms/contact/contactCms");

// ABOUT
const defineAboutCms = require("./cms/about/aboutCms");
const defineAboutJourneys = require("./cms/about/aboutJourneys");
const defineWhyBosq = require("./cms/about/whyBosq");
const defineAboutTestimonials = require("./cms/about/aboutTestimonials");
const defineAboutOurClients = require("./cms/about/aboutOurClients");

// MATERIALS
const defineMaterialGuideCms = require("./cms/materialGuide/materialGuideCms");
const defineMaterials = require("./cms/materialGuide/materials");
const defineMaterialCategories = require("./cms/materialGuide/materialCategory");

// FAQ
const defineFaqCms = require("./cms/faq/faqCms");
const defineFaqList = require("./cms/faq/faqList");
const defineFaqCategory = require("./cms/faq/faqCategory");

// Blog
const defineBlogCms = require("./blog/blogCms");
const defineBlogs = require("./blog/blogs");

// NEWS
const defineNewsCms = require("./news/newsCms");
const defineNews = require("./news/news");

// DELIVERY
const defineDeliveryCms = require("./cms/delivery/deliveryCms");
const defineDeliveryTime = require("./cms/delivery/deliveryTime");
const defineDeliveryMethods = require("./cms/delivery/deliveryMethods");

// TERMS And Conditions
const defineTermsAndConditions = require("./cms/termsAndConditions/termsAndConditionsCms");
const defineFaq = require("./cms/termsAndConditions/faq");

// POLICY Warranty policy
const defineWarrantyPolicy = require("./policy/warrantyPolicy");
const definePrivacyPolicyCms = require("./policy/privacyPolicy/policyCms");
const definePolicies = require("./policy/privacyPolicy/policies");
const defineReturnPolicyCms = require("./policy/returnPolicy/returnPolicyCms");
const ReturnPolicies = require("./policy/returnPolicy/returnPolicies");

//Customization
const defineCustomizationCms = require("./cms/customization/customizationCms");
const defineCustomizationFeatures = require("./cms/customization/customizationFeatures");
const defineCustomizationProcess = require("./cms/customization/customizationProcess");
const defineCustomizationOptions = require("./cms/customization/customizationOptions");

//Sustainability
const defineSustainabilityCms = require("./cms/sustainability/cms");
const defineOneImage = require("./cms/sustainability/oneImage");
const defineTwoImage = require("./cms/sustainability/twoImage");

// Login Register
const defineLoginRegisterCms = require("./cms/loginRegister/loginRegisterCms");

 // ERGONIMICS
const defineErgonimicsCms = require("./cms/ergonomicsChair/cms");

// FOOTER
const defineSocialMedia = require("./siteSettings/socialMedia");

// PROJECTS
const defineProjectsCms = require("./cms/projects/cms");
const defineProjectCategories = require("./cms/projects/projectCategories");
const defineProjects = require("./cms/projects/projects");
const defineHeaderFooter = require("./siteSettings/headerFooter");
const defineMetaTags = require("./siteSettings/metaTags");
const definePaymentMethods = require("./siteSettings/paymentMethods");

const models = {
  AdminUser: defineAdminUser(sequelize),

  // HOME
  HomeCms: defineHomeCms(sequelize),
  HomeBanner: defineHomeBanner(sequelize),
  SmartSpaceCalculator: defineSmartSpaceCalculator(sequelize),
  HomeBrands: defineHomeBrands(sequelize),
  FindYourFits: defineFindYourFIts(sequelize),

  // CONTACT
  ContactCms: defineContactCms(sequelize),

  // ABOUT
  AboutCms: defineAboutCms(sequelize),
  AboutJourneys: defineAboutJourneys(sequelize),
  WhyBosq: defineWhyBosq(sequelize),
  AboutTestimonials: defineAboutTestimonials(sequelize),
  AboutOurClients: defineAboutOurClients(sequelize),

  // MATERIALS
  MaterialGuideCms: defineMaterialGuideCms(sequelize),
  Materials: defineMaterials(sequelize),
  MaterialCategories: defineMaterialCategories(sequelize),

  // FAQ
  FaqCms: defineFaqCms(sequelize),
  FaqList: defineFaqList(sequelize),
  FaqCategory: defineFaqCategory(sequelize),

  // Blog
  BlogCms: defineBlogCms(sequelize),
  Blogs: defineBlogs(sequelize),

  // NEWS
  NewsCms: defineNewsCms(sequelize),
  News: defineNews(sequelize),

  // DELIVERY
  DeliveryCms: defineDeliveryCms(sequelize),
  DeliveryTime: defineDeliveryTime(sequelize),
  DeliveryMethods: defineDeliveryMethods(sequelize),

  // TERMS AND CONDITIONS
  TermsAndConditions: defineTermsAndConditions(sequelize),
  Faq: defineFaq(sequelize),

  // POLICY
  Policies: definePolicies(sequelize),
  WarrantyPolicy: defineWarrantyPolicy(sequelize),
  PrivacyPolicyCms: definePrivacyPolicyCms(sequelize),
  ReturnPolicyCms: defineReturnPolicyCms(sequelize),
  ReturnPolicies: ReturnPolicies(sequelize),

  //Customization
  CustomizationCms: defineCustomizationCms(sequelize),
  CustomizationFeatures: defineCustomizationFeatures(sequelize),
  CustomizationProcess: defineCustomizationProcess(sequelize),
  CustomizationOptions: defineCustomizationOptions(sequelize),

  //Sustainability
  SustainabilityCms: defineSustainabilityCms(sequelize),
  OneImage: defineOneImage(sequelize),
  TwoImage: defineTwoImage(sequelize),

  // Login Register
  LoginRegisterCms: defineLoginRegisterCms(sequelize),


  // FOOTER
  SocialMedia: defineSocialMedia(sequelize),

  // PROJECTS
  ProjectsCms: defineProjectsCms(sequelize),
  ProjectCategories: defineProjectCategories(sequelize),
  Projects: defineProjects(sequelize),
  HeaderFooter: defineHeaderFooter(sequelize),
  MetaTags: defineMetaTags(sequelize),
  PaymentMethods: definePaymentMethods(sequelize),
};

Object.keys(models).forEach((modelName) => {
  if ("associate" in models[modelName]) {
    console.log("Associating", modelName);
    models[modelName].associate(models);
  }
});

module.exports = { sequelize, models };
