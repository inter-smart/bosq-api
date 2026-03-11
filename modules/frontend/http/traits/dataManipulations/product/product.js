const { generateImageUrl } = require("../../../../traits/imageUrlHelper");

const transformProductData = (productData, startFromVariant = false) => {
  if (!productData) {
    return null;
  }

  const jsonData = productData.toJSON();

  // Handle case when query starts from variant
  if (startFromVariant) {
    const { productModel, variant_images = [], attribute_values = [], categories = [], projectImages = [], faqs = [], ...variant } = jsonData;
    const initialModel = productModel || {};

    const attributesMap = {};
    attribute_values.forEach((item) => {
      const attr = item.attribute;
      if (!attr) return;

      const key = attr.code || attr.slug;

      if (!attributesMap[key]) {
        attributesMap[key] = {
          id: attr?.id,
          name: attr?.name,
          name_ar: attr?.name_ar,
          code: attr?.code,
          slug: attr?.slug,
          values: [],
        };
      }

      const valueExists = attributesMap[key].values.some((v) => v.id === item.id);
      if (!valueExists) {
        attributesMap[key].values.push({
          id: item?.id,
          value: item?.value,
          value_ar: item?.value_ar,
          slug: item?.slug,
          media_path: item?.media_path,
        });
      }
    });

    const orderedImages = getOrderedImagesFn(variant_images);

    const variantData = {
      id: variant?.id,
      title: {
        title: variant?.title,
        title_ar: variant?.title_ar,
      },
      design_title: {
        design_title_ar: variant?.design_title_ar,
        design_title: variant?.design_title,
      },
      isWishlisted: false,
      variant_image: generateImageUrl(variant?.media_path),
      hover_image: generateImageUrl(variant?.hover_media_path),
      slug: variant?.sku,
      price: variant?.price,
      stock: variant?.stock,
      is_featured: variant?.is_featured,
      brochure: generateImageUrl(variant?.brochure),
      enhance: {
        enhance: variant?.enhance_title || "",
        enhance_ar: variant?.enhance_title_ar || "",
      },
      description: {
        description: variant?.description || "",
        description_ar: variant?.description_ar || "",
      },
      details: {
        details: variant?.details || "",
        details_ar: variant?.details_ar || "",
        details_points: variant?.details_points || "",
        details_points_ar: variant?.details_points_ar || "",
      },
      additional_details: {
        additional_details_en: variant?.additional_details || "",
        additional_details_ar: variant?.additional_details_ar || "",
      },
      model_id: initialModel?.id,
      model_media: generateImageUrl(initialModel?.media_path),
      model_slug: initialModel?.slug,
      model_title: initialModel?.title,
      model_title_ar: initialModel?.title_ar,
      attributes: Object.values(attributesMap),
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        name_ar: c.name_ar,
        slug: c.slug,
      })),
      images: orderedImages.map((img, index) => ({
        id: img?.id,
        media_path: generateImageUrl(img?.media_path),
        media_type: img?.media_type,
        thumbnail_path: generateImageUrl(img?.thumbnail_path),
        is_primary: index === 0,
        sort_order: img?.sort_order,
      })),
      project_images: projectImages.map((img) => ({
        id: img?.id,
        media_path: generateImageUrl(img?.media_path),
        media_alt: img?.media_alt,
        media_alt_ar: img?.media_alt_ar,
      })),
      faqs: faqs.map((faq) => ({
        id: faq?.id,
        question: faq?.question,
        answer: faq?.answer,
        question_ar: faq?.question_ar,
        answer_ar: faq?.answer_ar,
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
          id: item?.id,
          value: item?.value,
          value_ar: item?.value_ar,
          slug: item?.slug,
          media_path: item?.media_path,
        });
      }
    });
  });

  // Get images from the first variant if available
  const firstVariantImages = variants.length > 0 && variants[0]?.variant_images ? variants[0]?.variant_images : [];
  const variant = variants[0] ? variants[0] : null;

  const orderedImages = getOrderedImagesFn(firstVariantImages);

  const variantData = {
    id: variant?.id,
    title: {
      title: variant?.title || "",
      title_ar: variant?.title_ar || "",
    },
    design_title: {
      design_title_ar: variant?.design_title_ar || "",
      design_title: variant?.design_title || "",
    },
    isWishlisted: false,
    variant_image: generateImageUrl(variant?.media_path),
    hover_image: generateImageUrl(variant?.hover_media_path),
    slug: variant?.sku,
    price: variant?.price,
    stock: variant?.stock,
    brochure: generateImageUrl(variant?.brochure),
    description: {
      description: variant?.description || "",
      description_ar: variant?.description_ar || "",
    },
    details: {
      details: variant?.details || "",
      details_ar: variant?.details_ar || "",
      details_points: variant?.details_points || "",
      details_points_ar: variant?.details_points_ar || "",
    },
    additional_details: {
      additional_details_en: variant?.additional_details || "",
      additional_details_ar: variant?.additional_details_ar || "",
    },
    model_id: initialModel?.id,
    model_media: generateImageUrl(initialModel?.media_path),
    model_slug: initialModel?.slug,
    model_title: initialModel?.title,
    model_title_ar: initialModel?.title_ar,
    attributes: Object.values(attributesMap),
    images: orderedImages.map((img, index) => ({
      id: img?.id,
      media_path: generateImageUrl(img?.media_path),
      media_type: img?.media_type,
      thumbnail_path: generateImageUrl(img?.thumbnail_path),
      is_primary: index === 0,
      sort_order: img?.sort_order,
    })),
    project_images: projectImages.map((img) => ({
      id: img?.id,
      media_path: generateImageUrl(img?.media_path),
      media_alt: img?.media_alt,
      media_alt_ar: img?.media_alt_ar,
    })),
    faqs: faqs.map((faq) => ({
      id: faq?.id,
      question: faq?.question,
      answer: faq?.answer,
      question_ar: faq?.question_ar,
      answer_ar: faq?.answer_ar,
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
  const firstVariantImages = variants.length > 0 && variants[0]?.variant_images ? variants[0]?.variant_images : [];
  const variant = variants[0] ? variants[0] : null;

  const attributesMap = {};

  const { attribute_values = [] } = variant;

  attribute_values.forEach((item) => {
    const attr = item.attribute;
    if (!attr) return;

    const key = attr?.code || attr?.slug;

    if (!attributesMap[key]) {
      attributesMap[key] = {
        id: attr?.id,
        name: attr?.name,
        name_ar: attr?.name_ar,
        code: attr?.code,
        slug: attr?.slug,
        values: [],
      };
    }

    // Check if value already exists to avoid duplicates
    const valueExists = attributesMap[key].values.some((v) => v.id === item.id);
    if (!valueExists) {
      attributesMap[key].values.push({
        id: item?.id,
        value: item?.value,
        value_ar: item?.value_ar,
        slug: item?.slug,
        media_path: item?.media_path,
      });
    }
  });

  const orderedImages = getOrderedImagesFn(firstVariantImages);

  const modelWiseData = {
    id: variant?.id,
    title: {
      title: variant?.title,
      title_ar: variant?.title_ar,
    },
    design_title: {
      design_title_ar: variant?.design_title_ar || "",
      design_title: variant?.design_title || "",
    },
    isWishlisted: false,
    slug: variant?.sku,
    variant_image: generateImageUrl(variant?.media_path),
    hover_image: generateImageUrl(variant?.hover_media_path),
    price: variant?.price,
    stock: variant?.stock,
    brochure: generateImageUrl(variant?.brochure),
    description: {
      description: variant?.description || "",
      description_ar: variant?.description_ar || "",
    },
    details: {
      details: variant?.details || "",
      details_ar: variant?.details_ar || "",
      details_points: variant?.details_points || "",
      details_points_ar: variant?.details_points_ar || "",
    },
    additional_details: {
      additional_details_en: variant?.additional_details || "",
      additional_details_ar: variant?.additional_details_ar || "",
    },
    model_id: initialModel?.id,
    model_media: generateImageUrl(initialModel?.media_path),
    model_slug: initialModel?.slug,
    model_title: initialModel?.title,
    model_title_ar: initialModel?.title_ar,
    attributes: Object.values(attributesMap),
    categories: (variant?.categories ?? []).map((c) => ({
      id: c?.id,
      name: c?.name,
      name_ar: c?.name_ar,
      slug: c?.slug,
    })),
    images: orderedImages.map((img, index) => ({
      id: img?.id,
      media_path: generateImageUrl(img?.media_path),
      media_type: img?.media_type,
      thumbnail_path: generateImageUrl(img?.thumbnail_path),
      is_primary: index === 0,
      sort_order: img.sort_order,
    })),
    project_images: projectImages.map((img) => ({
      id: img?.id,
      media_path: generateImageUrl(img?.media_path),
      media_alt: img?.media_alt,
      media_alt_ar: img?.media_alt_ar,
    })),
    faqs: faqs.map((faq) => ({
      id: faq?.id,
      question: faq?.question,
      answer: faq?.answer,
      question_ar: faq?.question_ar,
      answer_ar: faq?.answer_ar,
    })),
  };

  return modelWiseData;
};

const buildAttributesFromVariants = (variants = []) => {
  const attributeMap = new Map();

  variants.forEach((variant) => {
    variant.attribute_values?.forEach((av) => {
      const attr = av?.attribute;
      if (!attr) return;

      // Initialize attribute entry
      if (!attributeMap.has(attr.id)) {
        attributeMap.set(attr.id, {
          id: attr?.id,
          name: attr?.name,
          name_ar: attr?.name_ar,
          slug: attr?.slug,
          code: attr?.code,
          values: [],
        });
      }

      const attributeEntry = attributeMap.get(attr?.id);

      // Values now come from attribute.values
      attr.values?.forEach((value) => {
        const exists = attributeEntry.values.some((v) => v?.id === value?.id);

        if (!exists) {
          attributeEntry.values.push({
            id: value?.id,
            attribute_id: value?.attribute_id,
            value: value?.value,
            slug: value?.slug,
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

const generateQueryParams = (variantSku, attributes = []) => {
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
  const data = productData?.toJSON?.() || {};

  const { sellingPoints = [], variants = [], category, ...product } = data;

  const sellingPointsData =
    sellingPoints?.map((sp) => ({
      id: sp?.id,
      name: sp?.name,
      name_ar: sp?.name_ar,
      media_path: generateImageUrl?.(sp?.media_path),
    })) || [];

  const productBaseData = {
    id: product?.id,
    title: product?.title,
    title_ar: product?.title_ar,
    slug: product?.slug,
    category_name: category?.name,
    category_name_ar: category?.name_ar,
    selling_points: sellingPointsData,
  };

  return productBaseData;
};

const isItemWishListed = (variantId, wishlistItems) => {
  return wishlistItems.some((item) => {
    return item.product_variant_id == variantId;
  });
};

const checkInvalidProducts = (cartItems) => {
  return cartItems.some((item) => {
    const variant = item.variant;

    if (!variant) return true;
    if (variant?.stock <= 0) return true;
    if (variant?.stock < item?.quantity) return true;

    return false;
  });
};

module.exports = {
  transformProductData,
  transformModelData,
  buildAttributesFromVariants,
  generateQueryParams,
  generateProductBasedata,
  isItemWishListed,
  checkInvalidProducts,
};
