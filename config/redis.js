const redis = require("redis");

const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
  },
  password: process.env.REDIS_PASSWORD || undefined,
});

redisClient.on("connect", () => {
  console.log("✅ Redis Client Connected");
});

redisClient.on("error", (err) => {
  console.error("❌ Redis Client Error:", err);
});

const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error("Failed to connect to Redis:", err);
    process.exit(1);
  }
};

module.exports = { redisClient, connectRedis };
