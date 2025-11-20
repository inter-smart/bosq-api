// Media object (desktop + mobile) WITH type
const mediaWithType = (data = {}, typeKey, desktopPathKey, mobilePathKey, altKey) => ({
  desktop: {
    media_type: data[typeKey] ?? '',
    media_path: data[desktopPathKey] ?? '',
    media_alt: data[altKey] ?? '',
  },
  mobile: {
    media_type: data[typeKey] ?? '',
    media_path: data[mobilePathKey] ?? '',
    media_alt: data[altKey] ?? '',
  },
});

// Media object (desktop + mobile) WITHOUT type
const mediaWithoutType = (data = {}, desktopPathKey, mobilePathKey, altKey) => ({
  desktop: {
    media_path: data[desktopPathKey] ?? '',
    media_alt: data[altKey] ?? '',
  },
  mobile: {
    media_path: data[mobilePathKey] ?? '',
    media_alt: data[altKey] ?? '',
  },
});

// Single media (one object) WITH type
const singleMediaWithType = (data = {}, typeKey, pathKey, altKey) => ({
  media_type: data[typeKey] ?? '',
  media_path: data[pathKey] ?? '',
  media_alt: data[altKey] ?? '',
});

// Single media (one object) WITHOUT type
const singleMediaWithoutType = (data = {}, pathKey, altKey) => ({
  media_path: data[pathKey] ?? '',
  media_alt: data[altKey] ?? '',
});

// Button object
const button = (data = {}, textKey, linkKey) => ({
  text: data[textKey] ?? 'View',
  link: data[linkKey] ?? '#',
});

module.exports = {
  mediaWithType,
  mediaWithoutType,
  singleMediaWithType,
  singleMediaWithoutType,
  button,
};
