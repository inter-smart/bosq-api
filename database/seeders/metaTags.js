const MetaTags = require("../models").models.MetaTags;

/**
 * Seed default meta tags for important pages
 */
const defaultMetaTags = [
    {
        page: "home",
        meta_title: "Go EC - Smarter Energy Solutions",
        meta_description: "Discover innovative energy solutions, sustainability practices, and eco-friendly technologies with Go EC.",
        meta_keywords: "energy solutions, sustainable energy, eco-friendly technology",
        canonical_url: "/",
    },
    {
        page: "about",
        meta_title: "About Us | Go EC",
        meta_description: "Learn more about Go EC, our mission, and our commitment to sustainable energy innovation.",
        meta_keywords: "about go ec, energy company, sustainable innovation",
        canonical_url: "/about",
    },
     {
        page: "app-page",
        meta_title: "About Us | Go EC",
        meta_description: "Learn more about Go EC, our mission, and our commitment to sustainable energy innovation.",
        meta_keywords: "about go ec, energy company, sustainable innovation",
        canonical_url: "/about",
    },
     {
        page: "go-ec-smart-card",
        meta_title: "About Us | Go EC",
        meta_description: "Learn more about Go EC, our mission, and our commitment to sustainable energy innovation.",
        meta_keywords: "about go ec, energy company, sustainable innovation",
        canonical_url: "/about",
    },
     {
        page: "invest-in-go-ec",
        meta_title: "About Us | Go EC",
        meta_description: "Learn more about Go EC, our mission, and our commitment to sustainable energy innovation.",
        meta_keywords: "about go ec, energy company, sustainable innovation",
        canonical_url: "/about",
    },
    {
        page: "blog-listing",
        meta_title: "Energy Insights & News | Go EC Blog",
        meta_description: "Read the latest articles, trends, and news in energy, sustainability, and eco-friendly technologies.",
        meta_keywords: "energy blog, sustainable energy news, eco-friendly insights",
        canonical_url: "/blog-listing",
    },
    {
        page: "news-listing",
        meta_title: "Energy Insights & News | Go EC Blog",
        meta_description: "Read the latest articles, trends, and news in energy, sustainability, and eco-friendly technologies.",
        meta_keywords: "energy blog, sustainable energy news, eco-friendly insights",
        canonical_url: "/blog-listing",
    },
    {
        page: "contact",
        meta_title: "Contact Us | Go EC",
        meta_description: "Get in touch with Go EC for support, partnerships, or general inquiries.",
        meta_keywords: "contact go ec, energy support, sustainability partnerships",
        canonical_url: "/contact",
    },
    {
        page: "terms-and-conditions",
        meta_title: "Terms and Conditions | Go EC",
        meta_description: "Read the terms and conditions for using Go EC’s platform and services.",
        meta_keywords: "terms of service, go ec policies",
        canonical_url: "/terms-and-conditions",
    },
    {
        page: "privacy-policy",
        meta_title: "Privacy Policy | Go EC",
        meta_description: "Understand how Go EC collects, uses, and protects your personal data.",
        meta_keywords: "privacy policy, data protection, user privacy",
        canonical_url: "/privacy-policy",
    },
];

const seedMetaTags = async () => {
    try {
        // for (const tagData of defaultMetaTags) {
        //     const [record, created] = await MetaTags.findOrCreate({
        //         where: { page: tagData.page },
        //         defaults: tagData,
        //     });

        //     if (created) {
        //         // console.log(`✅ Created meta tags for page: ${tagData.page}`);
        //     } else {
        //         // console.log(`ℹ️ Meta tags for page "${tagData.page}" already exist. Skipping.`);
        //     }
        // }
    } catch (error) {
        console.error("❌ Failed to seed meta tags:", error.message || error);
        throw error;
    }
};

module.exports = { seedMetaTags };
