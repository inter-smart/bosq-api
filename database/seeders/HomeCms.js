const { models } = require("../models");

const defaultData = [
  {
    id: 1, // enforce single CMS row

    // ABOUT
    about_media_path: "/uploads/home/about.jpg",
    about_media_alt: "About BOSQ",
    about_media_alt_ar: "عن BOSQ",

    about_title: "About Us",
    about_title_ar: "معلومات عنا",

    about_description:
      "We are a premium brand delivering high-quality products worldwide.",
    about_description_ar:
      "نحن علامة تجارية متميزة نقدم منتجات عالية الجودة في جميع أنحاء العالم.",

    // FEATURED PRODUCTS
    featured_title: "Featured Products",
    featured_title_ar: "منتجات مميزة",

    // JOURNEY
    journey_title: "Our Journey",
    journey_title_ar: "رحلتنا",

    journey_description:
      "Our journey started with a vision to redefine quality and innovation.",
    journey_description_ar:
      "بدأت رحلتنا برؤية لإعادة تعريف الجودة والابتكار.",

    journey_media_type: "image",
    journey_media_desktop_path: "/uploads/home/journey-desktop.jpg",
    journey_media_mobile_path: "/uploads/home/journey-mobile.jpg",
    journey_media_alt: "Our Journey",
    journey_media_alt_ar: "رحلتنا",

    // PROJECT
    project_title: "Our Projects",
    project_title_ar: "مشاريعنا",

    // FITS
    fits_title: "Perfect Fit",
    fits_title_ar: "الملاءمة المثالية",

    fits_description:
      "Designed to fit your lifestyle and business needs.",
    fits_description_ar:
      "مصممة لتناسب أسلوب حياتك واحتياجات عملك.",

    // BRANDS
    brands_title: "Our Brands",
    brands_title_ar: "علاماتنا التجارية",

    // FORM
    form_title: "Get in Touch",
    form_title_ar: "تواصل معنا",

    form_description:
      "Fill out the form and our team will contact you shortly.",
    form_description_ar:
      "املأ النموذج وسيتواصل معك فريقنا قريبًا.",

    form_media_path: "/uploads/home/contact.jpg",
    form_media_alt: "Contact Us",
    form_media_alt_ar: "اتصل بنا",
  },
];

const homeCmsData = async () => {
  try {
    for (const cms of defaultData) {
      const [record, created] = await models.HomeCms.findOrCreate({
        where: { id: cms.id }, // important
        defaults: cms,
      });

      if (created) {
        // console.log("✅ Home CMS created");
      } else {
        // console.log("ℹ️ Home CMS already exists. Skipping.");
      }
    }
  } catch (error) {
    console.error("❌ Failed to seed Home CMS data:", error.message || error);
    throw error;
  }
};

module.exports = { homeCmsData };
