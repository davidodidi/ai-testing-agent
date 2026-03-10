/**
 * SelfHealingLocator
 *
 * When a Playwright step fails due to a broken selector, this module:
 *  1. Extracts a snapshot of the page's interactive DOM
 *  2. Sends the failed selector + DOM to Claude
 *  3. Receives a healed replacement selector
 *  4. Caches healed selectors to avoid repeated API calls
 *
 * Author: David Odidi — QA Automation Engineer | github.com/davidodidi
 */

const logger = require("../utils/logger");

class SelfHealingLocator {
  constructor(anthropicClient) {
    this.client = anthropicClient;
    /** Cache: originalSelector → healedSelector */
    this._cache = new Map();
  }

  /**
   * Attempts to find a working replacement for a broken selector.
   * @param {import('playwright').Page} page
   * @param {object} step - The failed step (description, selector, action)
   * @returns {string|null} - A healed selector, or null if healing failed
   */
  async heal(page, step) {
    const cacheKey = `${step.selector}::${step.action}`;
    if (this._cache.has(cacheKey)) {
      logger.info(`  💾 Returning cached healed selector`);
      return this._cache.get(cacheKey);
    }

    try {
      const domSnapshot = await this._extractInteractiveDom(page);
      const healed = await this._askClaudeForHealing(step, domSnapshot);

      if (healed) {
        this._cache.set(cacheKey, healed);
      }
      return healed;
    } catch (err) {
      logger.error(`  Healing failed: ${err.message}`);
      return null;
    }
  }

  /**
   * Extracts a compact, LLM-friendly snapshot of interactive elements.
   */
  async _extractInteractiveDom(page) {
    return page.evaluate(() => {
      const selectors = [
        "button", "a", "input", "select", "textarea",
        "[role='button']", "[role='link']", "[data-testid]",
        "[id]", "[class]",
      ];

      const elements = document.querySelectorAll(selectors.join(","));
      const snapshot = [];

      elements.forEach((el) => {
        const entry = {
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          classes: Array.from(el.classList).slice(0, 5),
          text: (el.textContent || "").trim().slice(0, 80),
          placeholder: el.getAttribute("placeholder"),
          type: el.getAttribute("type"),
          role: el.getAttribute("role"),
          testid: el.getAttribute("data-testid"),
          name: el.getAttribute("name"),
          href: el.tagName === "A" ? el.getAttribute("href") : null,
          ariaLabel: el.getAttribute("aria-label"),
        };

        // Only include elements with at least some identifying info
        if (entry.text || entry.id || entry.testid || entry.ariaLabel || entry.placeholder) {
          snapshot.push(entry);
        }
      });

      return snapshot.slice(0, 80); // Cap at 80 elements to stay within token limits
    });
  }

  /**
   * Sends broken selector + DOM to Claude and asks for a replacement.
   */
  async _askClaudeForHealing(step, domSnapshot) {
    const prompt = `You are an expert Playwright test engineer specializing in resilient selectors.

A test step has failed because the following selector no longer exists in the DOM:
- Failed selector: "${step.selector}"
- Step description: "${step.description}"
- Action: "${step.action}"

Below is a JSON snapshot of interactive elements currently present in the DOM:
${JSON.stringify(domSnapshot, null, 2)}

Your task:
1. Identify the element that BEST matches the intent of the failed step
2. Return a single replacement selector (CSS, text content, or data-testid)
3. Prefer: data-testid > aria-label > text content > id > css class chain

Return ONLY the replacement selector string (no explanation, no quotes, no markdown).
If you cannot confidently identify a match, return the word: UNKNOWN`;

    const response = await this.client.messages.create({
      model: "claude-opus-4-20250514",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    });

    const result = response.content[0].text.trim();
    if (result === "UNKNOWN" || !result) return null;
    return result;
  }

  /**
   * Returns healing statistics for reporting.
   */
  getHealingStats() {
    return {
      totalHealings: this._cache.size,
      healedSelectors: Object.fromEntries(this._cache),
    };
  }
}

module.exports = SelfHealingLocator;
