const { redisClient } = require("../../../../config/redis");
const { models } = require("../../../../database/models");
const cacheDependencies = require("../../../redis/cacheDependency");
const { invalidateCacheByModel } = require("../../../redis/redisService");
const OrderService = require("../../../frontend/http/services/orderService");

class CommonActionsController {
  static async updateStatus(req, res) {
    try {
      const { model_name, row_id } = req.params;
      const { status } = req.body;

      // Dynamically pick model
      const Model = models[model_name];
      if (!Model) {
        return res.status(400).json({ message: "Invalid model name" });
      }

      const content = await Model.findByPk(row_id);
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }

      const updated = await Model.update({ status }, { where: { id: row_id } });

      if (!updated) {
        return res.status(400).json({ message: "Failed to update status" });
      }

      const updatedContent = await Model.findByPk(row_id);

      // Invalidate all sessions when a user is deactivated
      if (model_name === "Users" && status !== "active") {
        await models.AuthSessions.destroy({ where: { user_id: row_id } });
      }

      // Trigger order status update email for any status change on an Order
      if (model_name === "Orders") {
        OrderService.sendOrderStatusEmail(row_id, status).catch((err) =>
          console.error(`Failed to trigger order status email from admin for order ${row_id}: ${err.message}`)
        );
      }

      // Invalidate cache (pass updatedContent for dynamic cache keys)
      const cacheResult = await invalidateCacheByModel(redisClient, model_name, cacheDependencies, updatedContent);

      return res.json({
        success: true,
        message: "Status updated successfully",
        data: updatedContent,
        cache: {
          invalidated: cacheResult.success,
          keys: cacheResult.keys,
        },
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
  static async updateSortOrder(req, res) {
    try {
      const { model_name, row_id } = req.params;
      const { sort_order } = req.body;

      const Model = models[model_name];
      if (!Model) {
        return res.status(400).json({ message: "Invalid model name" });
      }

      const content = await Model.findByPk(row_id);
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }

      const updated = await Model.update({ sort_order }, { where: { id: row_id } });
      // Fetch updated record
      const updatedContent = await Model.findByPk(row_id);

      // Invalidate cache (pass updatedContent for dynamic cache keys)
      const cacheResult = await invalidateCacheByModel(redisClient, model_name, cacheDependencies, updatedContent);

      console.log(`✅ Sort order updated for ${model_name} ID:${row_id} - Cache invalidation: ${cacheResult.success} key(s)`);

      return res.json({
        success: true,
        message: "Sort order updated successfully",
        data: updatedContent,
        cache: {
          invalidated: cacheResult.success,
          keys: cacheResult.keys,
        },
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  static async updateIsPrimary(req, res) {
    try {
      const { model_name, row_id } = req.params;
      const { is_primary } = req.body;

      const Model = models[model_name];
      if (!Model) {
        return res.status(400).json({ message: "Invalid model name" });
      }

      const content = await Model.findByPk(row_id);
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }

      const updated = await Model.update({ is_primary }, { where: { id: row_id } });
      // Fetch updated record
      const updatedContent = await Model.findByPk(row_id);

      // Invalidate cache (pass updatedContent for dynamic cache keys)
      const cacheResult = await invalidateCacheByModel(redisClient, model_name, cacheDependencies, updatedContent);

      console.log(`✅ Sort order updated for ${model_name} ID:${row_id} - Cache invalidation: ${cacheResult.success} key(s)`);

      return res.json({
        success: true,
        message: "Sort order updated successfully",
        data: updatedContent,
        cache: {
          invalidated: cacheResult.success,
          keys: cacheResult.keys,
        },
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  static async updateShowInFooter(req, res) {
    try {
      const { model_name, row_id } = req.params;
      const { show_in_footer } = req.body;

      const Model = models[model_name];
      if (!Model) {
        return res.status(400).json({ message: "Invalid model name" });
      }

      const content = await Model.findByPk(row_id);
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }

      const updated = await Model.update({ show_in_footer }, { where: { id: row_id } });
      // Fetch updated record
      const updatedContent = await Model.findByPk(row_id);

      // Invalidate cache (pass updatedContent for dynamic cache keys)
      const cacheResult = await invalidateCacheByModel(redisClient, model_name, cacheDependencies, updatedContent);

      console.log(`✅ Show in footer updated for ${model_name} ID:${row_id} - Cache invalidation: ${cacheResult.success} key(s)`);

      return res.json({
        success: true,
        message: "Show in footer updated successfully",
        data: updatedContent,
        cache: {
          invalidated: cacheResult.success,
          keys: cacheResult.keys,
        },
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  static async getChildCategories(req, res) {
    try {
      const { parent_id } = req.query;

      const category = await models?.ProductCategory.findByPk(parent_id);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      const childCategories = await models?.ProductCategory.findAll({
        where: {
          parent_id: parent_id,
          status: true,
        },
        attributes: ["id", "name", "parent_id"],
      });

      return res.json({
        success: true,
        message: "Sort order updated successfully",
        data: childCategories || [],
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  static async getAttributesWithValues(req, res) {
    try {
      const result = await models?.ProductAttribute.findAll({
        attributes: ["id", "name", "name_ar", "slug", "code"],
        where: { status: true },
        order: [["sort_order", "ASC"]],
        include: [
          {
            model: models.AttributeValues,
            as: "values",
            attributes: ["id", "value", "value_ar", "slug"],
          },
        ],
      });

      return res.json({
        success: true,
        message: "Attributes with values retrieved successfully",
        data: result || [],
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
}

module.exports = CommonActionsController;
