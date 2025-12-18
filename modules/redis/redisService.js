const { redisClient } = require("../../config/redis");

const MAX_EXPIRY = 2 * 60 * 60;

const setCache = async (key, value, expiry = MAX_EXPIRY) => {
  try {
    const serialized = JSON.stringify(value);

    if (expiry) {
      await redisClient.setEx(key, expiry, serialized);
      console.log(`✅ Cache set: ${key} (expires in ${expiry}s)`);
    } else {
      console.log(`✅ Cache set: ${key}`);
      await redisClient.set(key, serialized);
    }
  } catch (error) {
    console.error("Failed to set cache:", error);
  }
};

const invalidateCache = async (key) => {
  try {
    const result = await redisClient.del(key);

    if (result > 0) {
      console.log(`🗑️  Cache invalidated: ${key}`);
    }

    return result > 0;
  } catch (error) {
    console.error("Failed to invalidate cache:", error);
    return false;
  }
};

const getCache = async (key) => {
  try {
    const cachedData = await redisClient.get(key);

    if (cachedData) {
      console.log(`📦 Cache hit: ${key}`);
      return JSON.parse(cachedData);
    }

    console.log(`📭 Cache miss: ${key}`);
    return null;
  } catch (error) {
    console.error("Failed to get cache:", error);
    return null;
  }
};

module.exports = {
  setCache,
  invalidateCache,
  getCache,
};
