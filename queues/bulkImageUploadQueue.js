const { Queue } = require("bullmq");

const connection = {
  url: process.env.REDIS_URL || "redis://localhost:6379",
};

const bulkImageUploadQueue = new Queue("bulk-image-upload", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: { age: 86400, count: 100 },
    removeOnFail: { age: 7 * 86400 },
  },
});

/**
 * Adds a bulk image upload job to the queue.
 * @param {Array<{originalname: string, stagingPath: string}>} files
 */
const addBulkImageUploadJob = (files) => {
  return bulkImageUploadQueue.add("process_bulk_images", { files });
};

module.exports = { bulkImageUploadQueue, addBulkImageUploadJob };
