const fs = require('fs');
const path = require('path');
const { parser } = require('stream-json');
const { streamArray } = require('stream-json/streamers/StreamArray');
const config = require('../config');
const { cache } = require('./cache.util');

/**
 * Check if a file exists in the data directory
 * @param {string} fileName - Name of the JSON file
 * @returns {Promise<boolean>} - True if file exists, false otherwise
 */
const checkFileExists = async (fileName) => {
  try {
    const filePath = path.resolve(config.dataDir, fileName);
    await fs.promises.access(filePath, fs.constants.F_OK);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Get JSON file path
 * @param {string} fileName - Name of the JSON file
 * @returns {string} - Full path to the JSON file
 */
const getJsonFilePath = (fileName) => {
  return path.resolve(config.dataDir, fileName);
};

/**
 * Generate a unique cache key based on query parameters and file name
 * @param {string} fileName - Name of the JSON file
 * @param {object} queryParams - Query parameters
 * @returns {string} - Unique cache key
 */
const generateCacheKey = (fileName, queryParams) => {
  const paramsStr = Object.entries(queryParams || {})
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => {
      // Properly serialize the value based on its type
      let serializedValue;
      
      if (value === null || value === undefined) {
        serializedValue = 'null';
      } else if (typeof value === 'object') {
        // For objects (including arrays), use JSON.stringify for proper serialization
        serializedValue = JSON.stringify(value);
      } else {
        serializedValue = String(value);
      }
      
      return `${key}:${serializedValue}`;
    })
    .join('|');
  
  return `${fileName}|${paramsStr}`;
};

/**
 * Process a large JSON file with streaming and apply filters, sorting, and pagination
 * @param {string} fileName - Name of the JSON file
 * @param {object} options - Processing options
 * @param {object} options.filters - Filter criteria
 * @param {string} options.sortBy - Field to sort by
 * @param {string} options.sortOrder - Sort order ('asc' or 'desc')
 * @param {number} options.page - Page number for pagination
 * @param {number} options.limit - Number of items per page
 * @param {string} options.search - Search string
 * @param {string} options.searchFields - Fields to search in
 * @returns {Promise<{data: Array, total: number, page: number, limit: number, totalPages: number}>}
 */
const processJsonFile = async (fileName, options = {}) => {
  const {
    filters = {},
    sortBy = null,
    sortOrder = 'asc',
    page = 1,
    limit = 100,
    search = null,
    searchFields = []
  } = options;

  // Generate a cache key based on all parameters
  const cacheKey = generateCacheKey(fileName, { 
    filters, sortBy, sortOrder, page, limit, search, searchFields 
  });

  // Check if result is in cache
  const cachedResult = cache.get(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }

  return new Promise((resolve, reject) => {
    const filePath = getJsonFilePath(fileName);
    const results = [];
    let total = 0;

    const pipeline = fs.createReadStream(filePath)
      .pipe(parser())
      .pipe(streamArray());

    pipeline.on('data', ({ value }) => {
      // Apply filters
      let matchesFilters = true;
      Object.entries(filters).forEach(([key, filterValue]) => {
        // Skip empty filter values
        if (filterValue === undefined || filterValue === null || filterValue === '') {
          return;
        }

        // Handle nested properties using dot notation
        const keyParts = key.split('.');
        let itemValue = value;
        for (const part of keyParts) {
          if (itemValue && typeof itemValue === 'object') {
            itemValue = itemValue[part];
          } else {
            itemValue = undefined;
            break;
          }
        }

        // Apply filter
        if (Array.isArray(filterValue)) {
          // Handle array of values (IN operator)
          if (!filterValue.includes(itemValue)) {
            matchesFilters = false;
            return; // Exit the loop early
          }
        } else if (typeof filterValue === 'object' && filterValue !== null) {
          // Handle range queries and other operations
          if (filterValue.gt !== undefined && !(itemValue > filterValue.gt)) {
            matchesFilters = false;
            return;
          }
          if (filterValue.gte !== undefined && !(itemValue >= filterValue.gte)) {
            matchesFilters = false;
            return;
          }
          if (filterValue.lt !== undefined && !(itemValue < filterValue.lt)) {
            matchesFilters = false;
            return;
          }
          if (filterValue.lte !== undefined && !(itemValue <= filterValue.lte)) {
            matchesFilters = false;
            return;
          }
          if (filterValue.ne !== undefined && itemValue === filterValue.ne) {
            matchesFilters = false;
            return;
          }
        } else if (String(itemValue) !== String(filterValue)) {
          // Convert both to strings for comparison to handle type mismatches
          matchesFilters = false;
          return; // Exit the loop early
        }
      });

      // Apply search if provided
      let matchesSearch = !search;
      if (search && search.trim() !== '') {
        const searchValue = search.toLowerCase();
        
        // If no specific search fields are provided, search in all string fields
        const fieldsToSearch = searchFields.length > 0 ? searchFields : Object.keys(value);
        
        matchesSearch = fieldsToSearch.some(field => {
          const fieldValue = value[field];
          return typeof fieldValue === 'string' && 
                 fieldValue.toLowerCase().includes(searchValue);
        });
      }

      if (matchesFilters && matchesSearch) {
        results.push(value);
        total++;
      }
    });

    pipeline.on('end', () => {
      // Apply sorting
      if (sortBy) {
        results.sort((a, b) => {
          const aValue = a[sortBy];
          const bValue = b[sortBy];
          
          if (aValue === bValue) return 0;
          
          const comparison = aValue < bValue ? -1 : 1;
          return sortOrder.toLowerCase() === 'desc' ? -comparison : comparison;
        });
      }

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedResults = results.slice(startIndex, endIndex);
      
      const result = {
        data: paginatedResults,
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / limit)
      };

      // Store in cache
      cache.set(cacheKey, result);
      
      resolve(result);
    });

    pipeline.on('error', (err) => {
      reject(err);
    });
  });
};

/**
 * Detect the structure of a JSON file
 * @param {string} fileName - Name of the JSON file
 * @returns {Promise<object>} - Structure information of the JSON file
 */
const detectJsonStructure = async (fileName) => {
  const filePath = getJsonFilePath(fileName);
  
  return new Promise((resolve, reject) => {
    const structure = {
      type: null,
      fields: new Set(),
      sample: null,
      rootElementType: null
    };
    
    let counter = 0;
    const maxSamples = 10;
    
    const pipeline = fs.createReadStream(filePath)
      .pipe(parser())
      .pipe(streamArray());

    pipeline.on('data', ({ value }) => {
      if (counter === 0) {
        structure.sample = value;
        
        // Detect if array of objects or simple array
        if (typeof value === 'object' && value !== null) {
          structure.rootElementType = 'object';
          
          // Collect fields from the first object
          collectFields(value, structure.fields);
        } else {
          structure.rootElementType = typeof value;
        }
      } else if (counter < maxSamples) {
        // Collect fields from subsequent objects
        if (typeof value === 'object' && value !== null) {
          collectFields(value, structure.fields);
        }
      }
      
      counter++;
      
      // Stop after analyzing a few samples
      if (counter >= maxSamples) {
        pipeline.destroy();
      }
    });

    pipeline.on('end', () => {
      structure.type = 'array';
      structure.fields = Array.from(structure.fields);
      structure.count = counter;
      resolve(structure);
    });

    pipeline.on('error', (err) => {
      reject(err);
    });
  });
};

/**
 * Helper function to collect fields from an object (including nested fields)
 * @param {object} obj - Object to collect fields from
 * @param {Set} fieldsSet - Set to store fields
 * @param {string} prefix - Prefix for nested fields
 */
function collectFields(obj, fieldsSet, prefix = '') {
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    fieldsSet.add(fullKey);
    
    // Recursively collect nested fields
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      collectFields(value, fieldsSet, fullKey);
    }
  }
}

/**
 * List all JSON files in the data directory
 * @returns {Promise<string[]>} - List of JSON file names
 */
const listJsonFiles = async () => {
  try {
    const files = await fs.promises.readdir(config.dataDir);
    return files.filter(file => file.endsWith('.json'));
  } catch (error) {
    console.error('Error listing JSON files:', error);
    return [];
  }
};

module.exports = {
  checkFileExists,
  getJsonFilePath,
  processJsonFile,
  detectJsonStructure,
  listJsonFiles
};
