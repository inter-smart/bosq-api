function buildPrivacyPolicyData(categories) {
  if (!Array.isArray(categories) || categories.length === 0) {
    return {
        categories: [],
    };
  }

  return {
      categories: categories.map((item) => ({
        id: item?.id,
        title: item?.title ?? "N/A",
        title_ar: item?.title_ar ?? "N/A",
        description: item?.description ?? "N/A",
        description_ar: item?.description_ar ?? "N/A",
      })),
  };
}

module.exports = {
  buildPrivacyPolicyData,
};
