const { models, sequelize } = require("../../../../database/models");
const { sendSuccessResponse, sendErrorResponse } = require("../traits/responseHandler");

class DeliveryRulesController {
  static async getStatesByCountry(req, res) {
    try {
      const { countrySlug } = req.query;
      let countryFilter = {};
      if (countrySlug) {
        countryFilter.slug = countrySlug;
      } else {
        // Default to AE if no slug is provided
        countryFilter.slug = 'ae';
      }

      const country = await models.Country.findOne({ where: countryFilter });
      if (!country) return sendErrorResponse(res, null, "Country not found", 404);

      const states = await models.State.findAll({
        where: { country_id: country.id },
        attributes: ['id', 'name', 'slug'],
        include: [
          {
            model: models.StateDeliveryRules,
            as: "delivery_rules",
            attributes: ['id', 'category_id', 'charge', 'is_free']
          }
        ],
        order: [['name', 'ASC']]
      });

      return sendSuccessResponse(res, states, "States fetched successfully");
    } catch (error) {
      return sendErrorResponse(res, error);
    }
  }

  static async updateDeliveryRules(req, res) {
    try {
      const { stateId } = req.params;
      const { rules } = req.body; // Array of rules [{ category_id, charge, is_free }]

      await sequelize.transaction(async (t) => {
        // Remove existing rules for the state
        await models.StateDeliveryRules.destroy({ where: { state_id: stateId }, transaction: t });

        // Insert new rules
        if (rules && rules.length > 0) {
          const rulesToInsert = rules.map(rule => ({
            state_id: stateId,
            category_id: rule.category_id || null,
            charge: rule.is_free ? 0 : (rule.charge || 0),
            is_free: rule.is_free || false
          }));
          await models.StateDeliveryRules.bulkCreate(rulesToInsert, { transaction: t });
        }
      });

      return sendSuccessResponse(res, null, "Delivery rules updated successfully");
    } catch (error) {
      return sendErrorResponse(res, error);
    }
  }
}

module.exports = DeliveryRulesController;
