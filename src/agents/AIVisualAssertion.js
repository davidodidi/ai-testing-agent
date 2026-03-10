/**
 * AIVisualAssertion
 *
 * Uses Claude's vision capabilities to assert UI correctness without brittle
 * pixel-comparison snapshots. Instead of "pixel-diff", it asks Claude:
 * "Does this page look correct given the user story?"
 *
 * Benefits over traditional visual testing:
 * - No baseline images to maintain
 * - Understands intent, not just pixels
 * - Works across resolutions & themes
 * - Can detect UX regressions (bad layout, missing CTA, broken forms)
 *
 * Author: David Odidi — QA Automation Engineer | github.com/davidodidi
 */

const Anthropic = require("@anthropic-ai/sdk");
const logger = require("../utils/logger");

class AIVisualAssertion {
  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  /**
   * Assert a page looks correct given a natural-language expectation.
   * @param {import('playwright').Page} page
   * @param {string} expectation - e.g. "The checkout page should show an order summary with items and total"
   * @param {object} options
   * @returns {{ passed: boolean, confidence: number, issues: string[], explanation: string }}
   */
  async assertPageLooksCorrect(page, expectation, options = {}) {
    const screenshot = await page.screenshot({
      fullPage: options.fullPage ?? false,
      type: "jpeg",
      quality: 80,
    });

    const base64 = screenshot.toString("base64");
    logger.info(`🖼️  Running AI visual assertion: "${expectation}"`);

    const response = await this.client.messages.create({
      model: "claude-opus-4-20250514",
      max_tokens: 800,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: base64,
              },
            },
            {
              type: "text",
              text: `You are a QA engineer performing visual assertions on a web page screenshot.

Expectation: "${expectation}"

Analyze the screenshot and respond with ONLY a JSON object:
{
  "passed": true/false,
  "confidence": 0-100,
  "issues": ["issue 1", "issue 2"],
  "explanation": "Brief explanation of what you see and why it passed or failed"
}

Be strict. If key expected elements are missing, mark as failed.`,
            },
          ],
        },
      ],
    });

    const raw = response.content[0].text.replace(/```json|```/g, "").trim();
    const result = JSON.parse(raw);

    if (result.passed) {
      logger.info(`  ✅ Visual assertion PASSED (confidence: ${result.confidence}%)`);
    } else {
      logger.warn(`  ❌ Visual assertion FAILED: ${result.issues.join("; ")}`);
    }

    return result;
  }

  /**
   * Compare two screenshots semantically (not pixel-diff).
   * @param {Buffer} beforeScreenshot
   * @param {Buffer} afterScreenshot
   * @param {string} changeDescription - What change was expected
   */
  async compareScreenshots(beforeScreenshot, afterScreenshot, changeDescription) {
    const toBase64 = (buf) => buf.toString("base64");

    const response = await this.client.messages.create({
      model: "claude-opus-4-20250514",
      max_tokens: 800,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: "image/jpeg", data: toBase64(beforeScreenshot) } },
            { type: "image", source: { type: "base64", media_type: "image/jpeg", data: toBase64(afterScreenshot) } },
            {
              type: "text",
              text: `Compare these two screenshots (before and after a UI change).

Expected change: "${changeDescription}"

Return ONLY JSON:
{
  "changeDetected": true/false,
  "expectedChangePresent": true/false,
  "unexpectedChanges": ["list of unintended changes"],
  "summary": "brief description"
}`,
            },
          ],
        },
      ],
    });

    const raw = response.content[0].text.replace(/```json|```/g, "").trim();
    return JSON.parse(raw);
  }
}

module.exports = AIVisualAssertion;
