const { Worker } = require("bullmq");
const { workerConnection } = require("../../config/bullConnection");
const { redisClient } = require("../../config/redis");
const { processUpload } = require("../../services/bulkUpload/bulkUploadService");
const { processFaqUpload } = require("../../services/bulkUpload/faqBulkUploadService");
const { processProductMetaUpload } = require("../../services/bulkUpload/productMetaBulkUploadService");
const Logger = require("../../config/logger");

const SESSION_PREFIX = "bulk_upload_session:";
const FAQ_SESSION_PREFIX = "bulk_faq_session:";
const META_SESSION_PREFIX = "bulk_meta_session:";

let worker = null;

const processMainJob = async (job) => {
  const { token } = job.data;

  if (!token) {
    throw new Error("Bulk upload job is missing the session token");
  }

  const redisKey = `${SESSION_PREFIX}${token}`;
  Logger.info(`[BulkUploadWorker] Processing main job ${job.id}, token: ${token}`);

  const raw = await redisClient.get(redisKey);
  if (!raw) {
    throw new Error(`Session token "${token}" not found or expired. Cannot process upload.`);
  }

  const hierarchy = JSON.parse(raw);
  const summary = await processUpload(hierarchy);

  await redisClient.del(redisKey);

  Logger.info(`[BulkUploadWorker] Main job ${job.id} completed. Summary: ${JSON.stringify(summary)}`);
  return summary;
};

const processFaqJob = async (job) => {
  const { token } = job.data;

  if (!token) {
    throw new Error("FAQ upload job is missing the session token");
  }

  const redisKey = `${FAQ_SESSION_PREFIX}${token}`;
  Logger.info(`[BulkUploadWorker] Processing FAQ job ${job.id}, token: ${token}`);

  const raw = await redisClient.get(redisKey);
  if (!raw) {
    throw new Error(`FAQ session token "${token}" not found or expired. Cannot process upload.`);
  }

  const hierarchy = JSON.parse(raw);
  const summary = await processFaqUpload(hierarchy);

  await redisClient.del(redisKey);

  Logger.info(`[BulkUploadWorker] FAQ job ${job.id} completed. Summary: ${JSON.stringify(summary)}`);
  return summary;
};

const processMetaJob = async (job) => {
  const { token } = job.data;

  if (!token) {
    throw new Error("Product meta upload job is missing the session token");
  }

  const redisKey = `${META_SESSION_PREFIX}${token}`;
  Logger.info(`[BulkUploadWorker] Processing meta job ${job.id}, token: ${token}`);

  const raw = await redisClient.get(redisKey);
  if (!raw) {
    throw new Error(`Meta session token "${token}" not found or expired. Cannot process upload.`);
  }

  const hierarchy = JSON.parse(raw);
  const summary = await processProductMetaUpload(hierarchy);

  await redisClient.del(redisKey);

  Logger.info(`[BulkUploadWorker] Meta job ${job.id} completed. Summary: ${JSON.stringify(summary)}`);
  return summary;
};

const processJob = async (job) => {
  if (job.name === "process_faq_upload") return processFaqJob(job);
  if (job.name === "process_meta_upload") return processMetaJob(job);
  return processMainJob(job);
};

const startBulkUploadWorker = () => {
  worker = new Worker("bulk-upload", processJob, {
    connection: workerConnection,
    concurrency: 1, // Process one bulk upload at a time to protect DB
  });

  worker.on("completed", (job, result) => {
    Logger.info(`[BulkUploadWorker] Job ${job.id} (${job.name}) completed.`);
  });

  worker.on("failed", (job, err) => {
    Logger.error(
      `[BulkUploadWorker] Job ${job?.id} (${job?.name}) failed [attempt ${job?.attemptsMade}/${job?.opts?.attempts}]: ${err.message}`
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
