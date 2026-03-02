const { Worker } = require("bullmq");
const { processImageUpload, cleanupStagingFiles } = require("../../services/bulkImage/bulkImageUploadService");
const Logger = require("../../config/logger");

const connection = {
  url: process.env.REDIS_URL || "redis://localhost:6379",
};

let worker = null;

const processJob = async (job) => {
  const { files } = job.data;

  if (!files || !Array.isArray(files) || files.length === 0) {
    throw new Error("Bulk image upload job is missing file data.");
  }

  Logger.info(
    `[BulkImageUploadWorker] Processing job ${job.id} — ${files.length} file(s)`
  );

  try {
    const summary = await processImageUpload(files, job);
    Logger.info(
      `[BulkImageUploadWorker] Job ${job.id} complete — saved: ${summary.saved_count}, skipped: ${summary.skipped_count}`
    );
    return summary;
  } catch (err) {
    // On unexpected error, attempt to clean up any remaining staged files
    Logger.error(`[BulkImageUploadWorker] Job ${job.id} failed: ${err.message}. Cleaning up staging files.`);
    await cleanupStagingFiles(files);
    throw err;
  }
};

const startBulkImageUploadWorker = () => {
  worker = new Worker("bulk-image-upload", processJob, {
    connection,
    concurrency: 1, // One batch at a time to protect the filesystem
  });

  worker.on("completed", (job, result) => {
    Logger.info(
      `[BulkImageUploadWorker] Job ${job.id} completed — saved: ${result.saved_count}, skipped: ${result.skipped_count}`
    );
  });

  worker.on("failed", (job, err) => {
    Logger.error(
      `[BulkImageUploadWorker] Job ${job?.id} failed [attempt ${job?.attemptsMade}/${job?.opts?.attempts}]: ${err.message}`
    );
  });

  worker.on("error", (err) => {
    Logger.error(`[BulkImageUploadWorker] Worker error: ${err.message}`);
  });

  Logger.info("[BulkImageUploadWorker] Bulk image upload worker started");
  return worker;
};

const stopBulkImageUploadWorker = async () => {
  if (worker) {
    await worker.close();
    Logger.info("[BulkImageUploadWorker] Bulk image upload worker stopped");
  }
};

module.exports = { startBulkImageUploadWorker, stopBulkImageUploadWorker };
