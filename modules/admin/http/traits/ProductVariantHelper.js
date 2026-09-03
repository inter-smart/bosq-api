const { Op } = require("sequelize");
const { models, sequelize } = require("../../../../database/models");

/**
 * The ONLY place in the codebase allowed to write ProductVariants.is_primary.
 * Guarantees at most one variant per product_model_id is primary, including
 * across soft-deleted rows, by always clearing the old primary before setting
 * the new one inside the caller's transaction.
 *
 * @param {number} productModelId
 * @param {object} opts
 * @param {import("sequelize").Transaction} opts.transaction - required
 * @param {number} [opts.excludeId] - variant to exclude from being (re)picked (e.g. the one being deleted/deactivated)
 * @param {number} [opts.forceId] - explicit "set this one primary" target (admin action); when omitted, the next eligible variant is auto-picked
 */
const reassignPrimaryIfNeeded = async (productModelId, { transaction, excludeId = null, forceId = null } = {}) => {
  if (!transaction) {
    throw new Error("Transaction is required for reassignPrimaryIfNeeded");
  }
  if (!productModelId) {
    throw new Error("productModelId is required for reassignPrimaryIfNeeded");
  }

  // Serialize concurrent calls for the same model — without this, two
  // simultaneous requests could both read "no primary yet" and both write true.
  const siblings = await models.ProductVariants.findAll({
    where: { product_model_id: productModelId },
    attributes: ["id", "is_primary", "status", "sort_order", "deletedAt"],
    paranoid: false, // a soft-deleted row can still be holding is_primary=true
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  let targetId = forceId ?? null;

  if (!targetId) {
    const eligible = siblings
      .filter((v) => v.id !== excludeId && v.status === true && !v.deletedAt)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.id - b.id);
    targetId = eligible.length > 0 ? eligible[0].id : null;
  }

  const currentPrimaries = siblings.filter((v) => v.is_primary && v.id !== targetId);

  if (currentPrimaries.length > 0) {
    await models.ProductVariants.update(
      { is_primary: false },
      {
        where: { id: { [Op.in]: currentPrimaries.map((v) => v.id) } },
        paranoid: false,
        transaction,
      },
    );
  }

  if (targetId) {
    await models.ProductVariants.update({ is_primary: true }, { where: { id: targetId }, paranoid: false, transaction });
  }

  // Safety net: never allow committing a state with more than one primary for this model.
  const finalCount = await models.ProductVariants.count({
    where: { product_model_id: productModelId, is_primary: true },
    paranoid: false,
    transaction,
  });
  if (finalCount > 1) {
    throw new Error(`Invariant violated: model ${productModelId} would end up with ${finalCount} primary variants`);
  }

  return targetId;
};

const createOrUpdateVariantAttributes = async (transaction, attributes, product_model_id, operation, variantId = null, meta = {}) => {
  // Validate required parameters
  if (!transaction) {
    throw new Error("Transaction is required");
  }

  let parsedAttributes = attributes;

  if ((operation == "create" && !Array.isArray(attributes)) || attributes.length === 0) {
    throw new Error("Attributes array is required and cannot be empty");
  }

  if (!product_model_id) {
    throw new Error("Product model ID is required");
  }

  if (!["create", "update"].includes(operation)) {
    throw new Error("Invalid operation. Must be 'create' or 'update'");
  }

  if (operation === "update" && !variantId) {
    throw new Error("Variant ID is required for update operation");
  }

  // Verify product exists
  const product = await models.ProductModels.findByPk(product_model_id, {
    attributes: ["id", "code", "base_price"],
    transaction,
  });

  if (!product) {
    throw new Error("Product not found");
  }

  const baseSku = product.code || "PROD";
  const basePrice = Number(product.base_price || 0);

  if (operation == "update") {
    parsedAttributes = JSON.parse(attributes);
  }

  const variantCombinations = createProductVariants(parsedAttributes, baseSku);

  if (variantCombinations.length === 0) {
    throw new Error("No valid product variants could be created from the provided attributes");
  }

  const createdVariants = [];

  switch (operation) {
    case "create": {
      // If this model has no variants yet, the first one created below
      // becomes the model's primary (listing representative) by default.
      const hadExistingVariants =
        (await models.ProductVariants.count({ where: { product_model_id }, paranoid: false, transaction })) > 0;

      for (const variantData of variantCombinations) {
        const createdVariant = await models.ProductVariants.create(
          {
            product_model_id: product_model_id,
            sku: variantData.sku,
            product_code: null,
            price: basePrice + variantData.additional_price,
            stock: 0,
            status: true,
          },
          { transaction },
        );

        for (const attr of variantData.attributes) {
          await models.ProductVariantAttributes.create(
            {
              product_variant_id: createdVariant.id,
              attribute_id: attr.attribute_id,
              attribute_value_id: attr.attribute_value_id,
              price: attr.price,
            },
            { transaction },
          );
        }

        createdVariants.push(createdVariant);
      }

      if (!hadExistingVariants && createdVariants.length > 0) {
        await reassignPrimaryIfNeeded(product_model_id, { transaction, forceId: createdVariants[0].id });
        createdVariants[0].is_primary = true;
      }
      break;
    }

    case "update": {
      const currentVariant = await models.ProductVariants.findByPk(variantId, { transaction });

      if (!currentVariant) {
        throw new Error("Product Variant not found for update");
      }

      const {
        sort_order,
        status,
        stock,
        media_path,
        design_title,
        design_title_ar,
        hover_media_path,
        title,
        title_ar,
        is_featured,
        brochure,
        description,
        description_ar,
        details,
        details_ar,
        details_points,
        details_points_ar,
        additional_details,
        additional_details_ar,
        enhance_title,
        enhance_title_ar,
      } = meta;

      // Delete existing variant attributes (hard delete to avoid unique constraint issues)
      await models.ProductVariantAttributes.destroy({
        where: { product_variant_id: variantId },
        force: true, // Hard delete instead of soft delete
        transaction,
      });

      // For update, we use the first combination since we're updating a single variant
      const variantData = variantCombinations[0];

      await currentVariant.update(
        {
          sku: variantData.sku,
          title: title || "",
          title_ar: title_ar || "",
          product_code: null,
          price: basePrice + variantData.additional_price,
          stock: stock ?? currentVariant.stock,
          status: status ?? currentVariant.status,
          sort_order: sort_order ?? currentVariant.sort_order,
          media_path: media_path ?? currentVariant.media_path,
          enhance_title: enhance_title ?? currentVariant.enhance_title,
          enhance_title_ar: enhance_title_ar ?? currentVariant.enhance_title_ar,
          design_title: design_title ?? currentVariant.design_title,
          design_title_ar: design_title_ar ?? currentVariant.design_title_ar,
          hover_media_path: hover_media_path ?? currentVariant.hover_media_path,
          is_featured: is_featured ?? currentVariant.is_featured,
          brochure: brochure ?? currentVariant.brochure,
          description: description ?? currentVariant.description,
          description_ar: description_ar ?? currentVariant.description_ar,
          details: details ?? currentVariant.details,
          details_ar: details_ar ?? currentVariant.details_ar,
          details_points: details_points ?? currentVariant.details_points,
          details_points_ar: details_points_ar ?? currentVariant.details_points_ar,
          additional_details: additional_details ?? currentVariant.additional_details,
          additional_details_ar: additional_details_ar ?? currentVariant.additional_details_ar,
        },
        { transaction },
      );

      // If this update deactivates the model's primary variant, hand the
      // primary flag off to another active variant of the same model so the
      // model doesn't silently disappear from listings. `is_primary` itself
      // is deliberately not accepted from this form — see reassignPrimaryIfNeeded.
      if (status === false && currentVariant.is_primary) {
        await reassignPrimaryIfNeeded(currentVariant.product_model_id, { transaction, excludeId: currentVariant.id });
      }

      // Create new variant attributes
      for (const attr of variantData.attributes) {
        await models.ProductVariantAttributes.create(
          {
            product_variant_id: currentVariant.id,
            attribute_id: attr.attribute_id,
            attribute_value_id: attr.attribute_value_id,
            price: attr.price,
          },
          { transaction },
        );
      }

      createdVariants.push(currentVariant);
      break;
    }

    default:
      throw new Error("Invalid operation for variant attributes");
  }

  return createdVariants;
};

const updateVariantsPrices = async (transaction, product_model_id, base_price) => {
  try {
    // 1. Get variant IDs
    const productVariants = await models.ProductVariants.findAll({
      attributes: ["id"],
      where: { product_model_id },
      transaction,
      raw: true,
    });

    if (!productVariants.length) {
      await transaction.commit();
      return;
    }

    const variantIds = productVariants.map((v) => v.id);

    // 2. Aggregate prices in DB
    const variantTotals = await models.ProductVariantAttributes.findAll({
      attributes: ["product_variant_id", [sequelize.fn("SUM", sequelize.col("price")), "total_price"]],
      where: {
        product_variant_id: { [Op.in]: variantIds },
      },
      group: ["product_variant_id"],
      transaction,
      raw: true,
    });

    // 3. Bulk update variants
    await Promise.all(
      variantTotals.map(({ product_variant_id, total_price }) =>
        models.ProductVariants.update(
          {
            price: Number(base_price) + Number(total_price || 0),
          },
          {
            where: { id: product_variant_id },
            transaction,
          },
        ),
      ),
    );
  } catch (error) {
    throw error;
  }
};

const createProductVariants = (attributes = [], baseSku = "EC") => {
  if (!Array.isArray(attributes) || attributes.length === 0) {
    return [];
  }

  // 1️⃣ Group by attribute_id
  const grouped = attributes.reduce((acc, item) => {
    if (!acc[item.attribute_id]) {
      acc[item.attribute_id] = [];
    }

    acc[item.attribute_id].push({
      attribute_id: item.attribute_id,
      attribute_value_id: item.attribute_value_id,
      sku_code: item.sku_code || "",
      price: Number(item.price || 0),
    });

    return acc;
  }, {});

  // 2️⃣ Generate cartesian combinations
  const groups = Object.values(grouped);

  const combinations = groups.reduce((acc, group) => {
    if (acc.length === 0) {
      return group.map((item) => [item]);
    }

    return acc.flatMap((existing) => group.map((item) => [...existing, item]));
  }, []);

  return combinations.map((combo, index) => {
    const additional_price = combo.reduce((sum, a) => sum + a.price, 0);

    const sku = [baseSku, ...combo.map((a) => a.sku_code)].map((v) => String(v).toUpperCase()).join("-");

    return {
      variant_index: index + 1,
      sku,
      attributes: combo.map((a) => ({
        attribute_id: a.attribute_id,
        attribute_value_id: a.attribute_value_id,
        price: a.price,
        sku_code: a.sku_code,
      })),
      additional_price,
    };
  });
};

module.exports = {
  createProductVariants,
  updateVariantsPrices,
  createOrUpdateVariantAttributes,
  reassignPrimaryIfNeeded,
};
