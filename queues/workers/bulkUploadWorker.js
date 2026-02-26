const { Worker } = require("bullmq");
const { redisClient } = require("../../config/redis");
const { processUpload } = require("../../services/bulkUpload/bulkUploadService");
const Logger = require("../../config/logger");

const connection = {
  url: process.env.REDIS_URL || "redis://localhost:6379",
};

const SESSION_PREFIX = "bulk_upload_session:";

let worker = null;

const processJob = async (job) => {
  const { token } = job.data;

  if (!token) {
    throw new Error("Bulk upload job is missing the session token");
  }

  const redisKey = `${SESSION_PREFIX}${token}`;
  Logger.info(`[BulkUploadWorker] Processing job ${job.id}, token: ${token}`);

  // Retrieve validated hierarchy from Redis
  const raw = await redisClient.get(redisKey);
  if (!raw) {
    throw new Error(`Session token "${token}" not found or expired. Cannot process upload.`);
  }

  const hierarchy = JSON.parse(raw);

  // Process DB inserts
  const summary = await processUpload(hierarchy);

  // Delete session from Redis after successful processing (consumed once)
  await redisClient.del(redisKey);

  Logger.info(`[BulkUploadWorker] Job ${job.id} completed. Summary: ${JSON.stringify(summary)}`);
  return summary;
};

const startBulkUploadWorker = () => {
  worker = new Worker("bulk-upload", processJob, {
    connection,
    concurrency: 1, // Process one bulk upload at a time to protect DB
  });

  worker.on("completed", (job, result) => {
    Logger.info(
      `[BulkUploadWorker] Job ${job.id} completed. Bases: ${result.bases_inserted}, Models: ${result.models_inserted}, Variants: ${result.variants_inserted}`
    );
  });

  worker.on("failed", (job, err) => {
    Logger.error(
      `[BulkUploadWorker] Job ${job?.id} failed [attempt ${job?.attemptsMade}/${job?.opts?.attempts}]: ${err.message}`
    );
  });

  worker.on("error", (err) => {
    Logger.error(`[BulkUploadWorker] Worker error: ${err.message}`);
  });

  Logger.info("[BulkUploadWorker] Bulk upload worker started");
  return worker;
};

const stopBulkUploadWorker = async () => {
  if (worker) {
    await worker.close();
    Logger.info("[BulkUploadWorker] Bulk upload worker stopped");
  }
};

module.exports = { startBulkUploadWorker, stopBulkUploadWorker };
