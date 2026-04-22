const { default: slugify } = require("slugify");

const backendUrl = `${process.env.BASE_URL}/` || "http://localhost:4000/";


// Media object (desktop + mobile) WITH type
const mediaWithType = (
  data = {},
  typeKey,
  desktopPathKey,
  mobilePathKey,
  altKey,
  altArKey
) => {
  const desktopPathArKey = `${desktopPathKey}_ar`;
  const mobilePathArKey = `${mobilePathKey}_ar`;

  return {
    desktop: {
      type: data[typeKey] ?? "",
      path: data[desktopPathKey] ? `${backendUrl}${data[desktopPathKey]}` : null,
      path_ar: data[desktopPathArKey]
        ? `${backendUrl}${data[desktopPathArKey]}`
        : null,
      alt: data[altKey] ?? "",
      alt_ar: altArKey ? data[altArKey] ?? "" : "",
    },
    mobile: {
      type: data[typeKey] ?? "",
      path: data[mobilePathKey] ? `${backendUrl}${data[mobilePathKey]}` : null,
      path_ar: data[mobilePathArKey]
        ? `${backendUrl}${data[mobilePathArKey]}`
        : null,
      alt: data[altKey] ?? "",
      alt_ar: altArKey ? data[altArKey] ?? "" : "",
    },
  };
};

// Media object (desktop + mobile) WITHOUT type
const mediaWithoutType = (
  data = {},
  desktopPathKey,
  mobilePathKey,
  altKey,
  altArKey
) => ({
  desktop: {
    path: data[desktopPathKey] ? `${backendUrl}${data[desktopPathKey]}` : null,
    alt: data[altKey] ?? "",
    alt_ar: altArKey ? data[altArKey] ?? "" : "",
  },
  mobile: {
    path: data[mobilePathKey] ? `${backendUrl}${data[mobilePathKey]}` : null,
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
  path: data[pathKey] ? `${backendUrl}${data[pathKey]}` : null,
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
  path: data[pathKey] ? `${backendUrl}${data[pathKey]}` : null,
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
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = months[date.getUTCMonth()];
  const year = date.getUTCFullYear();

  return `${month} ${day}, ${year}`;
}

// function dateFirst(dateInput) {
//   if (!dateInput) return "N/A";

//   const date = new Date(dateInput);
//   const months = [
//     "January", "February", "March", "April", "May", "June",
//     "July", "August", "September", "October", "November", "December"
//   ];

//   const day = String(date.getUTCDate()).padStart(2, '0');
//   const month = months[date.getUTCMonth()];
//   const year = date.getUTCFullYear();

//   return `${day} ${month} ${year}`;
// }


const generateSlugWithTimestamp = (name) => {
  if (!name) return null;

  // Convert name to slug (lowercase, remove special chars)
  const baseSlug = slugify(name, { lower: true, strict: true });

  // Append timestamp (milliseconds) to make it unique
  const timestamp = Date.now(); // or you could use Math.floor(Date.now() / 1000) for seconds

  return `${baseSlug}-${timestamp}`;
};




module.exports = {
  mediaWithType,
  mediaWithoutType,
  singleMediaWithType,
  singleMediaWithoutType,
  button,
  formatDate,
  generateSlugWithTimestamp
};
