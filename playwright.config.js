const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./test",
  testMatch: "**/*.spec.js",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:4175",
    viewport: { width: 1536, height: 1024 },
    timezoneId: "America/Los_Angeles",
  },
  webServer: {
    command: "python3 -m http.server 4175",
    port: 4175,
    reuseExistingServer: true,
  },
});
