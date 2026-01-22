export const createProductVariants = (attributes = [], baseSku = "EC") => {
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

    const sku = [baseSku, ...combo.map((a) => a.sku_code)].join("-");

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
