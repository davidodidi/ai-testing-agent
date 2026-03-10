import { test, expect } from '@playwright/test';

test.describe('POST /products/add', () => {
  const baseUrl = 'https://dummyjson.com';
  const endpoint = '/products/add';
  
  // TODO: Replace with environment-specific base URL
  const getUrl = () => `${baseUrl}${endpoint}`;
  
  const validProduct = {
    title: 'Test Product',
    price: 99.99,
    description: 'A test product',
    category: 'electronics',
    thumbnail: 'https://example.com/img.png'
  };

  test.describe('Happy Path', () => {
    test('should successfully create a product with all valid fields', async ({ request }) => {
      const startTime = Date.now();
      
      const response = await request.post(getUrl(), {
        data: validProduct
      });
      
      const responseTime = Date.now() - startTime;
      const responseBody = await response.json();
      
      expect(response.status()).toBe(200);
      expect(responseTime).toBeLessThan(2000);
      
      // Schema validation
      expect(responseBody).toHaveProperty('id');
      expect(typeof responseBody.id).toBe('number');
      expect(responseBody).toHaveProperty('title');
      expect(typeof responseBody.title).toBe('string');
      expect(responseBody).toHaveProperty('price');
      expect(typeof responseBody.price).toBe('number');
      
      // Value assertions
      expect(responseBody.title).toBe(validProduct.title);
      expect(responseBody.price).toBe(validProduct.price);
      expect(responseBody.id).toBeGreaterThan(0);
    });

    test('should successfully create a product with minimal required fields', async ({ request }) => {
      const minimalProduct = {
        title: 'Minimal Product',
        price: 10.00
      };
      
      const response = await request.post(getUrl(), {
        data: minimalProduct
      });
      
      const responseBody = await response.json();
      
      expect(response.status()).toBe(200);
      expect(responseBody.title).toBe(minimalProduct.title);
      expect(responseBody.price).toBe(minimalProduct.price);
    });
  });

  test.describe('Boundary Value Tests', () => {
    test('should handle empty string for title', async ({ request }) => {
      const response = await request.post(getUrl(), {
        data: {
          ...validProduct,
          title: ''
        }
      });
      
      expect(response.status()).toBe(400);
    });

    test('should handle maximum length title', async ({ request }) => {
      const maxLengthTitle = 'a'.repeat(1000); // TODO: Verify actual max length with API documentation
      
      const response = await request.post(getUrl(), {
        data: {
          ...validProduct,
          title: maxLengthTitle
        }
      });
      
      const responseBody = await response.json();
      
      expect(response.status()).toBe(200);
      expect(responseBody.title).toBe(maxLengthTitle);
    });

    test('should handle zero price', async ({ request }) => {
      const response = await request.post(getUrl(), {
        data: {
          ...validProduct,
          price: 0
        }
      });
      
      const responseBody = await response.json();
      
      expect(response.status()).toBe(200);
      expect(responseBody.price).toBe(0);
    });

    test('should handle negative price', async ({ request }) => {
      const response = await request.post(getUrl(), {
        data: {
          ...validProduct,
          price: -10.50
        }
      });
      
      expect(response.status()).toBe(400);
    });

    test('should handle extremely large price', async ({ request }) => {
      const response = await request.post(getUrl(), {
        data: {
          ...validProduct,
          price: 999999999.99
        }
      });
      
      const responseBody = await response.json();
      
      expect(response.status()).toBe(200);
      expect(responseBody.price).toBe(999999999.99);
    });
  });

  test.describe('Missing Required Fields', () => {
    test('should return 400 when title is missing', async ({ request }) => {
      const { title, ...productWithoutTitle } = validProduct;
      
      const response = await request.post(getUrl(), {
        data: productWithoutTitle
      });
      
      expect(response.status()).toBe(400);
    });

    test('should return 400 when price is missing', async ({ request }) => {
      const { price, ...productWithoutPrice } = validProduct;
      
      const response = await request.post(getUrl(), {
        data: productWithoutPrice
      });
      
      expect(response.status()).toBe(400);
    });

    test('should return 400 when request body is empty', async ({ request }) => {
      const response = await request.post(getUrl(), {
        data: {}
      });
      
      expect(response.status()).toBe(400);
    });
  });

  test.describe('Invalid Data Types', () => {
    test('should return 400 when price is a string', async ({ request }) => {
      const response = await request.post(getUrl(), {
        data: {
          ...validProduct,
          price: 'invalid-price'
        }
      });
      
      expect(response.status()).toBe(400);
    });

    test('should return 400 when title is a number', async ({ request }) => {
      const response = await request.post(getUrl(), {
        data: {
          ...validProduct,
          title: 12345
        }
      });
      
      expect(response.status()).toBe(400);
    });

    test('should return 400 when price is null', async ({ request }) => {
      const response = await request.post(getUrl(), {
        data: {
          ...validProduct,
          price: null
        }
      });
      
      expect(response.status()).toBe(400);
    });

    test('should return 400 when title is null', async ({ request }) => {
      const response = await request.post(getUrl(), {
        data: {
          ...validProduct,
          title: null
        }
      });
      
      expect(response.status()).toBe(400);
    });

    test('should return 400 when price is an array', async ({ request }) => {
      const response = await request.post(getUrl(), {
        data: {
          ...validProduct,
          price: [99.99]
        }
      });
      
      expect(response.status()).toBe(400);
    });
  });

  test.describe('Unauthorized Access', () => {
    test('should return 401 when no authentication token is provided', async ({ request }) => {
      // TODO: Implement when authentication is required
      // const response = await request.post(getUrl(), {
      //   data: validProduct,
      //   headers: {
      //     'Authorization': ''
      //   }
      // });
      
      // expect(response.status()).toBe(401);
    });

    test('should return 403 when user lacks permission to create products', async ({ request }) => {
      // TODO: Implement when role-based access control is in place
      // const response = await request.post(getUrl(), {
      //   data: validProduct,
      //   headers: {
      //     'Authorization': 'Bearer readonly-user-token'
      //   }
      // });
      
      // expect(response.status()).toBe(403);
    });
  });

  test.describe('Not Found Scenarios', () => {
    test('should return 404 when posting to incorrect endpoint', async ({ request }) => {
      const response = await request.post(`${baseUrl}/products/add-invalid`, {
        data: validProduct
      });
      
      expect(response.status()).toBe(404);
    });
  });

  test.describe('Response Time Performance', () => {
    test('should respond within 2000ms for valid request', async ({ request }) => {
      const startTime = Date.now();
      
      await request.post(getUrl(), {
        data: validProduct
      });
      
      const responseTime = Date.now() - startTime;
      
      expect(responseTime).toBeLessThan(2000);
    });
  });

  test.describe('Schema Validation', () => {
    test('should return all required fields in response', async ({ request }) => {
      const response = await request.post(getUrl(), {
        data: validProduct
      });
      
      const responseBody = await response.json();
      
      // Assert required fields presence
      expect(responseBody).toHaveProperty('id');
      expect(responseBody).toHaveProperty('title');
      expect(responseBody).toHaveProperty('price');
      
      // Assert field types
      expect(typeof responseBody.id).toBe('number');
      expect(typeof responseBody.title).toBe('string');
      expect(typeof responseBody.price).toBe('number');
      
      // Assert no undefined values
      expect(responseBody.id).toBeDefined();
      expect(responseBody.title).toBeDefined();
      expect(responseBody.price).toBeDefined();
    });

    test('should include all submitted fields in response', async ({ request }) => {
      const response = await request.post(getUrl(), {
        data: validProduct
      });
      
      const responseBody = await response.json();
      
      expect(responseBody).toMatchObject({
        title: validProduct.title,
        price: validProduct.price
      });
      
      // Optional fields if returned
      if (responseBody.description) {
        expect(responseBody.description).toBe(validProduct.description);
      }
      if (responseBody.category) {
        expect(responseBody.category).toBe(validProduct.category);
      }
      if (responseBody.thumbnail) {
        expect(responseBody.thumbnail).toBe(validProduct.thumbnail);
      }
    });
  });
});