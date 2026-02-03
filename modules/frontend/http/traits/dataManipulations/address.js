function buildAddressSection(data) {
  const formatAddress = (item) => {
    const parts = [
      item?.street_address,
      item?.apartment,
      item?.state?.name,
      item?.state?.country?.name,
    ].filter(Boolean);

    return parts.join(", ");
  };
  

  return {
    address:
      data?.map((item) => ({
        id: item?.id,
        name: item?.name,
        phone: `${item?.country_code} ${item?.phone}`,
        address: formatAddress(item),
        shipping_name: item?.shipping_address?.name,
        shipping_address: formatAddress(item?.shipping_address),
        is_default: item?.is_default,
      })) || [],
  };
}

function buildCheckoutFormPayload(data) {
  if (!data) return null;

  const shipping = data?.shipping_address;

  return {
    /* ----------------------------------
       Billing
    ---------------------------------- */
    id: data?.id || null,
    name: data?.name || "",
    company_name: data?.company_name || "",
    email: data?.email || "",
    phone: data?.phone || "",

    // frontend expects slug for Select component matching
    state: {
      name: data?.state?.name || "",
      slug: data?.state?.slug || "",
    },
    street_address: data?.street_address || "",
    apartment: data?.apartment || "",
    country: {
      name: data?.state?.country?.name || "",
      slug: data?.state?.country?.slug || "",
    },
    order_notes: data?.order_notes || "",

    /* ----------------------------------
       Flag
    ---------------------------------- */
    shipToDifferentAddress: Boolean(shipping),

    /* ----------------------------------
       Shipping (same shape as billing)
    ---------------------------------- */
    shipping_address: shipping
      ? {
          name: shipping?.name || "",
          company_name: shipping?.company_name || "",
          state: {
            name: shipping?.state?.name || "",
            slug: shipping?.state?.slug || "",
          },
          street_address: shipping?.street_address || "",
          apartment: shipping?.apartment || "",
          country: {
            name: shipping?.state?.country?.name || "",
            slug: shipping?.state?.country?.slug || "",
          }
        }
      : null,
  };
}

module.exports = {
  buildCheckoutFormPayload,
  buildAddressSection,
};
