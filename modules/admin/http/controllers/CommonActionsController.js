const { redisClient } = require("../../../../config/redis");
const { models } = require("../../../../database/models");
const cacheDependencies = require("../../../redis/cacheDependency");
const {
  invalidateCache,
  invalidateCacheByModel,
} = require("../../../redis/redisService");

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

      // Invalidate cache
      const cacheResult = await invalidateCacheByModel(
        redisClient,
        model_name,
        cacheDependencies
      );

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

      const updated = await Model.update(
        { sort_order },
        { where: { id: row_id } }
      );
      // Fetch updated record
      const updatedContent = await Model.findByPk(row_id);

      // Invalidate cache
      const cacheResult = await invalidateCacheByModel(
        redisClient,
        model_name,
        cacheDependencies
      );

      console.log(
        `✅ Sort order updated for ${model_name} ID:${row_id} - Cache invalidation: ${cacheResult.success} key(s)`
      );

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
}

module.exports = CommonActionsController;
