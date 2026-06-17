// Shared Redis connection configs for BullMQ Queues and Workers.
//
// - queueConnection: used by Queue (producer) files. Keeps default
//   maxRetriesPerRequest so HTTP-triggered .add() calls fail fast if
//   Redis is down, rather than hanging the request.
// - workerConnection: used by Worker (consumer) files. Sets
//   maxRetriesPerRequest: null so workers wait/retry indefinitely on a
//   Redis blip instead of throwing and potentially crashing the process.

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const queueConnection = {
  url: REDIS_URL,
};

const workerConnection = {
  url: REDIS_URL,
  maxRetriesPerRequest: null,
};

module.exports = { queueConnection, workerConnection };
