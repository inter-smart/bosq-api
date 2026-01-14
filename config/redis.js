const redis = require("redis");

const redisClient = redis.createClient({
  url: process.env.REDIS_URL,
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
