const { models, sequelize } = require("../../../../database/models/index.js");

class AddressService {
  static async index(req) {
    try {
      const { id: user_id } = req.auth;
      const addresses = await models.Address.findAll({
        where: { user_id,
          address_type: "billing"
         },
        include: [
          {
            model: models.Address,
            as: "shipping_address",
          },
        ],
        order: [
          ["is_default", "DESC"],
          ["created_at", "DESC"],
        ],
      });
      return addresses;
    } catch (error) {
      console.error("Error fetching addresses:", error);
      throw new Error(`Error fetching addresses: ${error.message}`);
    }
  }

  static async get(req) {
    try {
      const { id: user_id } = req.auth;
      const { id } = req.params;

      const address = await models.Address.findOne({
        where: { id, user_id },
        include: [
          {
            model: models.Address,
            as: "shipping_address",
          },
        ],
      });

      if (!address) {
        const error = new Error("Address not found");
        error.statusCode = 404;
        error.isOperational = true;
        throw error;
      }

      return address;
    } catch (error) {
      console.error("Error fetching address:", error);
      throw error;
    }
  }

  static async store(req) {
    const transaction = await sequelize.transaction();

  try {
      const { id: user_id } = req.auth;
      const payload = req.body;

      await Promise.all(createAddressRequest.map((v) => v.run(req)));
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        await transaction.rollback();
        return sendValidationError(res, errors.array());
      }

      const { shipToDifferentAddress } = payload;

      // 1️⃣ Build billing object
      const billingData = {
        user_id,
        address_type: "billing",
        name: payload.fullName,
        company_name: payload.companyName,
        email: payload.email,
        phone: payload.phone,
        country: payload.country,
        state: payload.region,
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
        shippingAddress = await models.Address.create(
          {
            user_id,
            address_type: "shipping",
            parent_address_id: billingAddress.id,

            name: payload.shippingFullName,
            company_name: payload.shippingCompanyName,
            email: payload.email, // usually same email
            phone: payload.phone, // usually same phone
            country: payload.shippingCountry,
            state: payload.shippingRegion,
            street_address: payload.shippingStreetAddress,
            apartment: payload.shippingApartment,
            status: "active",
          },
          { transaction },
        );
      }

      await transaction.commit();

      return {
        billing: billingAddress,
        shipping: shippingAddress,
      };
    } catch (error) {
      await transaction.rollback();
      console.error("Error creating billing/shipping address:", error);
      throw error;
    }
  }

  static async update(req) {
    const transaction = await sequelize.transaction();

    try {
      const { id: user_id } = req.auth;
      const { id } = req.params; // billing address id
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
        const error = new Error("Billing address not found");
        error.statusCode = 404;
        throw error;
      }

      // 1️⃣ Update billing
      await billingAddress.update(
        {
          name: payload.fullName,
          company_name: payload.companyName,
          email: payload.email,
          phone: payload.phone,
          country: payload.country,
          state: payload.region,
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

        const shippingPayload = {
          name: payload.shippingFullName,
          company_name: payload.shippingCompanyName,
          email: payload.email,
          phone: payload.phone,
          country: payload.shippingCountry,
          state: payload.shippingRegion,
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
      return billingAddress;
    } catch (error) {
      await transaction.rollback();
      console.error("Error updating addresses:", error);
      throw error;
    }
  }

  static async destroy(req) {
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
        const error = new Error("Address not found");
        error.statusCode = 404;
        throw error;
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
      return { deletedId: id };
    } catch (error) {
      await transaction.rollback();
      console.error("Error deleting address:", error);
      throw error;
    }
  }

  static async setDefault(req) {
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
        const error = new Error("Billing address not found");
        error.statusCode = 404;
        throw error;
      }

      // 2️⃣ No-op if already default
      if (address.is_default === true) {
        await transaction.commit();
        return address;
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
      return address;
    } catch (error) {
      await transaction.rollback();
      console.error("Error setting default address:", error);
      throw error;
    }
  }
}

module.exports = AddressService;
