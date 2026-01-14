const { Op } = require("sequelize");
const { formatDate, singleMediaWithoutType, mediaWithoutType, dateFirst } = require("../mediaButtonHelper");
const { buildBannerSection, buildTitleSection } = require("./common");

    function buildHeroData(blogCms) {
    return {
      media:
        mediaWithoutType(
          blogCms,
          "media_desktop_path",
          "media_mobile_path",
          "media_alt",
          "media_alt_ar"
        ) ?? null,
      title: blogCms.title ?? "N/A",
      title_ar: blogCms.title_ar ?? "N/A",
      description: blogCms.description ?? "N/A",
      description_ar: blogCms.description_ar ?? "N/A",
      heroTitle: blogCms.banner_title ?? "N/A",
      heroTitle_ar: blogCms.banner_title_ar ?? "N/A",
      heroDescription: blogCms.banner_description ?? "N/A",
      heroDescription_ar: blogCms.banner_description_ar ?? "N/A",
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

function buildBlogDetailsData(blog, nextBlog, prevBlog){

  return {
    media: mediaWithoutType(blog, "media_desktop_path", "media_mobile_path", "media_alt", "media_alt_ar") ?? null,
    title: blog.title ?? "N/A",
    title_ar: blog.title_ar ?? "N/A",
    publishedAt: dateFirst(blog.published_date) ?? "N/A",
    description: blog.description ?? "N/A",
    description_ar: blog.description_ar ?? "N/A",
    nextBlog: nextBlog?.slug ?? null,
    prevBlog: prevBlog?.slug ?? null
  }
}


function buildRelatedBlogSection(cms, blog, titleData){
  const title = buildTitleSection(cms, titleData);
  return {
    ...title,
    blog: blog.map((item) => ({
      id: item.id,
      media: singleMediaWithoutType(item, "thumbnail", "thumbnail_alt", "thumbnail_alt_ar"),
      slug: item.slug ?? "N/A",
      publishedAt: dateFirst(item.published_date) ?? "N/A",
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
