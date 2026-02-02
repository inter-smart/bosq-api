function buildProfieSection(data) {
  if (!data) return null;

  const userData = data.toJSON ? data.toJSON() : data;
  const address = userData.addresses?.[0];

  let fullAddress = null;

  let region = [address?.state, address?.country].join(", ");
  if (address) {
    const addressParts = [
      address.apartment,
      address.street_address,
      region,
    ].filter(Boolean);
    fullAddress = addressParts.join(",<br/>");
  }

  return {
    first_name: userData.first_name ?? "N/A",
    last_name: userData.last_name ?? "N/A",
    profile_image: userData.profile_image ?? null,
    phone: `${userData?.country_code} ${userData.mobile}` ?? "N/A",
    email: userData.email ?? "N/A",
    address: fullAddress ?? "N/A",
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
  buildProfileEditSection
};
