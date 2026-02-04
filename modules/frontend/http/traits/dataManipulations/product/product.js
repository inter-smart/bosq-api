const { generateImageUrl } = require("../../../../traits/imageUrlHelper");

const transformProductData = (productData, startFromVariant = false) => {
  if (!productData) {
    return null;
  }

  const jsonData = productData.toJSON();

  // Handle case when query starts from variant
  if (startFromVariant) {
    const { productModel, variant_images = [], attribute_values = [], ...variant } = jsonData;
    const initialModel = productModel || {};

    const attributesMap = {};
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

    const orderedImages = variant_images.sort((a, b) => a.sort_order - b.sort_order);

    const variantData = {
      id: variant?.id,
      title: variant?.title,
      title_ar: variant?.title_ar,
      slug: variant?.sku,
      price: variant?.price,
      stock: variant?.stock,
      model_id: initialModel?.id,
      model_media: generateImageUrl(initialModel?.media_path),
      model_slug: initialModel.slug,
      model_title: initialModel.title,
      attributes: Object.values(attributesMap),
      images: orderedImages.map((img, index) => ({
        id: img.id,
        media_path: generateImageUrl(img.media_path),
        media_type: img.media_type,
        thumbnail_path: generateImageUrl(img.thumbnail_path),
        is_primary: index === 0,
        sort_order: img.sort_order,
      })),
    };

    return {
      data: {
        variantData,
      },
    };
  }

  // Original logic when starting from ProductBase
  const { models } = jsonData;

  const initialModel = models && models.length > 0 ? models[0] : {};

  const { variants = [] } = initialModel;

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

  // Get images from the first variant if available
  const firstVariantImages = variants.length > 0 && variants[0].variant_images ? variants[0].variant_images : [];
  const variant = variants[0] ? variants[0] : null;

  const orderedImages = firstVariantImages.sort((a, b) => a.sort_order - b.sort_order);

  const variantData = {
    id: variant?.id,
    title: variant?.title,
    title_ar: variant?.title_ar,
    slug: variant?.sku,
    price: variant?.price,
    stock: variant?.stock,
    model_id: initialModel?.id,
    model_media: generateImageUrl(initialModel?.media_path),
    model_slug: initialModel.slug,
    model_title: initialModel.title,
    attributes: Object.values(attributesMap),
    images: orderedImages.map((img, index) => ({
      id: img.id,
      media_path: generateImageUrl(img.media_path),
      media_type: img.media_type,
      thumbnail_path: generateImageUrl(img.thumbnail_path),
      is_primary: index === 0,
      sort_order: img.sort_order,
    })),
  };

  return {
    data: {
      variantData,
    },
  };
};

const transformModelData = (model) => {
  if (!model) {
    return null;
  }

  const { variants = [], ...modelData } = model.toJSON();
  const initialModel = modelData;
  // Get images from the first variant if available
  const firstVariantImages = variants.length > 0 && variants[0].variant_images ? variants[0].variant_images : [];
  const variant = variants[0] ? variants[0] : null;

  const attributesMap = {};

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

  const orderedImages = getOrderedImagesFn(firstVariantImages);

  const modelWiseData = {
    id: variant?.id,
    title: variant?.title,
    title_ar: variant?.title_ar,
    slug: variant?.sku,
    price: variant?.price,
    stock: variant?.stock,
    model_id: initialModel?.id,
    model_media: generateImageUrl(initialModel?.media_path),
    model_slug: initialModel.slug,
    model_title: initialModel.title,
    attributes: Object.values(attributesMap),
    images: orderedImages.map((img, index) => ({
      id: img.id,
      media_path: generateImageUrl(img.media_path),
      media_type: img.media_type,
      thumbnail_path: generateImageUrl(img.thumbnail_path),
      is_primary: index === 0,
      sort_order: img.sort_order,
    })),
  };

  return modelWiseData;
};

const buildAttributesFromVariants = (variants = []) => {
  const attributeMap = new Map();

  variants.forEach((variant) => {
    variant.attribute_values?.forEach((av) => {
      const attr = av.attribute;
      if (!attr) return;

      // Initialize attribute entry
      if (!attributeMap.has(attr.id)) {
        attributeMap.set(attr.id, {
          id: attr.id,
          name: attr.name,
          slug: attr.slug,
          code: attr.code,
          values: [],
        });
      }

      const attributeEntry = attributeMap.get(attr.id);

      // Values now come from attribute.values
      attr.values?.forEach((value) => {
        const exists = attributeEntry.values.some((v) => v.id === value.id);

        if (!exists) {
          attributeEntry.values.push({
            id: value.id,
            attribute_id: value.attribute_id,
            value: value.value,
            slug: value.slug,
          });
        }
      });
    });
  });

  return Array.from(attributeMap.values());
};

const getOrderedImagesFn = (images = []) =>
  images.sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;

    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });

const generateQueryParams = (variantSku, model, attributes = []) => {
  let params = [];

  if (variantSku) {
    params.push(`sku=${variantSku}`);
  }

  if (attributes && attributes.length > 0) {
    attributes.forEach((attr) => {
      const attrKey = attr.slug;
      const attrValue = attr.values?.[0]?.slug || attr.values?.[0]?.value;
      if (attrKey && attrValue) {
        params.push(`attr_${attrKey}=${attrValue}`);
      }
    });
  }

  return params.length > 0 ? `?${params.join("&")}` : "";
};

const generateProductBasedata = (productData) => {
  const { faqs = [], projectImages = [], sellingPoints = [], variants = [], category, ...product } = productData.toJSON();

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

  return productBaseData;
};

module.exports = { transformProductData, transformModelData, buildAttributesFromVariants, generateQueryParams, generateProductBasedata };
