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

const invalidateMultipleCaches = async (redisClient, keys) => {
  try {



    if (!keys || keys.length === 0) {
      console.log("⚠️  No cache keys provided for invalidation");
      return { success: 0, failed: 0, keys: [] };
    }

    const results = await Promise.allSettled(
      keys.map(key => redisClient.del(key))
    );

    const successCount = results.filter(
      r => r.status === "fulfilled" && r.value > 0
    ).length;

    const failedCount = results.filter(
      r => r.status === "rejected"
    ).length;

    if (successCount > 0) {
      console.log(`🗑️  Cache invalidated: ${successCount} key(s) - [${keys.join(", ")}]`);
    }

    if (failedCount > 0) {
      console.error(`❌ Failed to invalidate: ${failedCount} key(s)`);
    }

    return {
      success: successCount,
      failed: failedCount,
      keys: keys
    };
  } catch (error) {
    console.error("Failed to invalidate multiple caches:", error);
    return { success: 0, failed: keys.length, keys };
  }
};



const invalidateCacheByModel = async (redisClient, modelName, cacheDependencies, rowData = null) => {
  try {
    const keysToInvalidate = cacheDependencies[modelName];

    if (!keysToInvalidate) {
      console.log(`⚠️  No cache dependencies found for model: ${modelName}`);
      return { success: 0, failed: 0, keys: [] };
    }

    // If keysToInvalidate is a string, convert to array
    const keysArray = Array.isArray(keysToInvalidate) ? keysToInvalidate : [keysToInvalidate];

    // Process keys - handle both static strings and dynamic functions
    const keys = keysArray.map(key => {
      if (typeof key === 'function' && rowData) {
        return key(rowData);
      }
      return key;
    }).filter(Boolean); // Remove any null/undefined values

    console.log(keys)
    return await invalidateMultipleCaches(redisClient, keys);
  } catch (error) {
    console.error(`Failed to invalidate cache for model ${modelName}:`, error);
    return { success: 0, failed: 0, keys: [] };
  }
};

module.exports = {
  setCache,
  invalidateCache,
  getCache,
  invalidateCacheByModel
};
