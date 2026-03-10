/**
 * TestReporter
 *
 * Builds structured test session reports and writes them to:
 *  - JSON (for CI/CD consumption)
 *  - HTML (for human review)
 *
 * Author: David Odidi — QA Automation Engineer | github.com/davidodidi
 */

const fs = require("fs");
const path = require("path");

class TestReporter {
  constructor(outputDir = "./reports") {
    this.outputDir = outputDir;
    fs.mkdirSync(outputDir, { recursive: true });
  }

  startSession({ goal, baseUrl }) {
    return {
      id: `session_${Date.now()}`,
      goal,
      baseUrl,
      startTime: new Date().toISOString(),
      endTime: null,
      status: "RUNNING",
      steps: [],
      error: null,
      finalScreenshot: null,
    };
  }

  endSession(session) {
    session.endTime = new Date().toISOString();
    const durationMs =
      new Date(session.endTime) - new Date(session.startTime);
    session.durationMs = durationMs;

    const passedSteps = session.steps.filter((s) => s.status === "PASSED").length;
    const failedSteps = session.steps.filter((s) => s.status === "FAILED").length;
    const healedSteps = session.steps.filter((s) => s.healingApplied).length;

    session.summary = {
      total: session.steps.length,
      passed: passedSteps,
      failed: failedSteps,
      healed: healedSteps,
      passRate: session.steps.length
        ? Math.round((passedSteps / session.steps.length) * 100)
        : 0,
    };

    this._writeJson(session);
    this._writeHtml(session);
    return session;
  }

  _writeJson(session) {
    const filePath = path.join(this.outputDir, `${session.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(session, null, 2));
  }

  _writeHtml(session) {
    const statusColor = session.status === "PASSED" ? "#22c55e" : "#ef4444";
    const stepRows = session.steps
      .map((s) => {
        const color = s.status === "PASSED" ? "#22c55e" : "#ef4444";
        const healed = s.healingApplied
          ? `<span style="color:#f59e0b">🔧 Healed: ${s.healedSelector}</span>`
          : "";
        return `<tr>
          <td style="padding:8px;border:1px solid #e2e8f0">${s.description}</td>
          <td style="padding:8px;border:1px solid #e2e8f0">${s.action}</td>
          <td style="padding:8px;border:1px solid #e2e8f0;color:${color};font-weight:bold">${s.status}</td>
          <td style="padding:8px;border:1px solid #e2e8f0;font-size:12px">${s.error || ""}${healed}</td>
        </tr>`;
      })
      .join("");

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>AI Agent Test Report — ${session.id}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 960px; margin: 40px auto; color: #1e293b; }
    h1 { color: #0f172a; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 999px; color: white; font-weight: bold; }
    .metric { display: inline-block; margin: 0 16px; text-align: center; }
    .metric .value { font-size: 2rem; font-weight: 800; }
    .metric .label { font-size: 0.8rem; color: #64748b; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; }
    th { background: #1e293b; color: white; padding: 10px 8px; text-align: left; }
  </style>
</head>
<body>
  <h1>🤖 AI Agentic Test Report</h1>
  <p><strong>Goal:</strong> ${session.goal}</p>
  <p><strong>URL:</strong> ${session.baseUrl}</p>
  <p><strong>Status:</strong> <span class="badge" style="background:${statusColor}">${session.status}</span></p>
  <p><strong>Duration:</strong> ${(session.durationMs / 1000).toFixed(1)}s</p>

  <div style="margin: 24px 0;">
    <div class="metric"><div class="value" style="color:#22c55e">${session.summary?.passed ?? 0}</div><div class="label">Passed</div></div>
    <div class="metric"><div class="value" style="color:#ef4444">${session.summary?.failed ?? 0}</div><div class="label">Failed</div></div>
    <div class="metric"><div class="value" style="color:#f59e0b">${session.summary?.healed ?? 0}</div><div class="label">Self-Healed</div></div>
    <div class="metric"><div class="value">${session.summary?.passRate ?? 0}%</div><div class="label">Pass Rate</div></div>
  </div>

  <table>
    <tr><th>Step</th><th>Action</th><th>Status</th><th>Notes</th></tr>
    ${stepRows}
  </table>

  ${session.finalScreenshot
    ? `<h2>Final Screenshot</h2><img src="data:image/png;base64,${session.finalScreenshot}" style="max-width:100%;border:1px solid #e2e8f0;border-radius:8px"/>`
    : ""}
</body>
</html>`;

    const filePath = path.join(this.outputDir, `${session.id}.html`);
    fs.writeFileSync(filePath, html);
  }
}

module.exports = TestReporter;
