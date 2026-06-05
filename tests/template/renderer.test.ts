import { describe, it, expect, beforeEach } from "bun:test";
import { HTMLRenderer } from "../../src/template/renderer";
import type { Presentation } from "../../src/types";

describe("HTMLRenderer", () => {
  let renderer: HTMLRenderer;

  const mockPresentation: Presentation = {
    meta: {
      title: "Test Presentation",
      theme: "default",
      fontSize: "M",
    },
    slides: [
      {
        id: 1,
        contentTokens: [],
        noteTokens: [],
        contentLength: 100,
      },
      {
        id: 2,
        contentTokens: [],
        noteTokens: [],
        contentLength: 200,
      },
    ],
  };

  const mockRuntime = "console.log('runtime');";

  beforeEach(() => {
    renderer = new HTMLRenderer();
  });

  describe("constructor", () => {
    it("should create instance", () => {
      expect(renderer).toBeDefined();
    });

    it("should accept options", () => {
      const r = new HTMLRenderer({ enableMinify: true, inlineAssets: false });
      expect(r).toBeDefined();
    });
  });

  describe("generate", () => {
    it("should generate inline HTML by default", async () => {
      const result = await renderer.generate(mockPresentation, mockRuntime);
      expect(typeof result).toBe("string");
      const html = result as string;
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("<title>Test Presentation</title>");
      expect(html).toContain("<style>"); // Inline styles
      expect(html).toContain(mockRuntime);
      expect(html).toContain('id="slide-1"');
      expect(html).toContain('id="slide-2"');
    });

    it("should generate external assets when inlineAssets is false", async () => {
      const r = new HTMLRenderer({ inlineAssets: false });
      const result = await r.generate(mockPresentation, mockRuntime);

      expect(typeof result).toBe("object");
      expect(result).toHaveProperty("html");
      expect(result).toHaveProperty("assets");

      const { html, assets } = result as { html: string; assets: any };

      expect(html).toContain('<link rel="stylesheet" href="/assets/styles.css">');
      expect(assets).toHaveProperty("mainCss");
      expect(assets).toHaveProperty("themeCss");
      expect(assets).toHaveProperty("printCss");
    });

    it("should respect font size option", async () => {
      const p: Presentation = {
        ...mockPresentation,
        meta: { ...mockPresentation.meta, fontSize: "L" },
      };
      const result = await renderer.generate(p, mockRuntime);
      expect(result).toContain('class="font-size-l"');
    });

    it("should escape frontmatter title in the document head", async () => {
      const p: Presentation = {
        ...mockPresentation,
        meta: {
          ...mockPresentation.meta,
          title: "</title><script>alert(1)</script>&",
        },
      };

      const result = (await renderer.generate(p, mockRuntime)) as string;

      expect(result).toContain(
        "<title>&lt;/title&gt;&lt;script&gt;alert(1)&lt;/script&gt;&amp;</title>",
      );
      expect(result).not.toContain("<title></title><script>alert(1)</script>&</title>");
    });

    it("should ignore invalid font size values instead of emitting unsafe body attributes", async () => {
      const p: Presentation = {
        ...mockPresentation,
        meta: {
          ...mockPresentation.meta,
          fontSize: 'M" onmouseover="alert(1)' as Presentation["meta"]["fontSize"],
        },
      };

      const result = (await renderer.generate(p, mockRuntime)) as string;

      expect(result).not.toContain('onmouseover="alert(1)');
      expect(result).not.toContain('font-size-m"');
      expect(result).toContain("</head><body>");
    });

    it("should minify HTML if enableMinify is true", async () => {
      const r = new HTMLRenderer({ enableMinify: true });
      const result = await r.generate(mockPresentation, mockRuntime);
      // Basic check for minification (no newlines in typical places)
      // This depends on minifier implementation but generally checking for reduced whitespace
      const lines = (result as string).split("\n");
      expect(lines.length).toBeLessThan(10); // Should be very few lines if minified
    });
  });
});
