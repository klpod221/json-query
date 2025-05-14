const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  cacheTTL: parseInt(process.env.CACHE_TTL || '3600', 10), // Cache time-to-live in seconds (default: 1 hour)
  maxCacheSize: parseInt(process.env.MAX_CACHE_SIZE || '1000', 10), // Maximum number of items in cache
  dataDir: './data' // Directory containing JSON files
};
