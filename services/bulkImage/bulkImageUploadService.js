const fs = require("fs").promises;
const path = require("path");
const Logger = require("../../config/logger");

const BULK_DIR = path.join(__dirname, "../../uploads/bulk");

/**
 * Processes a batch of staged image/video files.
 * For each file:
 *  - If a file with the same original name already exists in uploads/bulk → skip it.
 *  - Otherwise → move it from staging to uploads/bulk (preserving original filename).
 *
 * Progress is reported on the BullMQ job (0–100%).
 *
 * @param {Array<{originalname: string, stagingPath: string}>} files
 * @param {import("bullmq").Job} job
 * @returns {Promise<{saved_count: number, skipped_count: number, skipped_files: string[]}>}
 */
async function processImageUpload(files, job) {
  // Ensure the final bulk directory exists
  await fs.mkdir(BULK_DIR, { recursive: true });

  const saved = [];
  const skipped = [];

  for (let i = 0; i < files.length; i++) {
    const { originalname, stagingPath } = files[i];
    const destPath = path.join(BULK_DIR, originalname);

    try {
      // Check if file already exists in the bulk folder
      const exists = await fs
        .access(destPath)
        .then(() => true)
        .catch(() => false);

      if (exists) {
        // Duplicate — skip and remove the staged copy
        skipped.push(originalname);
        Logger.info(`[BulkImageUpload] Skipped (duplicate): ${originalname}`);
        await fs.unlink(stagingPath).catch((err) => {
          Logger.warn(`[BulkImageUpload] Could not remove staging file ${stagingPath}: ${err.message}`);
        });
      } else {
        // Not a duplicate — move from staging to final destination
        await fs.rename(stagingPath, destPath);
        saved.push(originalname);
        Logger.info(`[BulkImageUpload] Saved: ${originalname}`);
      }
    } catch (err) {
      Logger.error(`[BulkImageUpload] Error processing ${originalname}: ${err.message}`);
      // Attempt to clean up staging file on error
      await fs.unlink(stagingPath).catch(() => {});
      throw err;
    }

    // Update BullMQ job progress (0–100)
    const progress = Math.round(((i + 1) / files.length) * 100);
    await job.updateProgress(progress);
  }

  return {
    saved_count: saved.length,
    skipped_count: skipped.length,
    skipped_files: skipped,
  };
}

/**
 * Cleans up any remaining staging files for a failed job.
 * @param {Array<{stagingPath: string}>} files
 */
async function cleanupStagingFiles(files) {
  for (const { stagingPath } of files) {
    await fs.unlink(stagingPath).catch(() => {});
  }
}

module.exports = { processImageUpload, cleanupStagingFiles };
