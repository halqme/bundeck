import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { build } from "../../src/cli/builder";
import { join } from "node:path";
import { rm, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";

const FIXTURES_DIR = join(import.meta.dir, "fixtures");
const OUTPUT_DIR = join(import.meta.dir, "output");
const INPUT_FILE = join(FIXTURES_DIR, "complex.md");
const OUTPUT_FILE = join(OUTPUT_DIR, "complex.html");

describe("Integration: Markdown to HTML Generation", () => {
  beforeAll(async () => {
    if (existsSync(OUTPUT_DIR)) {
      await rm(OUTPUT_DIR, { recursive: true, force: true });
    }
    await mkdir(OUTPUT_DIR, { recursive: true });
  });

  afterAll(async () => {
    // Cleanup
    if (existsSync(OUTPUT_DIR)) {
      await rm(OUTPUT_DIR, { recursive: true, force: true });
    }
  });

  it("should generate a complete HTML file with all features applied", async () => {
    // Execute build
    await build(INPUT_FILE, {
      minify: false,
      outputPath: OUTPUT_FILE,
      autoOpen: false,
      help: false,
    });

    expect(existsSync(OUTPUT_FILE)).toBe(true);

    const html = await Bun.file(OUTPUT_FILE).text();

    // 1. Basic Structure Check
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<title>Integration Test Slide</title>");
    expect(html).toContain('<div class="slide-viewport">');

    // 2. Metadata & Configuration
    // Font size preset M maps to font-size-m class on body or container?
    // Checking implementation: bodyClass = config.fontSize ? ` class="${config.fontSize}"` : "";
    // Config extraction adds 'font-size-' prefix. So 'M' -> 'font-size-m'.
    expect(html).toContain('class="font-size-m"');

    // 2.1. Aspect Ratio Configuration
    // 4:3 aspect ratio should be reflected in CSS variables
    expect(html).toContain("--slide-width: 960px");
    expect(html).toContain("--slide-height: 720px");

    // 3. Slide Content & Splitting
    // Should have 3 slides based on fixtures/complex.md
    // Slide 1
    expect(html).toContain('<section class="slide active" id="slide-1"');
    expect(html).toContain("<h1>Slide 1</h1>");

    // Slide 2
    expect(html).toContain('<section class="slide" id="slide-2"');
    expect(html).toContain("<ul>");
    expect(html).toContain("<li>List item 1</li>");

    // Slide 3
    expect(html).toContain('<section class="slide" id="slide-3"');

    // 4. Extensions (Class utils, etc)
    // Image with class (styledImageExtension puts class first)
    expect(html).toContain('<img class="shadow-lg" src="image.png" alt="Test Image">');

    // 5. Speaker Notes
    // Note for slide 2
    expect(html).toContain('<div class="speaker-notes" hidden>');
    expect(html).toContain("Speaker notes for slide 2");

    // 6. Assets Embedding (Inline by default)
    expect(html).toContain("<style>");
    // Basic CSS check (from base.css or theme)
    expect(html).toContain(":root");
    expect(html).toContain("body");

    // Runtime Script Embedding
    expect(html).toContain("<script>");
    // Check for some runtime code logic (minified or not)
    // We expect some runtime logic to be present.
    expect(html).toContain("window.location.hash"); // Common slide navigation logic

    // 7. Removed: snapshot testing — too brittle with minified JS runtime embedded
  });
});
