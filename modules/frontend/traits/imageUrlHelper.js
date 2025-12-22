const BASE_IMAGE_URL = process.env.BASE_URL || "https://yourdomain.com";

const generateImageUrl = (imagePath) => {
  if (!imagePath) return null;

  // remove leading slashes to avoid double //
  const cleanPath = imagePath.replace(/^\/+/, "");

  return `${BASE_IMAGE_URL}/${cleanPath}`;
};

module.exports = {
  generateImageUrl,
};
