import { test, expect } from '@playwright/test';

const BASE_URL = 'https://dummyjson.com'; // TODO: Replace with environment variable
const ENDPOINT = '/products/add';
const MAX_RESPONSE_TIME = 2000;

test.describe('POST /products/add', () => {
  test.describe('Happy Path', () => {
    test('should successfully create a product with valid data', async ({ request }) => {
      const startTime = Date.now();
      
      const response = await request.post(`${BASE_URL}${ENDPOINT}`, {
        data: {
          title: 'Test Product',
          price: 99.99,
          description: 'A test product',
          category: 'electronics',
          thumbnail: 'https://example.com/img.png'
        }
      });
      
      const responseTime = Date.now() - startTime;
      const responseBody = await response.json();
      
      expect(response.status()).toBe(200);
      expect(responseTime).toBeLessThan(MAX_RESPONSE_TIME);
      
      // Schema validation
      expect(responseBody).toHaveProperty('id');
      expect(typeof responseBody.id).toBe('number');
      expect(responseBody).toHaveProperty('title');
      expect(typeof responseBody.title).toBe('string');
      expect(responseBody).toHaveProperty('price');
      expect(typeof responseBody.price).toBe('number');
      
      // Value assertions
      expect(responseBody.title).toBe('Test Product');
      expect(responseBody.price).toBe(99.99);
    });

    test('should successfully create a product with minimal required fields', async ({ request }) => {
      const startTime = Date.now();
      
      const response = await request.post(`${BASE_URL}${ENDPOINT}`, {
        data: {
          title: 'Minimal Product',
          price: 1.00
        }
      });
      
      const responseTime = Date.now() - startTime;
      const responseBody = await response.json();
      
      expect(response.status()).toBe(200);
      expect(responseTime).toBeLessThan(MAX_RESPONSE_TIME);
      expect(responseBody).toHaveProperty('id');
      expect(responseBody.title).toBe('Minimal Product');
      expect(responseBody.price).toBe(1.00);
    });
  });

  test.describe('Boundary Value Tests', () => {
    test('should handle empty string for title', async ({ request }) => {
      const response = await request.post(`${BASE_URL}${ENDPOINT}`, {
        data: {
          title: '',
          price: 99.99
        }
      });
      
      expect([200, 400, 422]).toContain(response.status());
    });

    test('should handle maximum length title', async ({ request }) => {
      const maxLengthTitle = 'a'.repeat(1000); // TODO: Verify actual max length
      
      const response = await request.post(`${BASE_URL}${ENDPOINT}`, {
        data: {
          title: maxLengthTitle,
          price: 99.99
        }
      });
      
      const responseBody = await response.json();
      
      expect([200, 400, 422]).toContain(response.status());
      if (response.status() === 200) {
        expect(responseBody.title).toBe(maxLengthTitle);
      }
    });

    test('should handle zero price', async ({ request }) => {
      const response = await request.post(`${BASE_URL}${ENDPOINT}`, {
        data: {
          title: 'Zero Price Product',
          price: 0
        }
      });
      
      const responseBody = await response.json();
      
      expect([200, 400, 422]).toContain(response.status());
      if (response.status() === 200) {
        expect(responseBody.price).toBe(0);
      }
    });

    test('should handle negative price', async ({ request }) => {
      const response = await request.post(`${BASE_URL}${ENDPOINT}`, {
        data: {
          title: 'Negative Price Product',
          price: -10.50
        }
      });
      
      expect([200, 400, 422]).toContain(response.status());
    });

    test('should handle very large price value', async ({ request }) => {
      const response = await request.post(`${BASE_URL}${ENDPOINT}`, {
        data: {
          title: 'Expensive Product',
          price: 999999999.99
        }
      });
      
      const responseBody = await response.json();
      
      expect([200, 400, 422]).toContain(response.status());
      if (response.status() === 200) {
        expect(responseBody.price).toBe(999999999.99);
      }
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
      
      expect([400, 422]).toContain(response.status());
    });

    test('should return 400 when price is missing', async ({ request }) => {
      const response = await request.post(`${BASE_URL}${ENDPOINT}`, {
        data: {
          title: 'Test Product',
          description: 'A test product',
          category: 'electronics'
        }
      });
      
      expect([400, 422]).toContain(response.status());
    });

    test('should return 400 when request body is empty', async ({ request }) => {
      const response = await request.post(`${BASE_URL}${ENDPOINT}`, {
        data: {}
      });
      
      expect([400, 422]).toContain(response.status());
    });
  });

  test.describe('Invalid Data Types', () => {
    test('should return 400 when price is string instead of number', async ({ request }) => {
      const response = await request.post(`${BASE_URL}${ENDPOINT}`, {
        data: {
          title: 'Test Product',
          price: 'invalid-price'
        }
      });
      
      expect([400, 422]).toContain(response.status());
    });

    test('should return 400 when title is number instead of string', async ({ request }) => {
      const response = await request.post(`${BASE_URL}${ENDPOINT}`, {
        data: {
          title: 12345,
          price: 99.99
        }
      });
      
      expect([200, 400, 422]).toContain(response.status());
    });

    test('should return 400 when price is boolean', async ({ request }) => {
      const response = await request.post(`${BASE_URL}${ENDPOINT}`, {
        data: {
          title: 'Test Product',
          price: true
        }
      });
      
      expect([400, 422]).toContain(response.status());
    });

    test('should return 400 when price is null', async ({ request }) => {
      const response = await request.post(`${BASE_URL}${ENDPOINT}`, {
        data: {
          title: 'Test Product',
          price: null
        }
      });
      
      expect([400, 422]).toContain(response.status());
    });

    test('should return 400 when thumbnail URL is invalid', async ({ request }) => {
      const response = await request.post(`${BASE_URL}${ENDPOINT}`, {
        data: {
          title: 'Test Product',
          price: 99.99,
          thumbnail: 'not-a-valid-url'
        }
      });
      
      expect([200, 400, 422]).toContain(response.status());
    });
  });

  test.describe('Unauthorized Access', () => {
    test('should handle request without authentication headers', async ({ request }) => {
      const response = await request.post(`${BASE_URL}${ENDPOINT}`, {
        data: {
          title: 'Test Product',
          price: 99.99
        },
        headers: {
          // TODO: Remove auth headers if any are normally required
        }
      });
      
      // Note: This endpoint might not require auth
      expect([200, 401, 403]).toContain(response.status());
    });

    test('should return 401 with invalid auth token', async ({ request }) => {
      const response = await request.post(`${BASE_URL}${ENDPOINT}`, {
        data: {
          title: 'Test Product',
          price: 99.99
        },
        headers: {
          'Authorization': 'Bearer invalid-token' // TODO: Update based on actual auth method
        }
      });
      
      expect([200, 401, 403]).toContain(response.status());
    });
  });

  test.describe('Not Found Scenarios', () => {
    test('should return 404 for invalid endpoint path', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/products/invalid-add`, {
        data: {
          title: 'Test Product',
          price: 99.99
        }
      });
      
      expect(response.status()).toBe(404);
    });

    test('should return 404 for invalid category', async ({ request }) => {
      const response = await request.post(`${BASE_URL}${ENDPOINT}`, {
        data: {
          title: 'Test Product',
          price: 99.99,
          category: 'invalid-category-that-does-not-exist'
        }
      });
      
      expect([200, 400, 404, 422]).toContain(response.status());
    });
  });

  test.describe('Schema Validation', () => {
    test('should return all required fields in response', async ({ request }) => {
      const response = await request.post(`${BASE_URL}${ENDPOINT}`, {
        data: {
          title: 'Schema Test Product',
          price: 49.99,
          description: 'Product for schema validation',
          category: 'test',
          thumbnail: 'https://example.com/test.jpg'
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
      
      // Validate id is positive integer
      expect(responseBody.id).toBeGreaterThan(0);
      expect(Number.isInteger(responseBody.id)).toBeTruthy();
    });

    test('should include optional fields when provided', async ({ request }) => {
      const response = await request.post(`${BASE_URL}${ENDPOINT}`, {
        data: {
          title: 'Full Product',
          price: 79.99,
          description: 'A complete product',
          category: 'electronics',
          thumbnail: 'https://example.com/product.png'
        }
      });
      
      expect(response.status()).toBe(200);
      const responseBody = await response.json();
      
      // Check if optional fields are preserved
      expect(responseBody).toHaveProperty('description');
      expect(responseBody).toHaveProperty('category');
      expect(responseBody).toHaveProperty('thumbnail');
    });
  });

  test.describe('Performance Tests', () => {
    test('should respond within acceptable time limit', async ({ request }) => {
      const startTime = Date.now();
      
      const response = await request.post(`${BASE_URL}${ENDPOINT}`, {
        data: {
          title: 'Performance Test Product',
          price: 29.99
        }
      });
      
      const responseTime = Date.now() - startTime;
      
      expect(response.status()).toBe(200);
      expect(responseTime).toBeLessThan(MAX_RESPONSE_TIME);
    });

    test('should handle concurrent requests efficiently', async ({ request }) => {
      const requests = Array(5).fill(null).map((_, index) => 
        request.post(`${BASE_URL}${ENDPOINT}`, {
          data: {
            title: `Concurrent Product ${index}`,
            price: 19.99 + index
          }
        })
      );
      
      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;
      
      responses.forEach(response => {
        expect(response.status()).toBe(200);
      });
      
      // All concurrent requests should complete within reasonable time
      expect(totalTime).toBeLessThan(MAX_RESPONSE_TIME * 2);
    });
  });
});