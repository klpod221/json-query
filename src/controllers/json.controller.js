const {
  processJsonFile,
  detectJsonStructure,
  listJsonFiles,
} = require("../utils/json.util");

/**
 * Get data from JSON file with filtering, sorting, and pagination
 */
const getData = async (req, res, next) => {
  try {
    const { jsonFileName } = req;
    const { filters, sortBy, sortOrder, page, limit, search, searchFields } =
      req.parsedQuery;

    const result = await processJsonFile(jsonFileName, {
      filters,
      sortBy,
      sortOrder,
      page,
      limit,
      search,
      searchFields,
    });

    res.json({
      success: true,
      file: jsonFileName,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get information about a JSON file structure
 */
const getStructure = async (req, res, next) => {
  try {
    const { jsonFileName } = req;

    const structure = await detectJsonStructure(jsonFileName);

    res.json({
      success: true,
      file: jsonFileName,
      structure,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all available JSON files
 */
const listFiles = async (req, res, next) => {
  try {
    const files = await listJsonFiles();

    res.json({
      success: true,
      files,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getData,
  getStructure,
  listFiles,
};
