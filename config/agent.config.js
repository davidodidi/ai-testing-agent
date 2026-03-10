/**
 * Agent configuration — override via environment variables or pass directly to constructors.
 */
module.exports = {
  agent: {
    model: process.env.CLAUDE_MODEL || "claude-opus-4-20250514",
    maxRetries: parseInt(process.env.MAX_RETRIES || "2", 10),
    headless: process.env.HEADLESS !== "false",
  },
  healing: {
    domSnapshotLimit: 80,
    cacheEnabled: true,
  },
  generator: {
    outputDir: "./generated-tests",
    defaultLanguage: "javascript",
  },
  reporter: {
    outputDir: "./reports",
  },
};
