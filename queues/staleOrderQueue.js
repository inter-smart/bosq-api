const { Queue } = require("bullmq");

const connection = {
  url: process.env.REDIS_URL || "redis://localhost:6379",
};

const staleOrderQueue = new Queue("stale-order-cleanup", {
  connection,
  defaultJobOptions: {
    attempts: 1,             // no retry — next scheduled run will catch any missed orders
    removeOnComplete: true,  // no need to keep success records in Redis
    removeOnFail: { count: 10 },
  },
});

module.exports = { staleOrderQueue };
