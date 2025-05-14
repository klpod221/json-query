const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const fs = require('fs');
const path = require('path');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const config = require('./config');
const jsonRoutes = require('./routes/json.route');
const cacheRoutes = require('./routes/cache.route');
const { errorHandler } = require('./middleware');

// Initialize express app
const app = express();

// Apply middleware
app.use(cors());
app.use(helmet({ contentSecurityPolicy: false })); // Disabled for Swagger UI
app.use(compression()); // Compress responses
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(morgan('dev'));

// Load Swagger document
const swaggerDocument = YAML.load(path.join(__dirname, 'config/swagger.yaml'));

// API Documentation route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Check if data directory exists, create if not
if (!fs.existsSync(config.dataDir)) {
  fs.mkdirSync(config.dataDir, { recursive: true });
  console.log(`Data directory created at ${config.dataDir}`);
}

// API Routes
app.use('/api', jsonRoutes);
app.use('/api/cache', cacheRoutes);

// Home route
app.get('/', (req, res) => {
  res.json({
    message: 'Large JSON File API Server',
    documentation: '/api-docs',
    endpoints: {
      listFiles: '/api/files',
      queryFile: '/api/file/:fileName',
      fileStructure: '/api/file/:fileName/structure',
      clearAllCache: '/api/cache/clear',
      clearFileCache: '/api/cache/clear/:fileName',
    }
  });
});

// Error handling middleware
app.use(errorHandler);

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Server running in ${config.nodeEnv} mode on port ${PORT}`);
  console.log(`API Documentation: http://localhost:${PORT}/api-docs`);
});

module.exports = app;
