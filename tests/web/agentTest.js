/**
 * Example: Agentic E2E Test — SauceDemo Login + Add to Cart
 *
 * This test uses the TestingAgent to:
 * 1. Accept a plain-English goal
 * 2. Have Claude decompose it into browser steps
 * 3. Execute those steps with self-healing on failure
 * 4. Assert the final state with AI visual assertion
 *
 * Run: node tests/web/agentTest.js
 *
 * Author: David Odidi — QA Automation Engineer | github.com/davidodidi
 */

require("dotenv").config();
const TestingAgent = require("../../src/agents/TestingAgent");
const AIVisualAssertion = require("../../src/agents/AIVisualAssertion");

(async () => {
  const agent = new TestingAgent({ headless: true, maxRetries: 2 });
  const visualChecker = new AIVisualAssertion();

  const BASE_URL = "https://www.saucedemo.com";

  // --- Test 1: Login + Add to Cart ---
  const session1 = await agent.run(
    "Log in with username 'standard_user' and password 'secret_sauce', then add the first product to the cart and verify the cart badge shows 1",
    BASE_URL
  );
  console.log("\n=== TEST 1 RESULT ===");
  console.log(`Status: ${session1.status}`);
  console.log(`Steps: ${session1.summary.passed}/${session1.summary.total} passed`);
  console.log(`Self-healed steps: ${session1.summary.healed}`);
  console.log(`Report: reports/${session1.id}.html`);

  // --- Test 2: Full Checkout Flow ---
  const session2 = await agent.run(
    "Log in as 'standard_user' / 'secret_sauce', add two items to the cart, proceed to checkout, fill in shipping details with First Name: John, Last Name: Doe, Zip: M5V 1A1, and complete the purchase",
    BASE_URL
  );
  console.log("\n=== TEST 2 RESULT ===");
  console.log(`Status: ${session2.status}`);
  console.log(`Steps: ${session2.summary.passed}/${session2.summary.total} passed`);
  console.log(`Report: reports/${session2.id}.html`);
})();
