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
// FAQ
const defineFaqCms = require("./cms/faq/faqCms");
const defineFaqList = require("./cms/faq/faqList");
const defineFaqCategory = require("./cms/faq/faqCategory");


// Blog
const defineBlogCms = require("./blog/blogCms");
const defineBlogs = require("./blog/blogs");



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
  // FAQ
  FaqCms: defineFaqCms(sequelize),
  FaqList: defineFaqList(sequelize),
  FaqCategory: defineFaqCategory(sequelize),

  // Blog
  BlogCms: defineBlogCms(sequelize),
  Blogs: defineBlogs(sequelize),
};

Object.keys(models).forEach((modelName) => {
  if ("associate" in models[modelName]) {
    console.log("Associating", modelName);
    models[modelName].associate(models);
  }
});

module.exports = { sequelize, models };