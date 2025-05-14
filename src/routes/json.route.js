const express = require('express');
const { check } = require('express-validator');
const { 
  getData, 
  getStructure, 
  listFiles
} = require('../controllers/json.controller');
const { 
  fileExistsMiddleware, 
  validateRequest,
  parseQueryParams 
} = require('../middleware');

const router = express.Router();

/**
 * @swagger
 * /api/files:
 *   get:
 *     summary: List all available JSON files
 *     description: Returns a list of all JSON files available in the data directory
 *     tags: [Files]
 *     responses:
 *       200:
 *         description: List of JSON files
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 files:
 *                   type: array
 *                   items:
 *                     type: string
 */
router.get('/files', listFiles);

/**
 * @swagger
 * /api/file/{fileName}:
 *   get:
 *     summary: Query data from a JSON file
 *     description: Query, filter, sort, and paginate data from a large JSON file
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: fileName
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the JSON file to query
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *           default: 100
 *         description: Number of items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Field to sort results by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order (ascending or descending)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search string to filter results
 *       - in: query
 *         name: searchFields
 *         schema:
 *           type: string
 *         description: Comma-separated list of fields to search in
 *       - in: query
 *         name: filter.*
 *         schema:
 *           type: string
 *         description: Filter criteria (e.g., filter.age=25, filter.status=[active,pending])
 *     responses:
 *       200:
 *         description: Filtered and paginated data
 *       404:
 *         description: File not found
 *       400:
 *         description: Invalid parameters
 */
router.get('/file/:fileName', [
  check('fileName').notEmpty().withMessage('File name is required'),
  validateRequest,
  fileExistsMiddleware,
  parseQueryParams
], getData);

/**
 * @swagger
 * /api/file/{fileName}/structure:
 *   get:
 *     summary: Get JSON file structure information
 *     description: Detect and return information about the structure of a JSON file
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: fileName
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the JSON file
 *     responses:
 *       200:
 *         description: JSON file structure information
 *       404:
 *         description: File not found
 */
router.get('/file/:fileName/structure', [
  fileExistsMiddleware
], getStructure);

module.exports = router;
