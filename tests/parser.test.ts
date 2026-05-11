import { describe, it, expect } from "bun:test";
import { parseMarkdown } from "../src/core/parser";

describe("MarkdownParser", () => {
  it("should parse Japanese paragraphs correctly without splitting characters", () => {
    const markdown = "全ての機能を詰め込んだデモ・スライドです。";
    const result = parseMarkdown(markdown);

    // Check the first slide's content
    const slide = result.slides[0]!;
    const htmlToken = slide.contentTokens[0] as any;

    expect(htmlToken.type).toBe("paragraph");
    expect(htmlToken.text).toBe("全ての機能を詰め込んだデモ・スライドです。");
    // Ensure tokens are not split into characters (which was the bug)
    // The bug caused "全\nて\n..." in raw/text
    expect(htmlToken.raw).not.toContain("全\nて");
  });

  it("should parse class container syntax correctly", () => {
    const markdown = "::: .my-class\nStyled text\n:::";
    const result = parseMarkdown(markdown);

    const slide = result.slides[0]!;
    const token = slide.contentTokens[0] as any;

    expect(token.type).toBe("container");
    expect(token.kind).toBe("my-class");
  });

  it("should no longer parse block-level {.class} paragraph syntax as styled block", () => {
    const markdown = "Styled text {.my-class}";
    const result = parseMarkdown(markdown);

    const slide = result.slides[0]!;
    const token = slide.contentTokens[0] as any;

    expect(token.type).toBe("paragraph");
    expect(token.text).toBe("Styled text {.my-class}");
  });

  it("should handle mixed content with class container correctly", () => {
    const markdown = `
# Title

Normal paragraph.

::: .red
Styled paragraph
:::
    `.trim();

    const result = parseMarkdown(markdown);
    // Filter out space tokens
    const tokens = result.slides[0]!.contentTokens.filter((t: any) => t.type !== "space");

    expect(tokens[0]!.type).toBe("heading");
    expect(tokens[1]!.type).toBe("paragraph");
    expect(tokens[2]!.type).toBe("container");
  });
});
