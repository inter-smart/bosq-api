"use strict";

const cron = require("node-cron");
const { Op } = require("sequelize");
const { models, sequelize } = require("../database/models/index");
const Logger = require("../config/logger");

// const STALE_THRESHOLD_MS = 45 * 60 * 1000; // 45 minutes
const STALE_THRESHOLD_MS = 2 * 60 * 1000; // 45 minutes
const BATCH_SIZE = 50;

let isRunning = false;

const releaseStaleOrders = async () => {
  const runAt = new Date().toISOString();

  if (isRunning) {
    Logger.warn(`[StaleOrderCleanup] [${runAt}] Skipping — previous run still in progress`);
    return;
  }
  isRunning = true;
  Logger.info(`[StaleOrderCleanup] [${runAt}] Run started`);

  try {
    const cutoff = new Date(Date.now() - STALE_THRESHOLD_MS);
    Logger.info(`[StaleOrderCleanup] Cutoff time: ${cutoff.toISOString()} (orders older than ${STALE_THRESHOLD_MS / 60000} min)`);

    let released = 0;
    let batchNum = 0;

    // Batch loop — cancelling orders removes them from the next query,
    // so we always query from the top without pagination drift.
    while (true) {
      batchNum++;
      Logger.info(`[StaleOrderCleanup] Fetching batch #${batchNum} (limit: ${BATCH_SIZE})`);

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

      Logger.info(`[StaleOrderCleanup] Batch #${batchNum} — found ${staleOrders.length} stale order(s)`);

      if (!staleOrders.length) break;

      for (const order of staleOrders) {
        Logger.info(`[StaleOrderCleanup] Processing order #${order.id} (created: ${order.createdAt?.toISOString()}, items: ${order.items.length})`);
        const t = await sequelize.transaction();
        try {
          for (const item of order.items) {
            Logger.info(`[StaleOrderCleanup]   Restoring stock — variant #${item.variant_id} +${item.quantity}`);
            await models.ProductVariants.increment("stock", {
              by: item.quantity,
              where: { id: item.variant_id },
              transaction: t,
            });
          }
          await order.update({ status: "cancelled", payment_status: "failed" }, { transaction: t });
          await t.commit();
          released++;
          Logger.info(`[StaleOrderCleanup] Order #${order.id} cancelled and stock restored`);
        } catch (err) {
          await t.rollback();
          Logger.error(`[StaleOrderCleanup] Failed to release order #${order.id}: ${err.message}`);
        }
      }

      if (staleOrders.length < BATCH_SIZE) break;
    }

    Logger.info(`[StaleOrderCleanup] Run complete — ${released} order(s) released across ${batchNum} batch(es)`);
  } catch (err) {
    Logger.error(`[StaleOrderCleanup] Run failed: ${err.message}`);
  } finally {
    isRunning = false;
  }
};

const startStaleOrderCleanup = () => {
  // TODO: change back to "*/15 * * * *" after testing
  cron.schedule("*/5 * * * *", releaseStaleOrders, { timezone: "UTC" });
  Logger.info("[StaleOrderCleanup] Cron scheduled — every 5 minutes (TEST MODE)");
};

module.exports = { startStaleOrderCleanup };
