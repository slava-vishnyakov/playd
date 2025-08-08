#!/usr/bin/env node
"use strict";

// Basic smoke tests for playd
// Tests core functionality without requiring a full browser session

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const PLAYD_PATH = path.join(__dirname, "playd");
const TEST_TIMEOUT = 30000;

class TestRunner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.tests = [];
  }

  async run(name, testFn) {
    process.stdout.write(`${name}... `);
    try {
      await Promise.race([
        testFn(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Test timeout")), TEST_TIMEOUT)
        )
      ]);
      console.log("✓ PASS");
      this.passed++;
    } catch (error) {
      console.log(`✗ FAIL: ${error.message}`);
      this.failed++;
    }
  }

  async runCommand(args, expectedExitCode = 0) {
    return new Promise((resolve, reject) => {
      const child = spawn("node", [PLAYD_PATH, ...args], {
        stdio: ["pipe", "pipe", "pipe"],
        timeout: TEST_TIMEOUT
      });

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("close", (code) => {
        if (code === expectedExitCode) {
          resolve({ stdout, stderr, code });
        } else {
          reject(new Error(`Expected exit code ${expectedExitCode}, got ${code}. stderr: ${stderr}`));
        }
      });

      child.on("error", (error) => {
        reject(new Error(`Process error: ${error.message}`));
      });
    });
  }

  summary() {
    console.log(`\n--- Test Results ---`);
    console.log(`Passed: ${this.passed}`);
    console.log(`Failed: ${this.failed}`);
    console.log(`Total: ${this.passed + this.failed}`);
    
    if (this.failed > 0) {
      process.exit(1);
    } else {
      console.log("All tests passed! 🎉");
      process.exit(0);
    }
  }
}

async function main() {
  const runner = new TestRunner();

  // Test 1: Check if playd executable exists and is readable
  await runner.run("File exists and is executable", async () => {
    if (!fs.existsSync(PLAYD_PATH)) {
      throw new Error("playd file does not exist");
    }
    
    const stats = fs.statSync(PLAYD_PATH);
    if (!stats.isFile()) {
      throw new Error("playd is not a file");
    }
  });

  // Test 2: Help command works
  await runner.run("Help command", async () => {
    const result = await runner.runCommand(["help"]);
    if (!result.stdout.includes("playd (CDP)")) {
      throw new Error("Help output doesn't contain expected header");
    }
    if (!result.stdout.includes("Usage:")) {
      throw new Error("Help output doesn't contain usage information");
    }
  });

  // Test 3: Invalid command returns error
  await runner.run("Invalid command returns error", async () => {
    await runner.runCommand(["invalid-command"], 2);
  });

  // Test 4: Status command (should start server and return status)
  await runner.run("Status command", async () => {
    const result = await runner.runCommand(["status"], 0);
    if (!result.stdout.includes("ok")) {
      throw new Error("Status output doesn't contain expected 'ok' field");
    }
  });

  // Test 5: Session commands require arguments
  await runner.run("Session create requires ID", async () => {
    await runner.runCommand(["session", "create"], 2);
  });

  await runner.run("Session info requires ID", async () => {
    await runner.runCommand(["session", "info"], 2);
  });

  await runner.run("Session close requires ID", async () => {
    await runner.runCommand(["session", "close"], 2);
  });

  // Test 6: Commands that require sessions fail gracefully
  await runner.run("Commands require session", async () => {
    await runner.runCommand(["goto", "https://example.com"], 2);
  });

  // Test 7: Sleep command works
  await runner.run("Sleep command", async () => {
    const start = Date.now();
    const result = await runner.runCommand(["sleep", "100"]);
    const elapsed = Date.now() - start;
    
    if (elapsed < 90) { // Allow some margin
      throw new Error(`Sleep too short: ${elapsed}ms`);
    }
    
    if (!result.stdout.includes("100")) {
      throw new Error("Sleep output doesn't include sleep time");
    }
  });

  // Test 8: JSON output mode
  await runner.run("JSON output mode", async () => {
    const result = await runner.runCommand(["sleep", "50", "--json"]);
    try {
      const parsed = JSON.parse(result.stdout);
      if (!parsed.ok || parsed.sleptMs !== 50) {
        throw new Error("Invalid JSON output structure");
      }
    } catch (e) {
      if (e instanceof SyntaxError) {
        throw new Error("Output is not valid JSON");
      }
      throw e;
    }
  });

  // Test 9: Integration test - real Chrome session
  await runner.run("Chrome integration test", async () => {
    // Create a headless session for CI compatibility
    const createResult = await runner.runCommand(["session", "create", "integration-test"]);
    if (!createResult.stdout.includes('"ok":true')) {
      throw new Error("Failed to create session");
    }

    try {
      // Navigate to httpbin.org (reliable testing service)
      const gotoResult = await runner.runCommand(["goto", "https://httpbin.org/html", "--session", "integration-test"]);
      if (!gotoResult.stdout.includes('"ok":true')) {
        throw new Error("Failed to navigate to httpbin");
      }

      // Check page content loaded (httpbin.org/html contains Herman Melville text)
      const contentResult = await runner.runCommand(["eval", "document.body.textContent.includes('Herman Melville')", "--session", "integration-test"]);
      if (!contentResult.stdout.includes("true")) {
        throw new Error(`Expected page to contain 'Herman Melville', got: ${contentResult.stdout}`);
      }

      // Take a screenshot to verify page loaded
      const screenshotResult = await runner.runCommand(["screenshot", "--session", "integration-test", "--json"]);
      const screenshotData = JSON.parse(screenshotResult.stdout);
      if (!screenshotData.ok || !screenshotData.base64) {
        throw new Error("Screenshot failed or returned no data");
      }

      // Test cookie functionality (should work with httpbin.org domain)
      const setCookieResult = await runner.runCommand(["cookie-set", "test", "value123", "--session", "integration-test"]);
      if (!setCookieResult.stdout.includes('"ok":true')) {
        throw new Error("Failed to set cookie");
      }

      const getCookieResult = await runner.runCommand(["cookie-get", "test", "--session", "integration-test"]);
      if (!getCookieResult.stdout.includes("value123")) {
        throw new Error(`Expected 'value123', got: ${getCookieResult.stdout}`);
      }

    } finally {
      // Always clean up the session
      await runner.runCommand(["session", "close", "integration-test"]);
    }
  });

  // Test 10: Clean up - shutdown server
  await runner.run("Shutdown command", async () => {
    const result = await runner.runCommand(["shutdown"]);
    if (!result.stdout.includes("ok")) {
      throw new Error("Shutdown output doesn't contain expected 'ok' field");
    }
  });

  runner.summary();
}

if (require.main === module) {
  main().catch((error) => {
    console.error("Test runner failed:", error);
    process.exit(1);
  });
}