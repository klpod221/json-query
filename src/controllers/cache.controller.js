const { clearCache } = require('../utils/cache.util');

/**
 * Clear cache for a specific file or all files
 */
const clearCacheController = async (req, res, next) => {
  try {
    const { fileName } = req.params;
    
    const cleared = clearCache(fileName);
    
    res.json({
      success: true,
      message: fileName 
        ? `Cache cleared for file: ${fileName}` 
        : 'All cache cleared',
      entriesCleared: cleared
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  clearCacheController
};