const { Op } = require("sequelize");
const { formatDate, singleMediaWithoutType, mediaWithoutType, dateFirst } = require("../mediaButtonHelper");
const { buildTitleSection } = require("./common");



  function buildNewsData(news) {
    return {
      news: news.map((item) => ({
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

function buildNewsDetailsData(news, nextNews, prevNews){

  console.log(news)

  return {
    media: mediaWithoutType(news, "media_desktop_path", "media_mobile_path", "media_alt", "media_alt_ar") ?? null,
    media_ar: mediaWithoutType(news, "media_desktop_path_ar", "media_mobile_path_ar", "media_alt", "media_alt_ar") ?? null,
    title: news.title ?? "N/A",
    title_ar: news.title_ar ?? "N/A",
    publishedAt: dateFirst(news.published_date) ?? "N/A",
    description: news.description ?? "N/A",
    description_ar: news.description_ar ?? "N/A",
    nextData: nextNews?.slug ?? null,
    prevData: prevNews?.slug ?? null
  }
}



function buildRelatedNewsSection(cms, news, titleData){
    const title = buildTitleSection(cms, titleData);

  return {
    ...title,
    list: news.map((item) => ({
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
    buildNewsData,
    extractKeywords,
    buildTitleConditions,
    buildNewsDetailsData,
    buildRelatedNewsSection
};
