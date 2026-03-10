# 🤖 AI Agentic Testing Framework

> **Next-generation test automation powered by Claude AI** — autonomous agent execution, self-healing locators, LLM-generated test cases, and AI visual assertions.

[![CI Status](https://github.com/davidodidi/ai-testing-agent/actions/workflows/ai-tests.yml/badge.svg)](https://github.com/davidodidi/ai-testing-agent/actions)
[![Node](https://img.shields.io/badge/node-%3E%3D18-green)](https://nodejs.org)
[![Playwright](https://img.shields.io/badge/playwright-1.58.2-blueviolet)](https://playwright.dev)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

---

## 🎯 What Makes This Different

Traditional test automation is **brittle**: selectors break, tests become stale, coverage gaps grow. This framework applies **large language model reasoning** at every layer of the testing stack.

| Capability | Traditional | This Framework |
|---|---|---|
| Test authoring | Manual | LLM generates from user stories |
| Broken selectors | Build fails | AI heals selectors automatically |
| Visual assertions | Pixel diff | Claude understands intent |
| Test execution | Script-driven | Agent plans and adapts |
| Maintenance cost | High | Minimal |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    AI Testing Agent                      │
│                                                         │
│  ┌────────────┐   ┌──────────────┐   ┌───────────────┐ │
│  │  Goal      │──▶│  Claude LLM  │──▶│  Step Planner │ │
│  │  (natural  │   │  (Decompose) │   │  (JSON Plan)  │ │
│  │  language) │   └──────────────┘   └──────┬────────┘ │
│  └────────────┘                             │           │
│                                             ▼           │
│  ┌────────────────────────────────────────────────────┐ │
│  │              Playwright Executor                   │ │
│  │   navigate → click → fill → assert → screenshot   │ │
│  └────────────────────────┬───────────────────────────┘ │
│                           │ FAIL?                        │
│                           ▼                             │
│  ┌─────────────────────────────────────────────────┐   │
│  │           Self-Healing Locator                  │   │
│  │  DOM Snapshot → Claude → Healed Selector → Retry│   │
│  └─────────────────────────────────────────────────┘   │
│                           │                             │
│                           ▼                             │
│  ┌─────────────────────────────────────────────────┐   │
│  │     AI Visual Assertion + HTML/JSON Report      │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com)

### Installation

```bash
git clone https://github.com/davidodidi/ai-testing-agent.git
cd ai-testing-agent
npm install
npx playwright install --with-deps chromium firefox
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env
```

### Run the Agent

```bash
# Agentic E2E test (agent figures out the steps)
npm run test:agent

# Generate API tests from endpoint specs
npm run test:generate

# Full demo (both)
npm run demo
```

---

## 🧠 Core Modules

### 1. `TestingAgent` — Agentic Browser Executor

```javascript
const agent = new TestingAgent({ headless: true, maxRetries: 2 });

const session = await agent.run(
  "Log in and add the first product to the cart, verify cart shows 1 item",
  "https://www.saucedemo.com"
);

console.log(session.status);         // "PASSED"
console.log(session.summary.healed); // Number of self-healed steps
```

The agent:
1. Sends your goal to Claude
2. Gets back a structured JSON plan of browser actions
3. Executes each step with Playwright
4. Self-heals any broken selectors
5. Produces a rich HTML report

---

### 2. `SelfHealingLocator` — AI Selector Recovery

When a selector breaks (e.g. after a UI refactor), instead of failing:

```
Step failed: "#loginBtn" not found in DOM
  → Extracting DOM snapshot (80 interactive elements)
  → Asking Claude for replacement selector...
  → Healed: "#loginBtn" → [data-testid="login-button"]
  → Step retried: PASSED ✅
```

The healer:
- Extracts a compact DOM snapshot of interactive elements
- Sends the failed selector + context to Claude
- Receives a semantically equivalent replacement
- Caches results (avoids repeat API calls)

---

### 3. `AITestCaseGenerator` — Test Creation from Specs

Generate a full test suite from an endpoint specification:

```javascript
const generator = new AITestCaseGenerator();

await generator.generateApiTests({
  method: "POST",
  path: "/api/register",
  baseUrl: "https://reqres.in",
  requestBody: { email: "eve.holt@reqres.in", password: "pistol" },
  responseSchema: { id: "number", token: "string" }
}, "javascript");
```

Generated tests include:
- ✅ Happy path (200 OK, valid response schema)
- ❌ Missing fields (400 Bad Request)
- ❌ Invalid data (400 with error message)
- 🔍 Schema validation (required fields, correct types)
- ⏱️ Response time assertions (< 2000ms)

---

### 4. `AIVisualAssertion` — Intent-Based Visual Testing

No pixel baselines to maintain. Describe what you expect:

```javascript
const checker = new AIVisualAssertion();

const result = await checker.assertPageLooksCorrect(
  page,
  "The checkout confirmation page should show an order number, items purchased, and a 'Back Home' button"
);

// { passed: true, confidence: 96, issues: [], explanation: "Order summary visible with..." }
```

Claude analyzes the screenshot and tells you whether the page matches your intent — not just whether pixels changed.

---

## 🧪 Test Suites

### AI-Generated API Tests — `tests/api/generated/`

Targets [reqres.in](https://reqres.in) — a real validating REST API.

| Suite | Tests | Status |
|---|---|---|
| Happy Path | 1 | ✅ |
| Missing Required Fields | 3 | ✅ |
| Invalid Data | 2 | ✅ |
| Schema Validation | 2 | ✅ |
| Response Time | 2 | ✅ |

### E2E Tests — `tests/e2e/`

Targets [SauceDemo](https://www.saucedemo.com) — a full e-commerce demo app.

| Suite | Tests | Status |
|---|---|---|
| Authentication | 5 | ✅ |
| Product Listing | 4 | ✅ |
| Cart | 4 | ✅ |
| Checkout Flow | 5 | ✅ |
| Logout | 1 | ✅ |

All tests run cross-browser: **Chromium** and **Firefox**.

---

## 📊 Sample Report Output

```
Session: session_1741532891234
Goal: Log in and add product to cart
Status: ✅ PASSED
Duration: 8.3s

Steps: 6/6 passed
Self-healed: 1 step
  🔧 "#add-to-cart-sauce-labs-backpack" → [data-testid="add-to-cart-sauce-labs-backpack"]
```

Reports are saved as:
- `reports/<session_id>.html` — Visual HTML report with screenshots
- `reports/<session_id>.json` — Machine-readable for CI/CD

---

## 🔄 CI/CD Integration

The GitHub Actions workflow (`.github/workflows/ai-tests.yml`) runs:

1. **Agentic E2E tests** on every push
2. **AI-generated API + E2E tests** after agent tests (Chromium + Firefox)
3. **Nightly regression** via cron schedule
4. **Artifacts** (reports, screenshots) retained 30 days

Required secret: `ANTHROPIC_API_KEY`

---

## 🗂️ Project Structure

```
ai-testing-agent/
├── src/
│   ├── agents/
│   │   ├── TestingAgent.js          # Main agentic orchestrator
│   │   └── AIVisualAssertion.js     # Vision-based assertions
│   ├── healers/
│   │   └── SelfHealingLocator.js    # AI selector recovery
│   ├── generators/
│   │   └── AITestCaseGenerator.js   # LLM test generation
│   └── utils/
│       ├── TestReporter.js          # HTML + JSON reports
│       └── logger.js
├── tests/
│   ├── web/agentTest.js             # Agentic E2E runner
│   ├── api/generateApiTests.js      # API generation runner
│   ├── api/generated/               # AI-generated API test specs
│   └── e2e/
│       └── saucedemo.e2e.spec.js    # SauceDemo E2E suite (19 tests)
├── .github/workflows/ai-tests.yml
├── playwright.config.js
└── package.json
```

---

## 🛡️ Design Principles

- **Root cause first** — Agent logs exactly what Claude decided and why
- **Explicit waits only** — No `Thread.sleep` or arbitrary delays
- **Modular** — Each capability is independently usable
- **Fail loudly** — Errors surface with full context, not generic timeouts
- **Cache expensive calls** — Healed selectors are cached to minimize API usage

---

## 📈 Metrics

| Metric | Value |
|---|---|
| Selector healing success rate | ~85% in testing |
| Test generation coverage | 8–12 tests per endpoint |
| Average agent run time | 8–15 seconds |
| CI pipeline duration | < 4 minutes |

---

## 🔮 Roadmap

- [ ] Multi-agent coordination (parallel exploration agents)
- [ ] Appium integration for mobile agentic tests
- [ ] Jira ticket → test case auto-generation
- [ ] Slack/Teams notifications with AI-written summaries
- [ ] Historical healing analytics dashboard

---

## 👨‍💻 Author

**David Odidi** — QA Automation Engineer | Java • Selenium • Playwright • Cypress • RestAssured • Python • CI/CD (GitHub Actions and Jenkins) | [github.com/davidodidi](https://github.com/davidodidi)
