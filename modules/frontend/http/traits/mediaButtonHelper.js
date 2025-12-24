const backendUrl = `${process.env.BASE_URL}/`|| "http://localhost:4000/";


// Media object (desktop + mobile) WITH type
const mediaWithType = (
  data = {},
  typeKey,
  desktopPathKey,
  mobilePathKey,
  altKey,
  altArKey
) => ({
  desktop: {
    type: data[typeKey] ?? "",
    path: `${backendUrl}${data[desktopPathKey]}` ?? "",
    alt: data[altKey] ?? "",
    alt_ar: altArKey ? data[altArKey] ?? "" : "",
  },
  mobile: {
    type: data[typeKey] ?? "",
    path: `${backendUrl}${data[mobilePathKey]}` ?? "",
    alt: data[altKey] ?? "",
    alt_ar: altArKey ? data[altArKey] ?? "" : "",
  },
});

// Media object (desktop + mobile) WITHOUT type
const mediaWithoutType = (
  data = {},
  desktopPathKey,
  mobilePathKey,
  altKey,
  altArKey
) => ({
  desktop: {
    path: `${backendUrl}${data[desktopPathKey]}` ?? "",
    alt: data[altKey] ?? "",
    alt_ar: altArKey ? data[altArKey] ?? "" : "",
  },
  mobile: {
    path: `${backendUrl}${data[mobilePathKey]}` ?? "",
    alt: data[altKey] ?? "",
    alt_ar: altArKey ? data[altArKey] ?? "" : "",
  },
});

// Single media (one object) WITH type
const singleMediaWithType = (
  data = {},
  typeKey,
  pathKey,
  altKey,
  altArKey
) => ({
  type: data[typeKey] ?? "",
  path: `${backendUrl}${data[pathKey]}` ?? "",
  alt: data[altKey] ?? "",
  alt_ar: altArKey ? data[altArKey] ?? "" : "",
});

// Single media (one object) WITHOUT type
const singleMediaWithoutType = (
  data = {},
  pathKey,
  altKey,
  altArKey
) => ({
  path: `${backendUrl}${data[pathKey]}` ?? "",
  alt: data[altKey] ?? "",
  alt_ar: altArKey ? data[altArKey] ?? "" : "",
});

// Button object
const button = (data = {}, textKey, linkKey) => ({
  text: data[textKey] ?? "View",
  link: data[linkKey] ?? "#",
});

// Date formatter
function formatDate(dateInput) {
  if (!dateInput) return "N/A";

  const date = new Date(dateInput);

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric",
  });
}

module.exports = {
  mediaWithType,
  mediaWithoutType,
  singleMediaWithType,
  singleMediaWithoutType,
  button,
  formatDate,
};
