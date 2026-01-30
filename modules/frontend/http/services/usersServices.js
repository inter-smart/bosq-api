const { models } = require("../../../../database/models/index.js");


class UsersServices {
  static async getProfileData(req,res) {
    try {
      const { email } = req.auth;
      const data = await models.Users.findOne({
        where: {email},
        attributes:[
            "display_name",
            "profile_image",
            "country_code",
            "mobile",
            "address",
            "email",
        ]
      });

      return data;

    } catch (error) {
      console.error("Error getting profile data:", error);
      throw new Error(`Error fetching profile data: ${error.message}`);
    }
  }

    static async editProfile(req,res) {
    try {
      const { email } = req.auth;
      const data = await models.Users.findOne({
        where: {email},
        attributes:[
            "display_name",
            "profile_image",
            "country_code",
            "mobile",
            "address",
            "email",
        ]
      });

      return data;

    } catch (error) {
      console.error("Error getting profile data:", error);
      throw new Error(`Error fetching profile data: ${error.message}`);
    }
  }
}

module.exports = UsersServices;
