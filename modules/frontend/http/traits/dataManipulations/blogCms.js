const { Op } = require("sequelize");
const { formatDate, singleMediaWithoutType, mediaWithoutType } = require("../mediaButtonHelper");
const { buildTitleSection } = require("./common");

function buildHeroData(cmsData) {
  return {
    media:
      mediaWithoutType(
        cmsData,
        "media_desktop_path",
        "media_mobile_path",
        "media_alt",
        "media_alt_ar"
      ) ?? null,

    media_ar:
      mediaWithoutType(
        cmsData,
        "media_desktop_path_ar",
        "media_mobile_path_ar",
        "media_alt",
        "media_alt_ar"
      ) ?? null,
    title: cmsData.title ?? "N/A",
    title_ar: cmsData.title_ar ?? "N/A",
    description: cmsData.description ?? "N/A",
    description_ar: cmsData.description_ar ?? "N/A",
    heroTitle: cmsData.banner_title ?? "N/A",
    heroTitle_ar: cmsData.banner_title_ar ?? "N/A",
    heroDescription: cmsData.banner_description ?? "N/A",
    heroDescription_ar: cmsData.banner_description_ar ?? "N/A",
  };
}

function buildBlogData(blogs) {
  return {
    blog: blogs.map((item) => ({
      id: item.id,
      slug: item.slug ?? "N/A",
      publishedAt: formatDate(item.published_date) ?? "N/A",
      title: item.title ?? "N/A",
      title_ar: item.title_ar ?? "N/A",
      media: singleMediaWithoutType(item, "thumbnail", "thumbnail_alt", "thumbnail_alt_ar"),
    })),
  };
}

const extractKeywords = (text = "") => {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter(word => word.length > 3) // ignore small words
    .slice(0, 5); // limit keywords
};

const buildTitleConditions = (keywords) => {
  return keywords.map(word => ({
    [Op.or]: [
      { title: { [Op.iLike]: `%${word}%` } },     // PostgreSQL (case-insensitive)
      { title_ar: { [Op.iLike]: `%${word}%` } },
    ],
  }));
};

function buildBlogDetailsData(blog, nextBlog, prevBlog) {

  return {
    media: mediaWithoutType(blog, "media_desktop_path", "media_mobile_path", "media_alt", "media_alt_ar") ?? null,
    media_ar: mediaWithoutType(blog, "media_desktop_path_ar", "media_mobile_path_ar", "media_alt", "media_alt_ar") ?? null,
    title: blog.title ?? "N/A",
    title_ar: blog.title_ar ?? "N/A",
    publishedAt: formatDate(blog.published_date) ?? "N/A",
    description: blog.description ?? "N/A",
    description_ar: blog.description_ar ?? "N/A",
    nextData: nextBlog?.slug ?? null,
    prevData: prevBlog?.slug ?? null
  }
}


function buildRelatedBlogSection(cms, blog, titleData) {
  const title = buildTitleSection(cms, titleData);
  return {
    ...title,
    list: blog.map((item) => ({
      id: item.id,
      media: singleMediaWithoutType(item, "thumbnail", "thumbnail_alt", "thumbnail_alt_ar"),
      slug: item.slug ?? "N/A",
      publishedAt: formatDate(item.published_date) ?? "N/A",
      isPopular: true,
      readTime: 4,
      title: item.title ?? "N/A",
      title_ar: item.title_ar ?? "N/A",
    }))
  }
}







module.exports = {
  buildHeroData,
  buildBlogData,
  extractKeywords,
  buildTitleConditions,
  buildBlogDetailsData,
  buildRelatedBlogSection
};
