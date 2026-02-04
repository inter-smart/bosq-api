function   buildProfieSection(data) {
  if (!data) return null;

  const userData = data.toJSON ? data.toJSON() : data;

  // Billing address (first item in array)
  const billingAddress = userData?.addresses?.[0];

  // Shipping address (nested inside billing)
  const shippingAddress = billingAddress?.shipping_address;

  const formatAddress = (address) => {
    if (!address) return null;

    const region = [
      address?.state?.name,
      address?.state?.country?.name,
    ]
      .filter(Boolean)
      .join(", ");

    return [
      address?.company_name ? address?.company_name : null,
      address?.apartment,
      address?.street_address,
      region,
    ]
      .filter(Boolean)
      .join(",<br/>");
  };

  return {
    first_name: userData.first_name ?? "N/A",
    last_name: userData.last_name ?? "N/A",
    profile_image: userData.profile_image ?? null,
    phone:
      userData?.country_code && userData?.mobile
        ? `${userData.country_code} ${userData.mobile}`
        : "N/A",
    email: userData.email ?? "N/A",
    address: formatAddress(billingAddress) ?? "N/A",
    shipping_address: formatAddress(shippingAddress) ?? null
  };
}


function buildProfileEditSection(data) {
  if (!data) return null;

  const userData = data.toJSON ? data.toJSON() : data;
  return {
    displayName: userData.name ?? "N/A",
    firstName: userData.first_name ?? "N/A",
    lastName: userData.last_name ?? "N/A",
    phone: `${userData?.country_code} ${userData.mobile}` ?? "N/A",
    email: userData.email ?? "N/A",
  };
}

module.exports = {
  buildProfieSection,
  buildProfileEditSection,
};
