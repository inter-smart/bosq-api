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
const defineExtraMaterials = require("./cms/materialGuide/extraMaterials");

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
const defineTwoImage = require("./cms/sustainability/twoImage");

// Login Register
const defineLoginRegisterCms = require("./cms/loginRegister/loginRegisterCms");

// FOOTER
const defineSocialMedia = require("./siteSettings/socialMedia");

// PROJECTS
const defineProjectsCms = require("./projects/cms");
const defineProjectCategories = require("./projects/projectCategories");
const defineProjects = require("./projects/projects");
const defineSpecialisedAreas = require("./projects/specialisedAreas");

// ERGONOMIC
const defineErgonomicCms = require("./cms/ergnomicGuide/cms");
const defineErgonomicFeatures = require("./cms/ergnomicGuide/features");

// Header and Footer
const defineHeaderFooter = require("./siteSettings/headerFooter");
const defineMetaTags = require("./siteSettings/metaTags");
const definePaymentMethods = require("./siteSettings/paymentMethods");

// AUTH PAGE
const defineAuthCms = require("./cms/auth/cms");

// Resources
const defineProductCategory = require("./resources/productCategory");
const defineProductAttribute = require("./resources/productAttribute");
const defineProductSellingPoints = require("./resources/productSellingPoints");
const defineProductSectors = require("./resources/productSectors");
const defineProductBase = require("./resources/productBase");
const defineProductBaseSellingPoints = require("./resources/productBaseSellingPoints");
const defineProductBaseSectors = require("./resources/productBaseSectors");
const defineAttributeValues = require("./resources/attributeValues");
const defineProductVariants = require("./resources/productVariants");
const defineProductVariantAttributes = require("./resources/productVariantAttributes");
const defineProductVariantImages = require("./resources/productVariantImages");
const defineProductProjectImage = require("./resources/productProjectImage");
const defineProductModels = require("./resources/productModels");

// Cart
const defineCart = require("./resources/cart/cart");
const defineCartItems = require("./resources/cart/cartItems");
const defineCartAddress = require("./resources/cart/cartAddress");

// USER AUTH

const defineUsers = require("./users/users");
const defineAuthSessions = require("./users/authSessions");
const defineSocialAccounts = require("./users/socialAccounts");
const defineOtps = require("./users/otps");
const defineAddress = require("./users/address");

// ENQUIRIES
const defineContactEnquiry = require("./enquiries/contact");
const defineNewsLetter = require("./enquiries/newsletter");

// STATE AND COUNTRY
const defineState = require("./state");
const defineCountry = require("./country");

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
  ExtraMaterials: defineExtraMaterials(sequelize),

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
  PrivacyPolicyCms: definePrivacyPolicyCms(sequelize),
  Policies: definePolicies(sequelize),
  WarrantyPolicy: defineWarrantyPolicy(sequelize),
  ReturnPolicyCms: defineReturnPolicyCms(sequelize),
  ReturnPolicies: ReturnPolicies(sequelize),

  //Customization
  CustomizationCms: defineCustomizationCms(sequelize),
  CustomizationFeatures: defineCustomizationFeatures(sequelize),
  CustomizationProcess: defineCustomizationProcess(sequelize),
  CustomizationOptions: defineCustomizationOptions(sequelize),

  //Sustainability
  SustainabilityCms: defineSustainabilityCms(sequelize),
  TwoImage: defineTwoImage(sequelize),

  // Login Register
  LoginRegisterCms: defineLoginRegisterCms(sequelize),

  // FOOTER
  SocialMedia: defineSocialMedia(sequelize),

  // PROJECTS
  ProjectsCms: defineProjectsCms(sequelize),
  ProjectCategories: defineProjectCategories(sequelize),
  Projects: defineProjects(sequelize),
  SpecialisedAreas: defineSpecialisedAreas(sequelize),

  // ERGONOMIC
  ErgonomicCms: defineErgonomicCms(sequelize),
  ErgonomicFeatures: defineErgonomicFeatures(sequelize),

  // Header and Footer
  HeaderFooter: defineHeaderFooter(sequelize),
  MetaTags: defineMetaTags(sequelize),
  PaymentMethods: definePaymentMethods(sequelize),

  // AUTH PAGE
  AuthCms: defineAuthCms(sequelize),

  // ENQUIRIES
  ContactEnquiry: defineContactEnquiry(sequelize),
  NewsLetter: defineNewsLetter(sequelize),
  // Resources
  ProductCategory: defineProductCategory(sequelize),
  ProductAttribute: defineProductAttribute(sequelize),
  ProductSellingPoints: defineProductSellingPoints(sequelize),
  ProductSectors: defineProductSectors(sequelize),
  ProductBase: defineProductBase(sequelize),
  ProductBaseSellingPoints: defineProductBaseSellingPoints(sequelize),
  ProductBaseSectors: defineProductBaseSectors(sequelize),
  AttributeValues: defineAttributeValues(sequelize),
  ProductVariants: defineProductVariants(sequelize),
  ProductVariantAttributes: defineProductVariantAttributes(sequelize),
  ProductVariantImages: defineProductVariantImages(sequelize),
  ProductProjectImage: defineProductProjectImage(sequelize),
  ProductModels: defineProductModels(sequelize),

  // CART
  Cart: defineCart(sequelize),
  CartItems: defineCartItems(sequelize),
  CartAddress: defineCartAddress(sequelize),

  // USER AUTH
  Users: defineUsers(sequelize),
  AuthSessions: defineAuthSessions(sequelize),
  socialAccounts: defineSocialAccounts(sequelize),
  Otps: defineOtps(sequelize),
  Address: defineAddress(sequelize),

  Country: defineCountry(sequelize),
  State: defineState(sequelize),
};

Object.keys(models).forEach((modelName) => {
  if ("associate" in models[modelName]) {
    console.log("Associating", modelName);
    models[modelName].associate(models);
  }
});

module.exports = { sequelize, models };
