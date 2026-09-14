import { describe, expect, it } from "bun:test";
import { parseMarkdown } from "../../src/core/parser";
import { HTMLRenderer } from "../../src/template/renderer";

async function render(markdown: string): Promise<string> {
  const presentation = parseMarkdown(markdown);
  const result = await new HTMLRenderer().generate(presentation, "");
  return typeof result === "string" ? result : result.html;
}

describe("HTML escaping", () => {
  it("escapes the document title", async () => {
    const html = await render(`---
title: "</title><script>alert(1)</script>"
---
# Slide`);

    expect(html).toContain("<title>&lt;/title&gt;&lt;script&gt;alert(1)&lt;/script&gt;</title>");
    expect(html).not.toContain("<title></title><script>");
  });

  it("escapes standard image URLs, alt text, and titles", async () => {
    const html = await render(
      '![An "image"](https://example.com/image.png?a=1&b=2 "Image \\"title\\"")',
    );

    expect(html).toContain(
      '<img src="https://example.com/image.png?a=1&amp;b=2" alt="An &quot;image&quot;" title="Image &quot;title&quot;">',
    );
  });

  it("rejects executable URL schemes for standard images", async () => {
    const html = await render("![unsafe](javascript:alert(1))");

    expect(html).toContain('<img src="" alt="unsafe">');
  });

  it("escapes styled image attributes and rejects executable URLs", async () => {
    const presentation = {
      meta: {},
      slides: [
        {
          id: 1,
          contentTokens: [
            {
              type: "paragraph",
              raw: "",
              text: "",
              tokens: [
                {
                  type: "styledImage",
                  raw: "",
                  href: 'java\nscript:alert(1)" onerror="alert(2)',
                  text: 'Alt" onerror="alert(3)',
                  attrs: ".fit",
                },
              ],
            },
          ],
          noteTokens: [],
        },
      ],
    } as any;
    const result = await new HTMLRenderer().generate(presentation, "");
    const html = typeof result === "string" ? result : result.html;

    expect(html).toContain('<img class="fit" src="" alt="Alt&quot; onerror=&quot;alert(3)">');
    expect(html).not.toContain('onerror="alert(3)"');
  });
});
