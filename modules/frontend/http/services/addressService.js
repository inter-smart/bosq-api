const { validationResult } = require("express-validator");
const { models, sequelize } = require("../../../../database/models/index.js");
const { createAddressRequest } = require("../request/addressRequest.js");
const { sendValidationError, sendSuccessResponse, sendErrorResponse } = require("../../../admin/http/traits/responseHandler.js");
const { buildAddressSection, buildCheckoutFormPayload } = require("../traits/dataManipulations/address.js");

const modelsMap = {
  user: {
    model: models.Address,
    field: "user_id",
    aliasName: "shipping_address",
  },
  guest: {
    model: models.CartAddress,
    field: "session_id",
    aliasName: "shipping_CartAddress",
  },
};
const { validateRecaptcha } = require("../../../../services/RecaptchaValidation.js");

class AddressService {
  static async index(req, res) {
    try {
      if (!req.cartOwner) {
        throw new Error("Cart owner not found");
      }

      const { type, id } = req.cartOwner;

      const config = modelsMap[type];

      if (!config) {
        return res.status(400).json({
          message: "Invalid cart owner type",
        });
      }

      const { model: Model, field, aliasName: alias } = config;

      const where = {
        address_type: "billing",
        [field]: id, // ✅ computed property
      };

      const data = await Model.findAll({
        where,
        include: [
          {
            model: models.State,
            as: "state",
            attributes: ["name", "slug"],
            include: [
              {
                model: models.Country,
                as: "country",
                attributes: ["name", "slug"],
              },
            ],
          },
          {
            model: Model,
            as: alias,
            include: [
              {
                model: models.State,
                as: "state",
                attributes: ["name", "slug"],
                include: [
                  {
                    model: models.Country,
                    as: "country",
                    attributes: ["name", "slug"],
                  },
                ],
              },
            ],
          },
        ],
        order: [
          ["is_default", "DESC"],
          ["created_at", "DESC"],
        ],
      });

      const result = buildAddressSection(data);

      return {
        data: result,
      };
    } catch (error) {
      console.error("Error fetching address:", error);
      throw error;
    }
  }

  static async get(req, res) {
    try {
      const { id } = req.params;

      if (!req.cartOwner) {
        return res.status(400).json({
          message: "Cart context not found",
        });
      }

      const { type, id: userId } = req.cartOwner;

      const config = modelsMap[type];

      if (!config) {
        return res.status(400).json({
          message: "Invalid cart owner type",
        });
      }

      const { model: Model, field, aliasName: alias } = config;

      const where = {
        id,
        address_type: "billing",
        [field]: userId,
      };

      const address = await Model.findOne({
        where,
        include: [
          {
            model: models.State,
            as: "state",
            attributes: ["id", "name", "slug"],
            include: [
              {
                model: models.Country,
                as: "country",
                attributes: ["id", "name", "slug"],
              },
            ],
          },
          {
            model: Model,
            as: alias,
            include: [
              {
                model: models.State,
                as: "state",
                attributes: ["id", "name", "slug"],
                include: [
                  {
                    model: models.Country,
                    as: "country",
                    attributes: ["id", "name", "slug"],
                  },
                ],
              },
            ],
          },
        ],
      });

      if (!address) {
        return res.status(404).json({
          success: false,
          message: "Address not found",
        });
      }

      const result = buildCheckoutFormPayload(address);

      return sendSuccessResponse(res, result, "Address fetched successfully", 200);
    } catch (error) {
      console.error("Error fetching address:", error);
      return res.status(500).json({
        success: false,
        message: `Error fetching address: ${error.message}`,
      });
    }
  }

  static async getAllAddressByUser(req, res) {
    try {
      if (!req.cartOwner) {
        return res.status(400).json({
          message: "Cart context not found",
        });
      }

      const { type, id: userId } = req.cartOwner;

      const config = modelsMap[type];

      if (!config) {
        return res.status(400).json({
          message: "Invalid cart owner type",
        });
      }

      const { model: Model, field } = config;

      const where = {
        id,
        address_type: "billing",
        [field]: userId,
      };

      const address = await Model.findAll({
        where,
        include: [
          {
            model: models.State,
            as: "state",
            attributes: ["id", "name", "slug"],
            include: [
              {
                model: models.Country,
                as: "country",
                attributes: ["id", "name", "slug"],
              },
            ],
          },
          {
            model: Model,
            as: alias,
            include: [
              {
                model: models.State,
                as: "state",
                attributes: ["id", "name", "slug"],
                include: [
                  {
                    model: models.Country,
                    as: "country",
                    attributes: ["id", "name", "slug"],
                  },
                ],
              },
            ],
          },
        ],
      });

      if (!address) {
        return res.status(404).json({
          success: false,
          message: "Address not found",
        });
      }

      const result = address?.map((item) => buildCheckoutFormPayload(item));

      return sendSuccessResponse(res, result, "Address fetched successfully", 200);
    } catch (error) {
      console.error("Error fetching address:", error);
      return res.status(500).json({
        success: false,
        message: `Error fetching address: ${error.message}`,
      });
    }
  }

  static async store(req, res) {
    const transaction = await sequelize.transaction();
    try {
      // Validate request
      await Promise.all(createAddressRequest.map((v) => v.run(req)));
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        await transaction.rollback();
        return sendValidationError(res, errors.array());
      }

      if (!req.cartOwner) {
        return res.status(400).json({
          message: "Cart context not found",
        });
      }

      const { type, id } = req.cartOwner;

      const config = modelsMap[type];

      if (!config) {
        return res.status(400).json({
          message: "Invalid cart owner type",
        });
      }

      const { model: Model, field } = config;

      const payload = req.body;
      const { shipToDifferentAddress } = payload;

      // ✅ Correct token key
      const token = payload?.recaptcha_token;

      if (!token) {
        throw new Error("reCAPTCHA token missing");
      }

      const { success, score, action } = await validateRecaptcha(token);

      console.log("reCAPTCHA result:", { success, score, action });

      // ✅ v3 validation
      if (!success || score < 0.5) {
        const error = new Error("reCAPTCHA verification failed. Please try again.");
        error.statusCode = 403;
        throw error;
      }

      // Look up state ID from slug
      let stateId = null;
      if (payload.state) {
        const state = await models.State.findOne({
          where: { slug: payload.state },
          attributes: ["id"],
          transaction,
        });
        if (state) {
          stateId = state.id;
        }
      }

      // 1️⃣ Build billing object
      const billingData = {
        [field]: id,
        address_type: "billing",
        name: payload.fullName,
        company_name: payload.companyName,
        email: payload.email,
        phone: payload.phone,
        state_id: stateId,
        street_address: payload.streetAddress,
        apartment: payload.apartment,
        order_notes: payload.orderNotes,
        is_default: true,
        status: "active",
      };

      // 2️⃣ Default logic - check if this is the first billing address
      const existingBillingAddresses = await Model.findAll({
        where: {
          address_type: "billing",
          [field]: id,
        },
        transaction,
      });

      const isBillingDefault = existingBillingAddresses.length === 0;
      billingData.is_default = isBillingDefault;

      // 3️⃣ Create billing address
      const billingAddress = await Model.create(billingData, {
        transaction,
      });

      let shippingAddress = null;

      // 4️⃣ Create shipping address (if required)
      if (shipToDifferentAddress === true) {
        // Look up shipping state ID from slug
        let shippingStateId = null;
        if (payload.shippingState) {
          const shippingState = await models.State.findOne({
            where: { slug: payload.shippingState },
            attributes: ["id"],
            transaction,
          });
          if (shippingState) {
            shippingStateId = shippingState.id;
          }
        }

        // Check if this is the first shipping address
        const existingShippingAddresses = await Model.findAll({
          where: {
            address_type: "shipping",
            [field]: id,
          },
          transaction,
        });

        const isShippingDefault = existingShippingAddresses.length === 0;

        shippingAddress = await Model.create(
          {
            [field]: id,
            address_type: "shipping",
            parent_address_id: billingAddress.id,
            name: payload.shippingFullName,
            company_name: payload.shippingCompanyName,
            email: payload.email,
            phone: payload.phone,
            state_id: shippingStateId,
            street_address: payload.shippingStreetAddress,
            apartment: payload.shippingApartment,
            is_default: isShippingDefault,
            status: "active",
          },
          { transaction },
        );
      }

      await transaction.commit();

      // ✅ FIX: Actually send the response
      return sendSuccessResponse(
        res,
        {
          billing: billingAddress,
          shipping: shippingAddress,
        },
        "Address created successfully",
      );
    } catch (error) {
      // Rollback only if transaction is still pending
      if (!transaction.finished) {
        await transaction.rollback();
      }
      console.error("Error creating billing/shipping address:", error);
      return res.status(500).json({
        success: false,
        message: `Error creating address: ${error.message}`,
      });
    }
  }

  static async update(req, res) {
    const transaction = await sequelize.transaction();
    try {
      if (!req.cartOwner) {
        throw new Error("Cart owner not found");
      }

      const { type, id: userId } = req.cartOwner;
      const { id } = req.params;

      const config = modelsMap[type];

      const { model: Model, field } = config;

      const where = {
        address_type: "billing",
        [field]: userId,
        id,
      };
      const payload = req.body;

      // // ✅ Correct token key
      // const token = payload?.recaptcha_token;

      // if (!token) {
      //   throw new Error("reCAPTCHA token missing");
      // }

      // const { success, score, action } = await validateRecaptcha(token);

      // console.log("reCAPTCHA result:", { success, score, action });

      // // ✅ v3 validation
      // if (!success || score < 0.5) {
      //   const error = new Error("reCAPTCHA verification failed. Please try again.");
      //   error.statusCode = 403;
      //   throw error;
      // }

      const billingAddress = await Model.findOne({
        where,
        transaction,
      });

      if (!billingAddress) {
        throw new Error("Billing address not found");
      }

      let stateId = null;
      if (payload.state) {
        const state = await models.State.findOne({
          where: { slug: payload.state },
          attributes: ["id"],
          transaction,
        });
        if (state) {
          stateId = state.id;
        }
      }

      // 1️⃣ Update billing
      await billingAddress.update(
        {
          name: payload.fullName,
          company_name: payload.companyName,
          email: payload.email,
          phone: payload.phone,
          state_id: stateId,
          street_address: payload.streetAddress,
          apartment: payload.apartment,
          order_notes: payload.orderNotes,
        },
        { transaction },
      );

      // 2️⃣ Handle shipping
      if (payload.shipToDifferentAddress === true) {
        let shippingAddress = await Model.findOne({
          where: {
            parent_address_id: billingAddress.id,
            address_type: "shipping",
          },
          transaction,
        });

        // Look up shipping state ID from slug
        let shippingStateId = null;
        if (payload.shippingState) {
          const shippingState = await models.State.findOne({
            where: { slug: payload.shippingState },
            attributes: ["id"],
            transaction,
          });
          if (shippingState) {
            shippingStateId = shippingState.id;
          }
        }

        const shippingPayload = {
          name: payload.shippingFullName,
          company_name: payload.shippingCompanyName,
          email: payload.email,
          phone: payload.phone,
          state_id: shippingStateId,
          street_address: payload.shippingStreetAddress,
          apartment: payload.shippingApartment,
          status: "active",
        };

        if (shippingAddress) {
          await shippingAddress.update(shippingPayload, { transaction });
        } else {
          await Model.create(
            {
              [field]: userId,
              address_type: "shipping",
              parent_address_id: billingAddress.id,
              ...shippingPayload,
            },
            { transaction },
          );
        }
      } else {
        // 🚫 If user unticks "Ship to different address"
        await Model.destroy({
          where: {
            parent_address_id: billingAddress.id,
            address_type: "shipping",
          },
          transaction,
        });
      }

      await transaction.commit();

      return billingAddress;
    } catch (error) {
      if (!transaction.finished) {
        await transaction.rollback();
      }
      console.error("Error updating addresses:", error);
      throw error;
    }
  }

  static async destroy(cartOwner, id, addressType = "billing") {
    const transaction = await sequelize.transaction();
    try {
      const { type, id: userId } = cartOwner;

      const config = modelsMap[type];

      const { model: Model, field } = config;

      const where = {
        [field]: userId,
        address_type: addressType,
        id,
      };

      const address = await Model.findOne({
        where,
        transaction,
      });

      if (!address) {
        throw new Error("Billing address not found");
      }

      const wasDefault = address.is_default;
      const currentAddressType = address.address_type;

      // 1️⃣ If billing → delete linked shipping
      if (currentAddressType === "billing") {
        await Model.destroy({
          where: {
            parent_address_id: address.id,
            address_type: "shipping",
          },
          transaction,
        });
      }

      // 2️⃣ Delete requested address
      await address.destroy({ transaction });

      // 3️⃣ Reassign default if needed
      if (wasDefault && currentAddressType === "billing") {
        const nextDefault = await Model.findOne({
          where,
          order: [["created_at", "DESC"]],
          transaction,
        });

        if (nextDefault) {
          await nextDefault.update({ is_default: true }, { transaction });
        }
      }

      await transaction.commit();

      return id;
    } catch (error) {
      if (!transaction.finished) {
        await transaction.rollback();
      }
      console.error("Error deleting address:", error);
      throw error;
    }
  }

  static async setDefault(cartOwner, id, addressType = "billing") {
    const transaction = await sequelize.transaction();
    try {
      const { type, id: userId } = cartOwner;

      const config = modelsMap[type];

      const { model: Model, field } = config;

      const where = {
        [field]: userId,
        address_type: addressType,
        id,
        status: "active",
      };

      // 1️⃣ Find billing address
      const address = await Model.findOne({
        where,
        transaction,
      });

      if (!address) {
        throw new Error("Billing address not found");
      }

      // 2️⃣ No-op if already default
      if (address.is_default === true) {
        await transaction.commit();
        return address;
      }

      // 3️⃣ Unset default from other billing addresses
      await Model.update(
        { is_default: false },
        {
          where: {
            [field]: userId,
            address_type: addressType,
          },
          transaction,
        },
      );

      // 4️⃣ Set this billing address as default
      await address.update({ is_default: true }, { transaction });

      await transaction.commit();

      return address;
    } catch (error) {
      if (!transaction.finished) {
        await transaction.rollback();
      }
      console.error("Error setting default address:", error);
      throw error;
    }
  }
}

module.exports = AddressService;
