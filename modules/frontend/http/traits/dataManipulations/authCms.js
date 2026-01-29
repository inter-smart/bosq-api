const {
  singleMediaWithoutType,
  mediaWithoutType,
} = require("../mediaButtonHelper");

function buildData(data) {
  const login_data = {
    title: data?.login_title ?? "N/A",
    title_ar: data?.login_title_ar ?? "N/A",
    description: data?.login_subtitle ?? "N/A",
    description_ar: data?.login_subtitle_ar ?? "N/A",
    media: singleMediaWithoutType(
      data,
      "login_media_path",
      "login_title",
      "login_title_ar",
    ),
  };

  const signup_data = {
    title: data?.signup_title ?? "N/A",
    title_ar: data?.signup_title_ar ?? "N/A",
    description: data?.signup_subtitle ?? "N/A",
    description_ar: data?.signup_subtitle_ar ?? "N/A",
    media: singleMediaWithoutType(
      data,
      "signup_media_path",
      "signup_title",
      "signup_title_ar",
    ),
  };


  // otp
  const verify_otp_data ={
     title: data?.otp_title ?? "N/A",
    title_ar: data?.otp_title_ar ?? "N/A",
    description: data?.otp_subtitle ?? "N/A",
    description_ar: data?.otp_subtitle_ar ?? "N/A",
    media: singleMediaWithoutType(
      data,
      "otp_media_path",
      "otp_title",
      "otp_title_ar",
    ),
  }


   const create_password_data ={
     title: data?.create_password_title ?? "N/A",
    title_ar: data?.create_password_title_ar ?? "N/A",
    description: data?.create_password_subtitle ?? "N/A",
    description_ar: data?.create_password_subtitle_ar ?? "N/A",
    media: singleMediaWithoutType(
      data,
      "create_password_media_path",
      "create_password_title",
      "create_password_title_ar",
    ),
  }


   const recover_email ={
     title: data?.recover_email_title ?? "N/A",
    title_ar: data?.recover_email_title_ar ?? "N/A",
    description: data?.recover_email_subtitle ?? "N/A",
    description_ar: data?.recover_email_subtitle_ar ?? "N/A",
    media: singleMediaWithoutType(
      data,
      "recover_email_media_path",
      "recover_email_title",
      "recover_email_title_ar",
    ),
  }

     const  recover_password_otp ={
     title: data?.recover_password_otp_title ?? "N/A",
    title_ar: data?.recover_password_otp_title_ar ?? "N/A",
    description: data?.recover_password_otp_subtitle ?? "N/A",
    description_ar: data?.recover_password_otp_subtitle_ar ?? "N/A",
    media: singleMediaWithoutType(
      data,
      "recover_password_otp_media_path",
      "recover_password_otp_title",
      "recover_password_otp_title_ar",
    ),
  }


     const  recover_password ={
     title: data?. recover_password_title ?? "N/A",
    title_ar: data?. recover_password_title_ar ?? "N/A",
    media: singleMediaWithoutType(
      data,
      "recover_password_media_path",
      "recover_password_title",
      "recover_password_title_ar",
    ),
  }



  return {
    login_data,
    signup_data,
    verify_otp_data,
    create_password_data,
    forgot_password:{
      recover_email,
      recover_password_otp,
      recover_password
    }
  };
}

module.exports = {
  buildData,
};
