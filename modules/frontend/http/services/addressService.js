const { validationResult } = require("express-validator");
const { models, sequelize } = require("../../../../database/models/index.js");
const { createAddressRequest } = require("../request/addressRequest.js");
const {
  sendValidationError,
  sendSuccessResponse,
  sendErrorResponse,
} = require("../../../admin/http/traits/responseHandler.js");
const {
  buildAddressSection,
  buildCheckoutFormPayload,
} = require("../traits/dataManipulations/address.js");

class AddressService {
  static async index(req, res) {
    try {
      const { id: user_id } = req.auth;
      const data = await models.Address.findAll({
        where: { user_id, address_type: "billing" },
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
            model: models.Address,
            as: "shipping_address",
            // attributes: ["id", "name", "country_code", "phone", "is_default"],
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

      return sendSuccessResponse(
        res,
        result,
        "Addresses fetched successfully",
        200,
      );
    } catch (error) {
      console.error("Error fetching address:", error);
      return res.json({
        success: false,
        message: `Error fetching address: ${error.message}`,
      });
    }
  }

  static async get(req, res) {
    try {
      const { id: user_id } = req.auth;
      const { id } = req.params;

      const address = await models.Address.findOne({
        where: { id, user_id, address_type: "billing" },
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
            model: models.Address,
            as: "shipping_address",
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
      return sendSuccessResponse(
        res,
        result,
        "Address fetched successfully",
        200,
      );
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

      const { id: user_id } = req.auth;
      const payload = req.body;
      const { shipToDifferentAddress } = payload;

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
        user_id,
        address_type: "billing",
        name: payload.fullName,
        company_name: payload.companyName,
        email: payload.email,
        phone: payload.phone,
        state_id: stateId,
        street_address: payload.streetAddress,
        apartment: payload.apartment,
        order_notes: payload.orderNotes,
        status: "active",
      };

      // 2️⃣ Default logic (production-safe)
      const existingAddresses = await models.Address.findAll({
        where: { user_id, address_type: "billing" },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      const shouldBeDefault = existingAddresses.length === 0;
      billingData.is_default = shouldBeDefault;

      // 3️⃣ Create billing address
      const billingAddress = await models.Address.create(billingData, {
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

        shippingAddress = await models.Address.create(
          {
            user_id,
            address_type: "shipping",
            parent_address_id: billingAddress.id,
            name: payload.shippingFullName,
            company_name: payload.shippingCompanyName,
            email: payload.email,
            phone: payload.phone,
            state_id: shippingStateId,
            street_address: payload.shippingStreetAddress,
            apartment: payload.shippingApartment,
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
      const { id: user_id } = req.auth;
      const { id } = req.params;
      const payload = req.body;

      const billingAddress = await models.Address.findOne({
        where: {
          id,
          user_id,
          address_type: "billing",
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!billingAddress) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "Billing address not found",
        });
      }

      // Look up state ID from slug (for billing)
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
        let shippingAddress = await models.Address.findOne({
          where: {
            parent_address_id: billingAddress.id,
            address_type: "shipping",
          },
          transaction,
          lock: transaction.LOCK.UPDATE,
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
          await models.Address.create(
            {
              user_id,
              address_type: "shipping",
              parent_address_id: billingAddress.id,
              ...shippingPayload,
            },
            { transaction },
          );
        }
      } else {
        // 🚫 If user unticks "Ship to different address"
        await models.Address.destroy({
          where: {
            parent_address_id: billingAddress.id,
            address_type: "shipping",
          },
          transaction,
        });
      }

      await transaction.commit();

      return sendSuccessResponse(
        res,
        billingAddress,
        "Address updated successfully",
      );
    } catch (error) {
      if (!transaction.finished) {
        await transaction.rollback();
      }
      console.error("Error updating addresses:", error);
      return res.status(500).json({
        success: false,
        message: `Error updating address: ${error.message}`,
      });
    }
  }

  static async destroy(req, res) {
    const transaction = await sequelize.transaction();
    try {
      const { id: user_id } = req.auth;
      const { id } = req.params;

      const address = await models.Address.findOne({
        where: { id, user_id },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!address) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "Address not found",
        });
      }

      const wasDefault = address.is_default;
      const addressType = address.address_type;

      // 1️⃣ If billing → delete linked shipping
      if (addressType === "billing") {
        await models.Address.destroy({
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
      if (wasDefault && addressType === "billing") {
        const nextDefault = await models.Address.findOne({
          where: {
            user_id,
            address_type: "billing",
            status: "active",
          },
          order: [["created_at", "DESC"]],
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        if (nextDefault) {
          await nextDefault.update({ is_default: true }, { transaction });
        }
      }

      await transaction.commit();

      return sendSuccessResponse(
        res,
        { deletedId: id },
        "Address deleted successfully",
      );
    } catch (error) {
      if (!transaction.finished) {
        await transaction.rollback();
      }
      console.error("Error deleting address:", error);
      return res.status(500).json({
        success: false,
        message: `Error deleting address: ${error.message}`,
      });
    }
  }

  static async setDefault(req, res) {
    const transaction = await sequelize.transaction();
    try {
      const { id: user_id } = req.auth;
      const { id } = req.params;

      // 1️⃣ Find billing address
      const address = await models.Address.findOne({
        where: {
          id,
          user_id,
          status: "active",
          address_type: "billing",
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!address) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "Billing address not found",
        });
      }

      // 2️⃣ No-op if already default
      if (address.is_default === true) {
        await transaction.commit();
        return sendSuccessResponse(res, address, "Address is already default");
      }

      // 3️⃣ Unset default from other billing addresses
      await models.Address.update(
        { is_default: false },
        {
          where: {
            user_id,
            address_type: "billing",
          },
          transaction,
        },
      );

      // 4️⃣ Set this billing address as default
      await address.update({ is_default: true }, { transaction });

      await transaction.commit();

      return sendSuccessResponse(
        res,
        address,
        "Default address set successfully",
        200
      );
    } catch (error) {
      if (!transaction.finished) {
        await transaction.rollback();
      }
      console.error("Error setting default address:", error);
     sendErrorResponse(res, "Error setting default address", null, 500);
    }
  }
}

module.exports = AddressService;
