/**
 * AI-Powered Agentic Testing Orchestrator
 *
 * This agent autonomously:
 *  1. Accepts a natural-language test goal
 *  2. Uses an LLM to decompose the goal into executable test steps
 *  3. Executes each step via Playwright
 *  4. Heals broken selectors with AI if a step fails
 *  5. Generates a structured report at the end
 *
 * Author: David Odidi — QA Automation Engineer | github.com/davidodidi
 */

const Anthropic = require("@anthropic-ai/sdk");
const { chromium } = require("playwright");
const SelfHealingLocator = require("../healers/SelfHealingLocator");
const TestReporter = require("../utils/TestReporter");
const logger = require("../utils/logger");

class TestingAgent {
  constructor(config = {}) {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    this.model = config.model || "claude-opus-4-20250514";
    this.healer = new SelfHealingLocator(this.client);
    this.reporter = new TestReporter();
    this.maxRetries = config.maxRetries || 2;
    this.headless = config.headless ?? true;
  }

  /**
   * Main entry point — accepts a plain-English test goal and executes it.
   * @param {string} goal - e.g. "Log in to SauceDemo and add the first product to cart"
   * @param {string} baseUrl - Target application URL
   */
  async run(goal, baseUrl) {
    logger.info(`🤖 Agent starting: "${goal}"`);
    const browser = await chromium.launch({ headless: this.headless });
    const context = await browser.newContext();
    const page = await context.newPage();

    const session = this.reporter.startSession({ goal, baseUrl });

    try {
      await page.goto(baseUrl);
      const steps = await this._decomposeGoal(goal, baseUrl);
      logger.info(`📋 Plan generated: ${steps.length} steps`);

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        logger.info(`  Step ${i + 1}/${steps.length}: ${step.description}`);
        await this._executeStep(page, step, session);
      }

      session.status = "PASSED";
      logger.info("✅ Agent run completed successfully");
    } catch (err) {
      session.status = "FAILED";
      session.error = err.message;
      logger.error(`❌ Agent run failed: ${err.message}`);
    } finally {
      const screenshot = await page.screenshot({ fullPage: true });
      session.finalScreenshot = screenshot.toString("base64");
      await browser.close();
      this.reporter.endSession(session);
    }

    return session;
  }

  /**
   * Asks the LLM to break the goal into a structured list of browser actions.
   */
  async _decomposeGoal(goal, baseUrl) {
    const systemPrompt = `You are an expert QA engineer. Your job is to decompose a testing goal
into a precise list of browser automation steps for a Playwright script.

Each step must follow this JSON schema:
{
  "description": "Human-readable description",
  "action": "navigate|click|fill|select|assert_text|assert_visible|wait|screenshot",
  "selector": "CSS or text selector (if applicable)",
  "value": "value to fill / text to assert / URL to navigate to (if applicable)",
  "selectorStrategy": "css|text|role|testid"
}

Rules:
- Use role-based selectors (getByRole) when possible — they are most resilient
- Prefer data-testid attributes over CSS class selectors
- For assertions, use assert_text or assert_visible actions
- Include a screenshot step at the end of key flows
- Return ONLY a valid JSON array, no markdown fences`;

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1500,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Application URL: ${baseUrl}\n\nTesting goal: ${goal}`,
        },
      ],
    });

    const raw = response.content[0].text.trim();
    const cleaned = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  }

  /**
   * Executes a single step, with self-healing on failure.
   */
  async _executeStep(page, step, session, attempt = 0) {
    const stepResult = {
      description: step.description,
      action: step.action,
      selector: step.selector,
      status: "RUNNING",
      healingApplied: false,
    };

    try {
      await this._performAction(page, step);
      stepResult.status = "PASSED";
    } catch (err) {
      if (attempt < this.maxRetries && step.selector) {
        logger.warn(`  ⚠️  Step failed (${err.message}). Attempting self-heal…`);
        const healedSelector = await this.healer.heal(page, step);
        if (healedSelector) {
          stepResult.healingApplied = true;
          stepResult.healedSelector = healedSelector;
          logger.info(`  🔧 Healed: "${step.selector}" → "${healedSelector}"`);
          return this._executeStep(
            page,
            { ...step, selector: healedSelector },
            session,
            attempt + 1
          );
        }
      }
      stepResult.status = "FAILED";
      stepResult.error = err.message;
      throw err;
    } finally {
      session.steps.push(stepResult);
    }
  }

  /**
   * Dispatcher — maps action names to Playwright calls.
   */
  async _performAction(page, step) {
    const { action, selector, value, selectorStrategy } = step;
    const locator = selector ? this._buildLocator(page, selector, selectorStrategy) : null;

    switch (action) {
      case "navigate":
        await page.goto(value);
        break;
      case "click":
        await locator.waitFor({ state: "visible", timeout: 10000 });
        await locator.click();
        break;
      case "fill":
        await locator.waitFor({ state: "visible", timeout: 10000 });
        await locator.fill(value);
        break;
      case "select":
        await locator.selectOption(value);
        break;
      case "assert_text":
        await page.waitForFunction(
          ({ sel, txt }) => document.querySelector(sel)?.textContent?.includes(txt),
          { sel: selector, txt: value },
          { timeout: 8000 }
        );
        break;
      case "assert_visible":
        await locator.waitFor({ state: "visible", timeout: 8000 });
        break;
      case "wait":
        await page.waitForTimeout(parseInt(value, 10) || 1000);
        break;
      case "screenshot":
        await page.screenshot({ path: `reports/step_${Date.now()}.png` });
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  _buildLocator(page, selector, strategy) {
    switch (strategy) {
      case "role":
        // e.g. "button:Login"
        const [role, name] = selector.split(":");
        return page.getByRole(role, { name });
      case "text":
        return page.getByText(selector, { exact: false });
      case "testid":
        return page.getByTestId(selector);
      case "css":
      default:
        return page.locator(selector);
    }
  }
}

module.exports = TestingAgent;
