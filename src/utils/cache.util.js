const config = require("../config");
const NodeCache = require("node-cache");

// Create a cache with TTL and max size
const cache = new NodeCache({
  stdTTL: config.cacheTTL, // default Time-To-Live in seconds
  checkperiod: config.cacheTTL * 0.2, // check for expired keys at 20% of TTL
  maxKeys: config.maxCacheSize, // maximum number of keys in cache
  useClones: false, // don't clone data (for better memory usage)
});

/**
 * Clear all cache or specific cache entries
 * @param {string} [fileName] - Optional file name to clear specific cache entries
 * @returns {number} - Number of cache entries cleared
 */
const clearCache = (fileName) => {
  if (fileName) {
    // Clear specific cache entries for this file
    const keys = cache.keys().filter((key) => key.startsWith(`${fileName}|`));
    keys.forEach((key) => cache.del(key));
    return keys.length;
  } else {
    // Clear all cache
    return cache.flushAll();
  }
};

module.exports = { cache, clearCache };
