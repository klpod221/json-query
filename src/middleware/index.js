const { validationResult } = require('express-validator');
const { checkFileExists } = require('../utils/json.util');

/**
 * Middleware for checking if a requested JSON file exists
 */
const fileExistsMiddleware = async (req, res, next) => {
  const fileName = req.params.fileName;
  
  // Make sure file name is provided
  if (!fileName) {
    return res.status(400).json({
      success: false,
      error: 'File name is required'
    });
  }

  // Add .json extension if not provided
  const jsonFileName = fileName.endsWith('.json') ? fileName : `${fileName}.json`;
  
  // Check if file exists
  const exists = await checkFileExists(jsonFileName);
  if (!exists) {
    return res.status(404).json({
      success: false,
      error: `File '${jsonFileName}' not found in data directory`
    });
  }

  // Store the normalized file name in request object
  req.jsonFileName = jsonFileName;
  next();
};

/**
 * Middleware for validating request data using express-validator
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

/**
 * Middleware for parsing query parameters into appropriate types
 */
const parseQueryParams = (req, res, next) => {
  try {
    // Parse filter parameters starting with "filter."
    const filters = {};
    Object.entries(req.query).forEach(([key, value]) => {
      if (key.startsWith('filter.')) {
        const filterKey = key.substring(7); // Remove 'filter.' prefix
        
        // Try to parse as JSON if it starts with [ or {
        if (typeof value === 'string' && 
            (value.startsWith('[') || value.startsWith('{'))) {
          try {
            filters[filterKey] = JSON.parse(value);
          } catch (e) {
            filters[filterKey] = value;
          }
        } else {
          filters[filterKey] = value;
        }
      }
    });

    // Parse pagination parameters
    const page = req.query.page ? parseInt(req.query.page, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 100;
    
    // Parse sorting parameters
    const sortBy = req.query.sortBy || null;
    const sortOrder = req.query.sortOrder || 'asc';

    // Parse search parameters
    const search = req.query.search || null;
    const searchFields = req.query.searchFields ? 
      req.query.searchFields.split(',').map(field => field.trim()) : [];

    // Store parsed query parameters in request object
    req.parsedQuery = {
      filters,
      page,
      limit,
      sortBy,
      sortOrder,
      search,
      searchFields
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
};

module.exports = {
  fileExistsMiddleware,
  validateRequest,
  parseQueryParams,
  errorHandler
};
