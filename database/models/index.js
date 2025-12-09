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


// TERMS And Conditions
const defineTermsAndConditions = require("./cms/termsAndConditions/termsAndConditionsCms");
const defineFaq = require("./cms/termsAndConditions/faq");

// POLICY Warranty policy
const defineWarrantyPolicy = require("./policy/warrantyPolicy");
const definePrivacyPolicyCms = require("./policy/privacyPolicy/policyCms");
const definePolicies = require("./policy/privacyPolicy/policies");
const defineReturnPolicyCms = require("./policy/returnPolicy/returnPolicyCms");

// Login Register
const defineLoginRegisterCms = require("./cms/loginRegister/loginRegisterCms");








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
  whyBosq: defineWhyBosq(sequelize),
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


  // TERMS AND CONDITIONS
  TermsAndConditions: defineTermsAndConditions(sequelize),
  Faq: defineFaq(sequelize),

  // POLICY
  WarrantyPolicy: defineWarrantyPolicy(sequelize),
  PrivacyPolicyCms: definePrivacyPolicyCms(sequelize),
  Policies: definePolicies(sequelize),
  ReturnPolicyCms: defineReturnPolicyCms(sequelize),



  // Login Register
  LoginRegisterCms: defineLoginRegisterCms(sequelize),
};

Object.keys(models).forEach((modelName) => {
  if ("associate" in models[modelName]) {
    console.log("Associating", modelName);
    models[modelName].associate(models);
  }
});

module.exports = { sequelize, models };