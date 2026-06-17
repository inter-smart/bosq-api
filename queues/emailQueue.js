const { Queue } = require("bullmq");
const { queueConnection } = require("../config/bullConnection");

const emailQueue = new Queue("email", {
  connection: queueConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: { age: 3600, count: 100 },
    removeOnFail: { age: 86400, count: 1000 },
  },
});

const addOrderConfirmationJob = (data) => {
  return emailQueue.add("order_confirmation", data);
};

module.exports = { emailQueue, addOrderConfirmationJob };
