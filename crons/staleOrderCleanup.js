"use strict";

const cron = require("node-cron");
const { Op } = require("sequelize");
const { models, sequelize } = require("../database/models/index");
const Logger = require("../config/logger");

const STALE_THRESHOLD_MS = 45 * 60 * 1000; // 45 minutes
const BATCH_SIZE = 50;

let isRunning = false;

const releaseStaleOrders = async () => {
  if (isRunning) return; // skip if a previous run is still in progress
  isRunning = true;

  try {
    const cutoff = new Date(Date.now() - STALE_THRESHOLD_MS);
    let released = 0;

    // Batch loop — cancelling orders removes them from the next query,
    // so we always query from the top without pagination drift.
    while (true) {
      const staleOrders = await models.Orders.findAll({
        where: {
          status: "pending",
          payment_type: "online",
          payment_status: "pending",
          createdAt: { [Op.lt]: cutoff },
        },
        include: [{ model: models.OrderItem, as: "items" }],
        limit: BATCH_SIZE,
      });

      if (!staleOrders.length) break;

      for (const order of staleOrders) {
        const t = await sequelize.transaction();
        try {
          for (const item of order.items) {
            await models.ProductVariants.increment("stock", {
              by: item.quantity,
              where: { id: item.variant_id },
              transaction: t,
            });
          }
          await order.update(
            { status: "cancelled", payment_status: "failed" },
            { transaction: t },
          );
          await t.commit();
          released++;
        } catch (err) {
          await t.rollback();
          Logger.error(`[StaleOrderCleanup] Failed to release order ${order.id}: ${err.message}`);
        }
      }

      if (staleOrders.length < BATCH_SIZE) break;
    }

    if (released > 0) {
      Logger.info(`[StaleOrderCleanup] Released stock for ${released} stale order(s)`);
    }
  } catch (err) {
    Logger.error(`[StaleOrderCleanup] Run failed: ${err.message}`);
  } finally {
    isRunning = false;
  }
};

const startStaleOrderCleanup = () => {
  // Runs every 15 minutes
  cron.schedule("*/15 * * * *", releaseStaleOrders, { timezone: "UTC" });
  Logger.info("[StaleOrderCleanup] Cron scheduled — every 15 minutes");
};

module.exports = { startStaleOrderCleanup };
