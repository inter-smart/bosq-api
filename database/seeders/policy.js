const { models } = require("../models");

const defaultData = [
  {
    slug: "privacy-policy",
    banner_title: "Privacy Policy",
    content: "Description for privacy policy",
  },
  {
    slug: "terms-and-conditions",
    banner_title: "Terms and Conditions",
    content: "Description for terms and conditions",
  },
];

const policyData = async () => {
  try {
    // for (const policy of defaultData) {
    //   const [record, created] = await models.Policy.findOrCreate({
    //     where: { slug: policy.slug },
    //     defaults: policy,
    //   });

    //   if (created) {
    //     // console.log(`✅ Created policy record for: ${policy.slug}`);
    //   } else {
    //     // console.log(`ℹ️ Policy record for "${policy.slug}" already exists. Skipping.`);
    //   }
    // }
  } catch (error) {
    console.error("❌ Failed to seed policy data:", error.message || error);
    throw error;
  }
};

module.exports = { policyData };
