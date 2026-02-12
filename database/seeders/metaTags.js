const MetaTags = require("../models").models.MetaTags;

/**
 * Seed default meta tags for important pages
 */
const defaultMetaTags = [
  {
    page: "home",
    meta_title: "ErgoSeat – Premium Ergonomic Chairs for Healthy Workspaces",
    meta_title_ar: "إيرغوسيت – كراسي مريحة عالية الجودة لمساحات عمل صحية",
    meta_description:
      "Discover premium ergonomic chairs designed for comfort, posture support, and productivity in modern offices and homes.",
    meta_description_ar:
      "اكتشف كراسي مريحة عالية الجودة مصممة لتعزيز الراحة ودعم وضعية الجلوس وزيادة الإنتاجية في المكاتب والمنازل الحديثة.",
    meta_keywords:
      "ergonomic chair, office chair, comfortable seating, posture support",
    meta_keywords_ar: "كرسي مريح, كراسي مكتب, مقاعد مريحة, دعم وضعية الجلوس",
  },
  {
    page: "about",
    meta_title: "About Us | ErgoSeat Ergonomic Chairs",
    meta_title_ar: "من نحن | إيرغوسيت للكراسي المريحة",
    meta_description:
      "Learn about ErgoSeat’s mission to design ergonomic chairs that enhance comfort, health, and productivity.",
    meta_description_ar:
      "تعرّف على رسالة إيرغوسيت في تصميم كراسي مريحة تعزز الراحة والصحة والإنتاجية.",
    meta_keywords:
      "about ergonomic chairs, office seating brand, comfort innovation",
    meta_keywords_ar:
      "عن الكراسي المريحة, علامة تجارية لكراسي المكتب, ابتكار الراحة",
  },
  {
    page: "products",
    meta_title: "Ergonomic Office Chairs Collection | ErgoSeat",
    meta_title_ar: "مجموعة كراسي المكتب المريحة | إيرغوسيت",
    meta_description:
      "Browse our collection of ergonomic office chairs engineered for long working hours and maximum comfort.",
    meta_description_ar:
      "تصفح مجموعتنا من كراسي المكتب المريحة المصممة لساعات العمل الطويلة وتوفير أقصى درجات الراحة.",
    meta_keywords:
      "ergonomic office chairs, mesh chair, adjustable office chair",
    meta_keywords_ar: "كراسي مكتب مريحة, كرسي شبكي, كرسي مكتب قابل للتعديل",
  },
  {
    page: "blogs",
    meta_title: "Seating Comfort & Ergonomic Tips | ErgoSeat Blog",
    meta_title_ar: "راحة الجلوس ونصائح ergonomics | مدونة إيرغوسيت",
    meta_description:
      "Read expert tips, guides, and insights on ergonomic seating, posture health, and workplace comfort.",
    meta_description_ar:
      "اقرأ نصائح وإرشادات الخبراء حول الجلوس المريح وصحة وضعية الجلوس وراحة مكان العمل.",
    meta_keywords: "ergonomic tips, posture health, office chair guide",
    meta_keywords_ar: "نصائح ergonomics, صحة الجلوس, دليل كراسي المكتب",
  },
   {
    page: "news",
    meta_title: "Seating Comfort & Ergonomic Tips | ErgoSeat Blog",
    meta_title_ar: "راحة الجلوس ونصائح ergonomics | مدونة إيرغوسيت",
    meta_description:
      "Read expert tips, guides, and insights on ergonomic seating, posture health, and workplace comfort.",
    meta_description_ar:
      "اقرأ نصائح وإرشادات الخبراء حول الجلوس المريح وصحة وضعية الجلوس وراحة مكان العمل.",
    meta_keywords: "ergonomic tips, posture health, office chair guide",
    meta_keywords_ar: "نصائح ergonomics, صحة الجلوس, دليل كراسي المكتب",
  },
  {
    page: "contact",
    meta_title: "Contact Us | ErgoSeat",
    meta_title_ar: "تواصل معنا | إيرغوسيت",
    meta_description:
      "Contact ErgoSeat for product inquiries, bulk orders, or customer support.",
    meta_description_ar:
      "تواصل مع إيرغوسيت للاستفسار عن المنتجات أو طلبات الشراء بالجملة أو دعم العملاء.",
    meta_keywords: "contact ergonomic chair company, office chair support",
    meta_keywords_ar: "التواصل مع شركة كراسي مريحة, دعم كراسي المكتب",
  },
  {
    page: "terms-and-conditions",
    meta_title: "Terms and Conditions | ErgoSeat",
    meta_title_ar: "الشروط والأحكام | إيرغوسيت",
    meta_description:
      "Review the terms and conditions governing the use of ErgoSeat’s website and services.",
    meta_description_ar:
      "اطلع على الشروط والأحكام التي تحكم استخدام موقع وخدمات إيرغوسيت.",
    meta_keywords: "terms and conditions, ergonomic chair policies",
    meta_keywords_ar: "الشروط والأحكام, سياسات الكراسي المريحة",
  },
  {
    page: "privacy-policy",
    meta_title: "Privacy Policy | ErgoSeat",
    meta_title_ar: "سياسة الخصوصية | إيرغوسيت",
    meta_description:
      "Understand how ErgoSeat collects, uses, and protects your personal information.",
    meta_description_ar:
      "تعرّف على كيفية جمع واستخدام وحماية إيرغوسيت لبياناتك الشخصية.",
    meta_keywords: "privacy policy, data protection, user privacy",
    meta_keywords_ar: "سياسة الخصوصية, حماية البيانات, خصوصية المستخدم",
  },
  {
    page: "customization",
    meta_title: "ErgoSeat – Premium Ergonomic Chairs for Healthy Workspaces",
    meta_title_ar: "إيرغوسيت – كراسي مريحة عالية الجودة لمساحات عمل صحية",
    meta_description:
      "Discover premium ergonomic chairs designed for comfort, posture support, and productivity in modern offices and homes.",
    meta_description_ar:
      "اكتشف كراسي مريحة عالية الجودة مصممة لتعزيز الراحة ودعم وضعية الجلوس وزيادة الإنتاجية في المكاتب والمنازل الحديثة.",
    meta_keywords:
      "ergonomic chair, office chair, comfortable seating, posture support",
    meta_keywords_ar: "كرسي مريح, كراسي مكتب, مقاعد مريحة, دعم وضعية الجلوس",
    other_meta: `<meta name="description" content="John Doe" />`,
    other_meta_ar: `<meta name="description" content="جون دو" />`,
  },
  {
    page: "ergonomic-chair-guide",
    meta_title: "ErgoSeat – Premium Ergonomic Chairs for Healthy Workspaces",
    meta_title_ar: "إيرغوسيت – كراسي مريحة عالية الجودة لمساحات عمل صحية",
    meta_description:
      "Discover premium ergonomic chairs designed for comfort, posture support, and productivity in modern offices and homes.",
    meta_description_ar:
      "اكتشف كراسي مريحة عالية الجودة مصممة لتعزيز الراحة ودعم وضعية الجلوس وزيادة الإنتاجية في المكاتب والمنازل الحديثة.",
    meta_keywords:
      "ergonomic chair, office chair, comfortable seating, posture support",
    meta_keywords_ar: "كرسي مريح, كراسي مكتب, مقاعد مريحة, دعم وضعية الجلوس",
    other_meta: `<meta name="description" content="John Doe" />`,
    other_meta_ar: `<meta name="description" content="جون دو" />`,
  },
  {
    page: "faqs",
    meta_title: "ErgoSeat – Premium Ergonomic Chairs for Healthy Workspaces",
    meta_title_ar: "إيرغوسيت – كراسي مريحة عالية الجودة لمساحات عمل صحية",
    meta_description:
      "Discover premium ergonomic chairs designed for comfort, posture support, and productivity in modern offices and homes.",
    meta_description_ar:
      "اكتشف كراسي مريحة عالية الجودة مصممة لتعزيز الراحة ودعم وضعية الجلوس وزيادة الإنتاجية في المكاتب والمنازل الحديثة.",
    meta_keywords:
      "ergonomic chair, office chair, comfortable seating, posture support",
    meta_keywords_ar: "كرسي مريح, كراسي مكتب, مقاعد مريحة, دعم وضعية الجلوس",
    other_meta: `<meta name="description" content="John Doe" />`,
    other_meta_ar: `<meta name="description" content="جون دو" />`,
  },
  // material guide
  {
    page: "material-guide",
    meta_title: "ErgoSeat – Premium Ergonomic Chairs for Healthy Workspaces",
    meta_title_ar: "إيرغوسيت – كراسي مريحة عالية الجودة لمساحات عمل صحية",
    meta_description:
      "Discover premium ergonomic chairs designed for comfort, posture support, and productivity in modern offices and homes.",
    meta_description_ar:
      "اكتشف كراسي مريحة عالية الجودة مصممة لتعزيز الراحة ودعم وضعية الجلوس وزيادة الإنتاجية في المكاتب والمنازل الحديثة.",
    meta_keywords:
      "ergonomic chair, office chair, comfortable seating, posture support",
    meta_keywords_ar: "كرسي مريح, كراسي مكتب, مقاعد مريحة, دعم وضعية الجلوس",
    other_meta: `<meta name="description" content="John Doe" />`,
    other_meta_ar: `<meta name="description" content="جون دو" />`,
  },
  {
    page: "delivery-policy",
    meta_title: "ErgoSeat – Premium Ergonomic Chairs for Healthy Workspaces",
    meta_title_ar: "إيرغوسيت – كراسي مريحة عالية الجودة لمساحات عمل صحية",
    meta_description:
      "Discover premium ergonomic chairs designed for comfort, posture support, and productivity in modern offices and homes.",
    meta_description_ar:
      "اكتشف كراسي مريحة عالية الجودة مصممة لتعزيز الراحة ودعم وضعية الجلوس وزيادة الإنتاجية في المكاتب والمنازل الحديثة.",
    meta_keywords:
      "ergonomic chair, office chair, comfortable seating, posture support",
    meta_keywords_ar: "كرسي مريح, كراسي مكتب, مقاعد مريحة, دعم وضعية الجلوس",
    other_meta: `<meta name="description" content="John Doe" />`,
    other_meta_ar: `<meta name="description" content="جون دو" />`,
  },
  // products
  {
    page: "products",
    meta_title: "ErgoSeat – Premium Ergonomic Chairs for Healthy Workspaces",
    meta_title_ar: "إيرغوسيت – كراسي مريحة عالية الجودة لمساحات عمل صحية",
    meta_description:
      "Discover premium ergonomic chairs designed for comfort, posture support, and productivity in modern offices and homes.",
    meta_description_ar:
      "اكتشف كراسي مريحة عالية الجودة مصممة لتعزيز الراحة ودعم وضعية الجلوس وزيادة الإنتاجية في المكاتب والمنازل الحديثة.",
    meta_keywords:
      "ergonomic chair, office chair, comfortable seating, posture support",
    meta_keywords_ar: "كرسي مريح, كراسي مكتب, مقاعد مريحة, دعم وضعية الجلوس",
    other_meta: `<meta name="description" content="John Doe" />`,
    other_meta_ar: `<meta name="description" content="جون دو" />`,
  },
];

const seedMetaTags = async () => {
  try {
    for (const tagData of defaultMetaTags) {
      const [record, created] = await MetaTags.findOrCreate({
        where: { page: tagData.page },
        defaults: tagData,
      });

      if (created) {
        // console.log(`✅ Created meta tags for page: ${tagData.page}`);
      } else {
        // console.log(`ℹ️ Meta tags for page "${tagData.page}" already exist. Skipping.`);
      }
    }
  } catch (error) {
    console.error("❌ Failed to seed meta tags:", error.message || error);
    throw error;
  }
};

module.exports = { seedMetaTags };
