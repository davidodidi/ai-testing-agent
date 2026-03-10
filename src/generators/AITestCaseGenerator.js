/**
 * AITestCaseGenerator
 *
 * Generates comprehensive test cases for any REST API endpoint
 * using Claude as the reasoning engine.
 *
 * Features:
 * - Positive path tests
 * - Negative/boundary tests
 * - Security tests (SQLi, XSS probes)
 * - Schema validation tests
 * - Performance threshold assertions
 *
 * Output: JavaScript test files (Playwright API) or Java (RestAssured)
 *
 * Author: David Odidi — QA Automation Engineer | github.com/davidodidi
 */

const Anthropic = require("@anthropic-ai/sdk");
const fs = require("fs");
const path = require("path");
const logger = require("../utils/logger");

class AITestCaseGenerator {
  constructor(config = {}) {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    this.model = config.model || "claude-opus-4-20250514";
    this.outputDir = config.outputDir || "./generated-tests";
  }

  /**
   * Generate a full suite of test cases for an API endpoint.
   * @param {object} endpointSpec
   * @param {string} endpointSpec.method - HTTP method
   * @param {string} endpointSpec.path - Endpoint path
   * @param {string} endpointSpec.baseUrl - Base URL
   * @param {object} endpointSpec.requestBody - Example request body (optional)
   * @param {object} endpointSpec.responseSchema - Expected response shape (optional)
   * @param {string} language - 'javascript' or 'java'
   */
  async generateApiTests(endpointSpec, language = "javascript") {
    logger.info(`🧠 Generating ${language} tests for ${endpointSpec.method} ${endpointSpec.path}`);

    const systemPrompt = `You are a senior QA automation engineer who writes production-quality API tests using Playwright's APIRequestContext.

Generate a comprehensive test suite for the given API endpoint.

CRITICAL RULES:
- Use ONLY the baseUrl and path provided — do not substitute a different API
- For status code assertions on happy path, use the ACTUAL correct HTTP status (201 for resource creation, 200 for reads)
- For negative tests (missing fields, invalid types), assert the ACTUAL status the API returns — do NOT assume 400/422 if the API is a mock. Instead assert that the response is NOT 2xx using: expect(response.ok()).toBe(false) OR check that an error field exists in the response body
- Never hardcode expected status codes for negative tests — use flexible assertions
- All tests must be self-contained with no imports other than @playwright/test
- Return ONLY valid JavaScript/TypeScript code with no markdown fences, no explanations

Include these test categories:
1. Happy path (valid inputs, assert correct 2xx status and response schema)
2. Boundary value tests (empty strings, max-length, zero, negative numbers)
3. Missing required fields
4. Invalid data types
5. Schema validation (assert all required fields present in response)
6. Response time assertion (must be < 2000ms)

Format: Use import { test, expect } from '@playwright/test';`;

    const response = await this.client.messages.create({
      model: this.model,
       max_tokens: 12000,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Generate tests for:\n${JSON.stringify(endpointSpec, null, 2)}`,
        },
      ],
    });

    const code = response.content[0].text
      .replace(/```(?:typescript|javascript|java|js|ts)?\n?/g, "")
      .replace(/```/g, "")
      .trim();

    const ext = language === "java" ? ".java" : ".spec.js";
    const filename = `${endpointSpec.method.toLowerCase()}_${endpointSpec.path.replace(/\//g, "_")}${ext}`;
    const outPath = path.join(this.outputDir, filename);

    fs.mkdirSync(this.outputDir, { recursive: true });
    fs.writeFileSync(outPath, code);
    logger.info(`✅ Test file written: ${outPath}`);

    return { code, path: outPath };
  }

  /**
   * Generate end-to-end UI test cases from a user story.
   * @param {string} userStory - Agile user story text
   * @param {string} appUrl - Target URL
   */
  async generateE2ETests(userStory, appUrl) {
    logger.info(`🧠 Generating E2E tests from user story`);

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 2500,
      system: `You are an expert QA automation engineer. Convert user stories into Playwright E2E tests.
Include:
- Positive scenario (happy path)
- Alternative flows (e.g. invalid input)
- Edge cases
- Accessibility check (tab navigation, ARIA roles)
Do NOT use page objects or import any external files. Write all test logic inline in a single self-contained file with no imports other than @playwright/test.
Return ONLY valid JavaScript code.`,
      messages: [
        {
          role: "user",
          content: `App URL: ${appUrl}\n\nUser Story:\n${userStory}`,
        },
      ],
    });

    const code = response.content[0].text
      .replace(/```(?:javascript|js)?\n?/g, "")
      .replace(/```$/g, "")
      .trim();

    const outPath = path.join(this.outputDir, `e2e_generated_${Date.now()}.spec.js`);
    fs.writeFileSync(outPath, code);
    logger.info(`✅ E2E test written: ${outPath}`);

    return { code, path: outPath };
  }

  /**
   * Analyze an existing test file and suggest improvements.
   * @param {string} testFilePath
   */
  async reviewAndImprove(testFilePath) {
    const code = fs.readFileSync(testFilePath, "utf8");

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 2000,
      system: `You are a QA code reviewer. Analyze test files for:
1. Flaky test patterns (hardcoded waits, order dependencies)
2. Missing assertions
3. Poor selector choices
4. Missing negative test cases
5. DRY violations
Provide a JSON report with: { issues: [{severity, location, description, suggestion}], score: 0-100 }
Return ONLY valid JSON.`,
      messages: [{ role: "user", content: code }],
    });

    const raw = response.content[0].text.replace(/```json|```/g, "").trim();
    return JSON.parse(raw);
  }
}

module.exports = AITestCaseGenerator;
