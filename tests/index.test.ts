import { describe, expect, it } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { generateHTML, generateSlides, getVersion, parseSlides, VERSION } from "../src/index";

describe("Public API", () => {
  it("exposes the package version programmatically", async () => {
    const packageJson = await Bun.file(join(import.meta.dir, "../package.json")).json();

    expect(VERSION).toBe(packageJson.version);
    expect(getVersion()).toBe(packageJson.version);
  });

  it("parses markdown through parseSlides", async () => {
    const presentation = await parseSlides("# Public API");

    expect(presentation.slides).toHaveLength(1);
    expect(presentation.slides[0]?.contentTokens[0]?.type).toBe("heading");
  });

  it("generates a complete document through generateSlides", async () => {
    const html = await generateSlides("# Public API");

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<h1>Public API</h1>");
    expect(html).toContain("window.location.hash");
  });

  it("applies programmatic presentation options", async () => {
    const presentation = await parseSlides("# Public API");
    const html = await generateHTML(presentation, {
      title: "Configured Presentation",
      theme: "dark",
      mode: "dark",
      aspectRatio: "4:3",
      fontSize: "XL",
      lang: "ja",
    });

    expect(presentation.meta).toMatchObject({
      title: "Configured Presentation",
      theme: "dark",
      mode: "dark",
      aspectRatio: "4:3",
      fontSize: "XL",
      lang: "ja",
    });
    expect(html).toContain('<html lang="ja">');
    expect(html).toContain("<title>Configured Presentation</title>");
    expect(html).toContain("--slide-width: 960px");
    expect(html.lastIndexOf("--slide-width: 960px")).toBeGreaterThan(
      html.indexOf("--slide-width: var(--theme-slide-width"),
    );
    expect(html).toContain('class="font-size-xl"');
  });

  it("writes generated HTML when outputPath is provided", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "bundeck-api-"));
    const outputPath = join(tempDir, "slides.html");

    try {
      const html = await generateSlides("# Public API", { outputPath });

      expect(await Bun.file(outputPath).text()).toBe(html);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("generates a complete document through generateHTML", async () => {
    const presentation = await parseSlides("# Public API");
    const html = await generateHTML(presentation);

    expect(html).toContain("<h1>Public API</h1>");
  });
});
