const {
  singleMediaWithoutType,
  mediaWithoutType,
} = require("../mediaButtonHelper");

function buildData(data) {
  const login_data = {
    title: data?.login_title ?? "N/A",
    title_ar: data?.login_title_ar ?? "N/A",
    description: data?.login_description ?? "N/A",
    description_ar: data?.login_description_ar ?? "N/A",
    media: singleMediaWithoutType(
      data,
      "login_media_desktop_path",
      "login_media_alt",
      "login_media_alt_ar",
    ),
  };

  const signup_data = {
    title: data?.signup_title ?? "N/A",
    title_ar: data?.signup_title_ar ?? "N/A",
    description: data?.signup_description ?? "N/A",
    description_ar: data?.signup_description_ar ?? "N/A",
    media: singleMediaWithoutType(
      data,
      "signup_media_desktop_path",
      "signup_media_alt",
      "signup_media_alt_ar",
    ),
  };

  const forgot_password_data = {
    title: data?.forgot_password_title ?? "N/A",
    title_ar: data?.forgot_password_title_ar ?? "N/A",
    description: data?.forgot_password_description ?? "N/A",
    description_ar: data?.forgot_password_description_ar ?? "N/A",
    media: singleMediaWithoutType(
      data,
      "forgot_password_media_desktop_path",
      "forgot_password_media_alt",
      "forgot_password_media_alt_ar",
    ),
  };
  return {
    login_data,
    signup_data,
    forgot_password_data,
  };
}

module.exports = {
  buildData,
};
