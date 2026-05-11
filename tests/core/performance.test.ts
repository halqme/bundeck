import { describe, it, expect } from "bun:test";
import { parseMarkdown } from "../../src/core/parser";
import { HTMLRenderer } from "../../src/template/renderer";

/**
 * 大きなMarkdownファイルを生成するヘルパー関数
 */
function generateLargeMarkdown(slideCount: number, contentPerSlide: number): string {
  let markdown = "";
  const loremIpsum = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(
    Math.ceil(contentPerSlide / 60),
  );

  for (let i = 0; i < slideCount; i++) {
    markdown += `# Slide ${i + 1}\n\n`;
    markdown += `${loremIpsum.slice(0, contentPerSlide)}\n\n`;
    markdown += "- List item 1\n- List item 2\n- List item 3\n\n";
    markdown += "![Image](image.png)\n\n";

    if (i < slideCount - 1) {
      markdown += "---\n\n";
    }
  }

  return markdown;
}

/**
 * 5000文字以上のMarkdownを生成
 */
function generateLargeContentMarkdown(): string {
  // 5000文字以上になるまで繰り返す
  const base = `
---
title: Large Content Test
---

# テスト: 大量のテキストを含むスライト

## セクション1
${"これはテストのためのダミーテキストです。".repeat(50)}

## セクション2
${"another paragraph ".repeat(30)}

### サブセクション
- アイテム1 ${"詳細テキスト ".repeat(20)}
- アイテム2 ${"詳細テキスト ".repeat(20)}
- アイテム3 ${"詳細テキスト ".repeat(20)}
`;

  // 5000文字以上になるまで内容を繰り返す
  let content = base;
  while (content.length < 5000) {
    content += "\n" + base;
  }
  return content.trim();
}

describe("Performance Tests", () => {
  describe("Large File Handling", () => {
    it("should parse a 5000+ character markdown file within reasonable time", () => {
      const largeMarkdown = generateLargeContentMarkdown();
      expect(largeMarkdown.length).toBeGreaterThan(5000);

      const startTime = Date.now();
      const result = parseMarkdown(largeMarkdown);
      const parseTime = Date.now() - startTime;

      // パースは1秒以内に完了すべき
      expect(parseTime).toBeLessThan(1000);
      expect(result.slides.length).toBeGreaterThan(0);
    });

    it("should parse 10 slides with 1000+ characters each", () => {
      const slideCount = 10;
      const contentPerSlide = 1500;
      const largeMarkdown = generateLargeMarkdown(slideCount, contentPerSlide);

      expect(largeMarkdown.length).toBeGreaterThan(15000);

      const startTime = Date.now();
      const result = parseMarkdown(largeMarkdown);
      const parseTime = Date.now() - startTime;

      expect(parseTime).toBeLessThan(1000);
      expect(result.slides.length).toBe(slideCount);
    });

    it("should parse 50 slides quickly", () => {
      const markdown = generateLargeMarkdown(50, 500);

      const startTime = Date.now();
      const result = parseMarkdown(markdown);
      const parseTime = Date.now() - startTime;

      // 50スライトも1秒以内にパースすべき
      expect(parseTime).toBeLessThan(1000);
      expect(result.slides.length).toBe(50);
    });
  });

  describe("HTML Generation Performance", () => {
    it("should generate HTML for 20 slides within reasonable time", async () => {
      const markdown = generateLargeMarkdown(20, 800);
      const parsed = parseMarkdown(markdown);

      // クライアントランタイムのモック（簡易版）
      const mockRuntimeJs = "/* mock runtime */";

      const startTime = Date.now();
      const renderer = new HTMLRenderer({ enableMinify: false, inlineAssets: true });
      const result = await renderer.generate(parsed, mockRuntimeJs);
      const renderTime = Date.now() - startTime;

      // HTML生成は3秒以内に完了すべき
      expect(renderTime).toBeLessThan(3000);

      const html = typeof result === "string" ? result : result.html;
      expect(html).toContain("<!DOCTYPE html>");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty markdown gracefully", () => {
      const result = parseMarkdown("");
      // 空のMarkdownは0スライト（splitTokensToSlidesの動作）
      expect(result.slides.length).toBe(0);
    });

    it("should handle markdown with frontmatter and content", () => {
      const markdown = `---
title: Test
---

# Hello World
`;
      const result = parseMarkdown(markdown);
      expect(result.meta.title).toBe("Test");
      expect(result.slides.length).toBe(1);
    });

    it("should handle markdown with only frontmatter", () => {
      const markdown = `---
title: Test
---
`;
      const result = parseMarkdown(markdown);
      // frontmatterのみの場合、スライドは0または1（実装依存）
      expect(result.meta.title).toBe("Test");
    });

    it("should handle special characters in markdown", () => {
      const markdown = `# Test with <script>alert("xss")</script>

[link](javascript:alert(1))

\`\`\`
inline code with special chars: < > &
\`\`\`
`;
      const result = parseMarkdown(markdown);
      expect(result.slides.length).toBeGreaterThan(0);
    });

    it("should handle extremely long lines", () => {
      const longLine = "a".repeat(10000);
      const markdown = `# Test\n\n${longLine}`;
      const result = parseMarkdown(markdown);
      expect(result.slides.length).toBe(1);
    });

    it("should handle deep nesting in columns", () => {
      const nestedMarkdown = `
::: columns
:::: col
::: columns
::::: col
Content
:::::
:::
::::
:::
`;
      const result = parseMarkdown(nestedMarkdown);
      expect(result.slides.length).toBe(1);
    });
  });
});
