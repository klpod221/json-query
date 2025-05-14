const express = require('express');
const { clearCacheController } = require('../controllers/cache.controller');

const router = express.Router();

/**
 * @swagger
 * /api/cache/clear:
 *   post:
 *     summary: Clear all cache
 *     description: Clear all cached query results
 *     tags: [Cache]
 *     responses:
 *       200:
 *         description: Cache cleared successfully
 */
router.post('/clear', clearCacheController);

/**
 * @swagger
 * /api/cache/clear/{fileName}:
 *   post:
 *     summary: Clear cache for a specific file
 *     description: Clear cached query results for a specific JSON file
 *     tags: [Cache]
 *     parameters:
 *       - in: path
 *         name: fileName
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the JSON file
 *     responses:
 *       200:
 *         description: Cache cleared successfully
 */
router.post('/clear/:fileName', clearCacheController);

module.exports = router;