import { describe, it, expect, afterEach } from "bun:test";
import { build } from "../../src/cli/builder";
import { join, resolve } from "node:path";
import { rm } from "node:fs/promises";
import { existsSync } from "node:fs";

const TEMP_DIR = ".temp_test_cli";
const INPUT_FILE = join(TEMP_DIR, "test.md");
const OUTPUT_FILE = join(TEMP_DIR, "test.html");

describe("CLI Builder", () => {
  // Setup temp directory and file
  const setup = async () => {
    await Bun.write(INPUT_FILE, "# Test Slide\n\nContent");
  };

  afterEach(async () => {
    if (existsSync(TEMP_DIR)) {
      await rm(TEMP_DIR, { recursive: true, force: true });
    }
  });

  it("should build HTML from markdown", async () => {
    await setup();

    // Run build
    const outputPath = await build(INPUT_FILE, {
      minify: false,
      outputPath: OUTPUT_FILE,
      autoOpen: false,
      help: false,
    });

    expect(outputPath).toBe(resolve(process.cwd(), OUTPUT_FILE));
    expect(existsSync(OUTPUT_FILE)).toBe(true);

    const content = await Bun.file(OUTPUT_FILE).text();
    expect(content).toContain("<!DOCTYPE html>");
    expect(content).toContain("Test Slide");
  });

  it("should respect minify option", async () => {
    await setup();
    await build(INPUT_FILE, {
      minify: true,
      outputPath: OUTPUT_FILE,
      autoOpen: false,
      help: false,
    });

    const content = await Bun.file(OUTPUT_FILE).text();
    expect(content.split("<script>")[0]).not.toContain("\n\n"); // Basic check for minification
  });
});
