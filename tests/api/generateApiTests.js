/**
 * Example: AI-Generated API Tests for dummyjson.com
 *
 * Demonstrates the AITestCaseGenerator creating a full test suite
 * from an endpoint specification, without writing a single test manually.
 *
 * Run: node tests/api/generateApiTests.js
 *
 * Author: David Odidi — QA Automation Engineer | github.com/davidodidi
 */

require("dotenv").config();
const AITestCaseGenerator = require("../../src/generators/AITestCaseGenerator");

(async () => {
  const generator = new AITestCaseGenerator({ outputDir: "./tests/api/generated" });

  // Generate JS tests for POST /products/add
  const { path: jsPath } = await generator.generateApiTests(
    {
      method: "POST",
      path: "/products/add",
      baseUrl: "https://dummyjson.com",
      requestBody: {
        title: "Test Product",
        price: 99.99,
        description: "A test product",
        category: "electronics",
        thumbnail: "https://example.com/img.png",
      },
      responseSchema: {
        id: "number",
        title: "string",
        price: "number",
      },
    },
    "javascript"
  );

  console.log(`✅ JS test file generated: ${jsPath}`);

  // Generate Java RestAssured tests for GET /products/:id
  const { path: javaPath } = await generator.generateApiTests(
    {
      method: "GET",
      path: "/products/{id}",
      baseUrl: "https://dummyjson.com",
      responseSchema: {
        id: "number",
        title: "string",
        price: "number",
        category: "string",
        images: "array",
      },
    },
    "java"
  );

  console.log(`✅ Java test file generated: ${javaPath}`);

  // Generate E2E tests from a user story
  const { path: e2ePath } = await generator.generateE2ETests(
    `As a customer, I want to add products to my cart and checkout
     so that I can purchase items from the store.
     Acceptance Criteria:
     - I can add items to the cart from the product list
     - Cart badge updates immediately
     - Checkout form validates required fields
     - Order confirmation is shown after successful checkout`,
    "https://www.saucedemo.com"
  );

  console.log(`✅ E2E test file generated: ${e2ePath}`);
})();
