const { Queue } = require("bullmq");

const connection = {
  url: process.env.REDIS_URL || "redis://localhost:6379",
};

const bulkUploadQueue = new Queue("bulk-upload", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: { age: 86400, count: 50 },
    removeOnFail: { age: 7 * 86400 },
  },
});

/**
 * Adds a bulk upload job to the queue.
 * @param {string} token - The Redis session token for the validated data.
 */
const addBulkUploadJob = (token) => {
  return bulkUploadQueue.add("process_bulk_upload", { token });
};

module.exports = { bulkUploadQueue, addBulkUploadJob };
