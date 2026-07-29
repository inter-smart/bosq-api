const { Queue } = require("bullmq");
const { queueConnection } = require("../config/bullConnection");

const bulkUploadQueue = new Queue("bulk-upload", {
  connection: queueConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: { age: 86400, count: 50 },
    removeOnFail: { age: 7 * 86400, count: 500 },
  },
});

/**
 * Adds a bulk upload job to the queue.
 * @param {string} token - The Redis session token for the validated data.
 */
const addBulkUploadJob = (token) => {
  return bulkUploadQueue.add("process_bulk_upload", { token });
};

/**
 * Adds a FAQ upload job to the queue.
 * @param {string} token - The Redis session token for the validated FAQ hierarchy.
 */
const addFaqUploadJob = (token) => {
  return bulkUploadQueue.add("process_faq_upload", { token });
};

/**
 * Adds a product meta upload job to the queue.
 * @param {string} token - The Redis session token for the validated meta rows.
 */
const addMetaUploadJob = (token) => {
  return bulkUploadQueue.add("process_meta_upload", { token });
};

module.exports = { bulkUploadQueue, addBulkUploadJob, addFaqUploadJob, addMetaUploadJob };
