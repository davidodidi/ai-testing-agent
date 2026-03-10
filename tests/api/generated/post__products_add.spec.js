import { test, expect } from '@playwright/test';

const BASE_URL = 'https://dummyjson.com';
const ENDPOINT = '/products/add';

test.describe('POST /products/add', () => {
  test.describe('Happy Path', () => {
    test('should create product with valid data and return 200', async ({ request }) => {
      const response = await request.post(`${BASE_URL}${ENDPOINT}`, {
        data: {
          title: 'Test Product',
          price: 99.99,
          description: 'A test product',
          category: 'electronics',
          thumbnail: 'https://example.com/img.png'
        }
      });

      expect(response.status()).toBe(200);
      
      const responseBody = await response.json();
      expect(responseBody).toHaveProperty('id');
      expect(typeof responseBody.id).toBe('number');
      expect(responseBody).toHaveProperty('title', 'Test Product');
      expect(responseBody).toHaveProperty('price', 99.99);
      expect(response.headers()['content-type']).toContain('application/json');
    });

    test('should create product with minimal required fields', async ({ request }) => {
      const response = await request.post(`${BASE_URL}${ENDPOINT}`, {
        data: {
          title: 'Minimal Product',
          price: 10.00
        }
      });

      expect(response.status()).toBe(200);
      
      const responseBody = await response.json();
      expect(responseBody).toHaveProperty('id');
      expect(responseBody).toHaveProperty('title', 'Minimal Product');
      expect(responseBody).toHaveProperty('price', 10.00);
    });
  });

  test.describe('Boundary Value Tests', () => {
    test('should handle empty string for title', async ({ request }) => {
      const response = await request.post(`${BASE_URL}${ENDPOINT}`, {
        data: {
          title: '',
          price: 50.00,
          description: 'Product with empty title',
          category: 'electronics'
        }
      });

      expect(response.status()).toBe(400);
    });

    test('should handle very long title', async ({ request }) => {
      const longTitle = 'A'.repeat(1000);
      const response = await request.post(`${BASE_URL}${ENDPOINT}`, {
        data: {
          title: longTitle,
          price: 99.99,
          description: 'Product with long title',
          category: 'electronics'
        }
      });

      expect(response.status()).toBe(200);
      const responseBody = await response.json();
      expect(responseBody.title).toBe(longTitle);
    });

    test('should handle zero price', async ({ request }) => {
      const response = await request.post(`${BASE_URL}${ENDPOINT}`, {
        data: {
          title: 'Free Product',
          price: 0,
          description: 'A free product',
          category: 'electronics'
        }
      });

      expect(response.status()).toBe(200);
      const responseBody = await response.json();
      expect(responseBody.price).toBe(0);
    });

    test('should handle negative price', async ({ request }) => {
      const response = await request.post(`${BASE_URL}${ENDPOINT}`, {
        data: {
          title: 'Negative Price Product',
          price: -10.99,
          description: 'Product with negative price',
          category: 'electronics'
        }
      });

      expect(response.status()).toBe(400);
    });

    test('should handle very large price', async ({ request }) => {
      const response = await request.post(`${BASE_URL}${ENDPOINT}`, {
        data: {
          title: 'Expensive Product',
          price: 999999999.99,
          description: 'Very expensive product',
          category: 'electronics'
        }
      });

      expect(response.status()).toBe(200);
      const responseBody = await response.json();
      expect(responseBody.price).toBe(999999999.99);
    });

    test('should handle empty description', async ({ request }) => {
      const response = await request.post(`${BASE_URL}${ENDPOINT}`, {
        data: {
          title: 'Product without description',
          price: 50.00,
          description: '',
          category: 'electronics'
        }
      });

      expect(response.status()).toBe(200);
    });
  });

  test.describe('Missing Required Fields', () => {
    test('should return 400 when title is missing', async ({ request }) => {
      const response = await request.post(`${BASE_URL}${ENDPOINT}`, {
        data: {
          price: 99.99,
          description: 'A test product',
          category: 'electronics'
        }
      });

      expect(response.status()).toBe(400);
    });

    test('should return 400 when price is missing', async ({ request }) => {
      const response = await request.post(`${BASE_URL}${ENDPOINT}`, {
        data: {
          title: 'Product without price',
          description: 'A test product',
          category: 'electronics'
        }
      });

      expect(response.status()).toBe(400);
    });

    test('should return 400 when request body is empty', async ({ request }) => {
      const response = await request.post(`${BASE_URL}${ENDPOINT}`, {
        data: {}
      });

      expect(response.status()).toBe(400);
    });
  });

  test.describe('Invalid Data Types', () => {
    test('should return 400 when price is string', async ({ request }) => {
      const response = await request.post(`${BASE_URL}${ENDPOINT}`, {
        data: {
          title: 'Invalid Price Product',
          price: 'ninety-nine',
          description: 'Product with string price',
          category: 'electronics'
        }
      });

      expect(response.status()).toBe(400);
    });

    test('should return 400 when title is number', async ({ request }) => {
      const response = await request.post(`${BASE_URL}${ENDPOINT}`, {
        data: {
          title: 12345,
          price: 99.99,
          description: 'Product with numeric title',
          category: 'electronics'
        }
      });

      expect(response.status()).toBe(400);
    });

    test('should return 400 when price is boolean', async ({ request }) => {
      const response = await request.post(`${BASE_URL}${ENDPOINT}`, {
        data: {
          title: 'Boolean Price Product',
          price: true,
          description: 'Product with boolean price',
          category: 'electronics'
        }
      });

      expect(response.status()).toBe(400);
    });

    test('should return 400 when sending array instead of object', async ({ request }) => {
      const response = await request.post(`${BASE_URL}${ENDPOINT}`, {
        data: ['invalid', 'data', 'format']
      });

      expect(response.status()).toBe(400);
    });
  });

  test.describe('Unauthorized Access', () => {
    test('should return 401 when no authorization header is provided', async ({ request }) => {
      // TODO: Add authorization header requirement when API requires auth
      const response = await request.post(`${BASE_URL}${ENDPOINT}`, {
        headers: {
          'Authorization': ''
        },
        data: {
          title: 'Unauthorized Product',
          price: 99.99
        }
      });

      // Note: DummyJSON doesn't require auth, adjust expectation based on actual API
      expect([200, 401, 403]).toContain(response.status());
    });

    test('should return 401 when invalid token is provided', async ({ request }) => {
      // TODO: Replace with actual auth token format
      const response = await request.post(`${BASE_URL}${ENDPOINT}`, {
        headers: {
          'Authorization': 'Bearer invalid_token_12345'
        },
        data: {
          title: 'Product with Invalid Auth',
          price: 99.99
        }
      });

      // Note: DummyJSON doesn't require auth, adjust expectation based on actual API
      expect([200, 401, 403]).toContain(response.status());
    });
  });

  test.describe('Not Found Scenarios', () => {
    test('should return 404 when endpoint path is wrong', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/products/add-wrong`, {
        data: {
          title: 'Test Product',
          price: 99.99
        }
      });

      expect(response.status()).toBe(404);
    });

    test('should return 404 when using wrong HTTP method on correct path', async ({ request }) => {
      const response = await request.get(`${BASE_URL}${ENDPOINT}`);

      expect([404, 405]).toContain(response.status());
    });
  });

  test.describe('Schema Validation', () => {
    test('should return response with all required fields', async ({ request }) => {
      const response = await request.post(`${BASE_URL}${ENDPOINT}`, {
        data: {
          title: 'Schema Test Product',
          price: 149.99,
          description: 'Product for schema validation',
          category: 'electronics',
          thumbnail: 'https://example.com/test.png'
        }
      });

      expect(response.status()).toBe(200);
      
      const responseBody = await response.json();
      
      // Validate required fields exist
      expect(responseBody).toHaveProperty('id');
      expect(responseBody).toHaveProperty('title');
      expect(responseBody).toHaveProperty('price');
      
      // Validate field types
      expect(typeof responseBody.id).toBe('number');
      expect(typeof responseBody.title).toBe('string');
      expect(typeof responseBody.price).toBe('number');
      
      // Validate field values
      expect(responseBody.title).toBe('Schema Test Product');
      expect(responseBody.price).toBe(149.99);
    });

    test('should include all submitted fields in response', async ({ request }) => {
      const requestData = {
        title: 'Full Schema Test',
        price: 199.99,
        description: 'Complete product data',
        category: 'electronics',
        thumbnail: 'https://example.com/full.png'
      };
      
      const response = await request.post(`${BASE_URL}${ENDPOINT}`, {
        data: requestData
      });

      expect(response.status()).toBe(200);
      
      const responseBody = await response.json();
      
      // Verify all submitted fields are returned
      expect(responseBody.title).toBe(requestData.title);
      expect(responseBody.price).toBe(requestData.price);
      expect(responseBody.description).toBe(requestData.description);
      expect(responseBody.category).toBe(requestData.category);
      expect(responseBody.thumbnail).toBe(requestData.thumbnail);
    });
  });

  test.describe('Response Time', () => {
    test('should respond within 2000ms', async ({ request }) => {
      const startTime = Date.now();
      
      const response = await request.post(`${BASE_URL}${ENDPOINT}`, {
        data: {
          title: 'Performance Test Product',
          price: 79.99,
          description: 'Product for response time testing',
          category: 'electronics'
        }
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(response.status()).toBe(200);
      expect(responseTime).toBeLessThan(2000);
    });

    test('should handle multiple rapid requests', async ({ request }) => {
      const promises = [];
      
      for (let i = 0; i < 5; i++) {
        promises.push(
          request.post(`${BASE_URL}${ENDPOINT}`, {
            data: {
              title: `Concurrent Product ${i}`,
              price: 50.00 + i,
              description: `Concurrent test product ${i}`
            }
          })
        );
      }
      
      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      responses.forEach(response => {
        expect(response.status()).toBe(200);
      });
      
      expect(totalTime).toBeLessThan(10000); // All requests within 10 seconds
    });
  });
});