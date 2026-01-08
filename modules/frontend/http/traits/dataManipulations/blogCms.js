const { formatDate, singleMediaWithoutType, mediaWithoutType } = require("../mediaButtonHelper");

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



module.exports = {
    buildHeroData,
    buildBlogData,
};
