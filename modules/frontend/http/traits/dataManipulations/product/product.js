const { generateImageUrl } = require("../../../../traits/imageUrlHelper");

const transformProductData = (productData) => {
  if (!productData) {
    return null;
  }

  const { models, sellingPoints, category, projectImages, faqs, ...product } = productData.toJSON();

  const initialModel = models && models.length > 0 ? models[0] : {};

  const { variants = [], ...modelData } = initialModel;

  // Aggregate all attributes across all variants
  const attributesMap = {};

  variants.forEach((variant) => {
    const { attribute_values = [] } = variant;

    attribute_values.forEach((item) => {
      const attr = item.attribute;
      if (!attr) return;

      const key = attr.code || attr.slug;

      if (!attributesMap[key]) {
        attributesMap[key] = {
          id: attr.id,
          name: attr.name,
          name_ar: attr.name_ar,
          code: attr.code,
          slug: attr.slug,
          values: [],
        };
      }

      // Check if value already exists to avoid duplicates
      const valueExists = attributesMap[key].values.some((v) => v.id === item.id);
      if (!valueExists) {
        attributesMap[key].values.push({
          id: item.id,
          value: item.value,
          value_ar: item.value_ar,
          slug: item.slug,
          media_path: item.media_path,
        });
      }
    });
  });

  // Convert to array
  const attributesData = Object.values(attributesMap);

  // Get images from the first variant if available
  const firstVariantImages = variants.length > 0 && variants[0].variant_images ? variants[0].variant_images : [];

  const modelWiseData = {
    id: modelData.id,
    title: modelData.title,
    slug: modelData.slug,
    media_path: generateImageUrl(modelData.media_path),
    images: firstVariantImages.map((img) => ({
      id: img.id,
      media_path: generateImageUrl(img.media_path),
      media_type: img.media_type,
      thumbnail_path: generateImageUrl(img.thumbnail_path),
      is_primary: img.is_primary,
      sort_order: img.sort_order,
    })),
    attributes: attributesData,
  };

  const faqsData = faqs
    ? faqs.map((faq) => ({
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
        question_ar: faq.question_ar,
        answer_ar: faq.answer_ar,
      }))
    : [];

  const projectImagesData = projectImages
    ? projectImages.map((img) => ({
        id: img.id,
        media_path: generateImageUrl(img.media_path),
        media_alt: img.media_alt,
        media_alt_ar: img.media_alt_ar,
      }))
    : [];

  const sellingPointsData = sellingPoints
    ? sellingPoints.map((sp) => ({
        id: sp.id,
        name: sp.name,
        media_path: generateImageUrl(sp.media_path),
      }))
    : [];

  const productBaseData = {
    id: product.id,
    title: product.title,
    title_ar: product.title_ar,
    slug: product.slug,
    description: product.description,
    description_ar: product.description_ar,
    details: {
      details: product.details,
      details_ar: product.details_ar,
      details_points: product.details_points,
      details_points_ar: product.details_points_ar,
    },
    additional_details: product.additional_details,
    additional_details_ar: product.additional_details_ar,
    category_name: category?.name,
    category_name_ar: category?.name_ar,
    selling_points: sellingPointsData,
    project_images: projectImagesData,
    faqs: faqsData,
  };

  return {
    data: {
      productBaseData,
      modelWiseData,
    },
  };
};

const transformModelData = (model) => {
  const { variants = [], ...modelData } = model.toJSON();

  const attributesMap = {};

  variants.forEach((variant) => {
    const { attribute_values = [] } = variant;

    attribute_values.forEach((item) => {
      const attr = item.attribute;
      if (!attr) return;

      const key = attr.code || attr.slug;

      if (!attributesMap[key]) {
        attributesMap[key] = {
          id: attr.id,
          name: attr.name,
          name_ar: attr.name_ar,
          code: attr.code,
          slug: attr.slug,
          values: [],
        };
      }

      // Check if value already exists to avoid duplicates
      const valueExists = attributesMap[key].values.some((v) => v.id === item.id);
      if (!valueExists) {
        attributesMap[key].values.push({
          id: item.id,
          value: item.value,
          value_ar: item.value_ar,
          slug: item.slug,
          media_path: item.media_path,
        });
      }
    });
  });

  // Convert to array
  const attributesData = Object.values(attributesMap);

  // Get images from the first variant if available
  const firstVariantImages = variants.length > 0 && variants[0].variant_images ? variants[0].variant_images : [];

  const modelWiseData = {
    id: modelData.id,
    title: modelData.title,
    slug: modelData.slug,
    media_path: generateImageUrl(modelData.media_path),
    images: firstVariantImages.map((img) => ({
      id: img.id,
      media_path: generateImageUrl(img.media_path),
      media_type: img.media_type,
      is_primary: img.is_primary,
      sort_order: img.sort_order,
    })),
    attributes: attributesData,
  };

  return modelWiseData;
};

module.exports = { transformProductData, transformModelData };
