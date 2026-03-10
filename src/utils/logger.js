const logger = {
  info: (msg) => console.log(`[${new Date().toISOString()}] INFO  ${msg}`),
  warn: (msg) => console.log(`[${new Date().toISOString()}] WARN  ${msg}`),
  error: (msg) => console.error(`[${new Date().toISOString()}] ERROR ${msg}`),
};
module.exports = logger;
