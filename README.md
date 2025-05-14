# JSON Data API

An Express.js API for efficiently reading, filtering, sorting, and searching data from large JSON files.

## Features

- **Efficient JSON Processing**: Stream-based processing for handling extremely large JSON files without loading them entirely into memory
- **Advanced Querying**: Filter, sort, search, and paginate data from any JSON file
- **Caching**: Smart caching system to improve performance for repeated queries
- **Dynamic File Structure Detection**: Automatically detects and adapts to different JSON structures
- **API Documentation**: Swagger UI for exploring and testing the API
- **Docker Support**: Easy deployment with Docker and Docker Compose

## Prerequisites

- Node.js (v14+)
- npm or yarn
- Docker and Docker Compose (for containerized deployment)

## Installation

### Local Development

1. Clone the repository:

```bash
git clone https://github.com/klpod221/json-query
cd json-query
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file (or use the default settings):

```
PORT=3000
NODE_ENV=development
CACHE_TTL=3600
MAX_CACHE_SIZE=1000
```

4. Start the development server:

```bash
npm run dev
```

### Docker Deployment

1. Build and start the container:

```bash
# Build the Docker image
npm run docker:build

# Start the container
npm run docker:up
```

2. To stop the container:

```bash
npm run docker:down
```

## Usage

### Placing JSON Files

Place your JSON files in the `./data/` directory. The API will automatically detect and make them available.

### API Endpoints

- **List all JSON files**:

  ```
  GET /api/files
  ```

- **Query data from a JSON file**:

  ```
  GET /api/file/:fileName
  ```

  Query parameters:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 100)
  - `sortBy`: Field to sort by
  - `sortOrder`: Sort order ('asc' or 'desc')
  - `search`: Text to search for
  - `searchFields`: Comma-separated fields to search in
  - `filter.fieldName`: Filter by field value (supports nested fields via dot notation)

- **Get JSON file structure**:

  ```
  GET /api/file/:fileName/structure
  ```

- **Clear cache**:

  ```
  POST /api/cache/clear
  POST /api/cache/clear/:fileName
  ```

### API Documentation

Once the server is running, you can access the Swagger UI documentation at:

```
http://localhost:3000/api-docs
```

## Examples

### Query with Filtering and Sorting

```
GET /api/file/users.json?page=1&limit=20&sortBy=age&sortOrder=desc&filter.status=active&filter.age[gte]=18
```

### Search in Specific Fields

```
GET /api/file/products.json?search=laptop&searchFields=name,description&page=1&limit=50
```

### Complex Filtering (Range Queries)

```
GET /api/file/sales.json?filter.amount[gte]=1000&filter.amount[lte]=5000&filter.date[gt]=2023-01-01
```

## Performance Considerations

- The API uses streaming to process large JSON files without loading them entirely into memory
- Results are cached to improve performance for repeated queries
- For extremely large files, consider horizontal scaling or using tools like Redis for distributed caching

## License

[MIT License](LICENSE)
