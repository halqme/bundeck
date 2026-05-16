import { describe, it, expect, beforeEach } from "bun:test";
import { Marked } from "marked";
import { containerExtension, type ContainerToken } from "../../src/core/extensions/container";

describe("containerExtension", () => {
  let marked: Marked;

  beforeEach(() => {
    marked = new Marked();
    marked.use({ extensions: [containerExtension] });
  });

  it("should parse speaker container", () => {
    const html = marked.parse("::: speaker\nNote content\n:::");
    expect(html).toContain('<div class="speaker">');
    expect(html).toContain("Note content");
  });

  it("should parse custom container", () => {
    const html = marked.parse("::: warning\nWarning message\n:::");
    expect(html).toContain('<div class="warning">');
    expect(html).toContain("Warning message");
  });

  it("should parse class container syntax", () => {
    const tokens = marked.lexer("::: .mark\nMarked paragraph\n:::");
    const token = tokens[0] as ContainerToken;
    expect(token.type).toBe("container");
    expect(token.kind).toBe("mark");

    const html = marked.parse("::: .mark\nMarked paragraph\n:::");
    expect(html).toContain('<div class="mark">');
    expect(html).toContain("Marked paragraph");
  });

  it("should normalize numeric class args in class container syntax", () => {
    const html = marked.parse("::: .opacity 60\nFade\n:::");
    expect(html).toContain('<div class="opacity-60">');
    expect(html).toContain("Fade");
  });
});
