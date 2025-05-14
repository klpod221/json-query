const request = require('supertest');
const app = require('../src/app');

describe('API Routes', () => {
  describe('GET /', () => {
    it('should return welcome message and available endpoints', async () => {
      const res = await request(app).get('/');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('endpoints');
    });
  });

  describe('GET /api/files', () => {
    it('should list all available JSON files', async () => {
      const res = await request(app).get('/api/files');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('files');
      expect(Array.isArray(res.body.files)).toBeTruthy();
    });
  });

  describe('GET /api/file/:fileName', () => {
    it('should return data from sample.json file', async () => {
      const res = await request(app).get('/api/file/sample.json');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBeTruthy();
    });

    it('should return 404 for non-existent file', async () => {
      const res = await request(app).get('/api/file/nonexistent.json');
      
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('success', false);
    });

    it('should filter data based on query parameters', async () => {
      const res = await request(app).get('/api/file/sample.json?filter.status=active');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.data.every(item => item.status === 'active')).toBeTruthy();
    });

    it('should sort data based on sortBy and sortOrder', async () => {
      const res = await request(app).get('/api/file/sample.json?sortBy=age&sortOrder=desc');
      
      expect(res.statusCode).toEqual(200);
      
      // Check if data is sorted by age in descending order
      const ages = res.body.data.map(item => item.age);
      const sortedAges = [...ages].sort((a, b) => b - a);
      expect(ages).toEqual(sortedAges);
    });

    it('should paginate results correctly', async () => {
      const res = await request(app).get('/api/file/sample.json?page=1&limit=2');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('page', 1);
      expect(res.body).toHaveProperty('limit', 2);
      expect(res.body).toHaveProperty('totalPages');
      expect(res.body.data.length).toBeLessThanOrEqual(2);
    });

    it('should search data based on search parameter', async () => {
      const searchTerm = 'John';
      const res = await request(app).get(`/api/file/sample.json?search=${searchTerm}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      
      // At least one result should contain the search term
      const containsSearchTerm = res.body.data.some(item => 
        JSON.stringify(item).toLowerCase().includes(searchTerm.toLowerCase())
      );
      expect(containsSearchTerm).toBeTruthy();
    });

    it('should filter by multiple criteria simultaneously', async () => {
      const res = await request(app).get('/api/file/sample.json?filter.status=active&filter.age=30');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      
      // All returned items should match all filter criteria
      expect(res.body.data.every(item => item.status === 'active' && item.age === 30)).toBeTruthy();
    });

    it('should search in specific fields when searchFields is provided', async () => {
      const res = await request(app).get('/api/file/sample.json?search=USA&searchFields=address.country');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      
      // All returned items should have USA in the country field
      expect(res.body.data.every(item => item.address.country === 'USA')).toBeTruthy();
    });

    it('should return the correct total count of results', async () => {
      const res = await request(app).get('/api/file/sample.json');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('total');
      expect(typeof res.body.total).toBe('number');
      expect(res.body.total).toBeGreaterThan(0);
    });
  });

  describe('GET /api/file/:fileName/structure', () => {
    it('should return structure information for sample.json', async () => {
      const res = await request(app).get('/api/file/sample.json/structure');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('structure');
      expect(res.body.structure).toHaveProperty('fields');
    });
  });

  describe('POST /api/cache/clear', () => {
    it('should clear cache', async () => {
      const res = await request(app).post('/api/cache/clear');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('POST /api/cache/clear/:fileName', () => {
    it('should clear cache for specific file', async () => {
      const res = await request(app).post('/api/cache/clear/sample.json');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('sample.json');
      expect(res.body).toHaveProperty('entriesCleared');
      expect(typeof res.body.entriesCleared).toBe('number');
    });
  });
});
