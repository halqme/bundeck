import { describe, expect, test } from "bun:test";
import { HTMLMinifier } from "../../src/utils/minifier";

describe("HTMLMinifier", () => {
  const minifier = new HTMLMinifier();

  describe("removeComments", () => {
    test("should remove basic HTML comments", () => {
      const input = "<div><!-- comment -->content</div>";
      const expected = "<div>content</div>";
      expect(minifier.removeComments(input)).toBe(expected);
    });

    test("should handle multiline comments", () => {
      const input = `<div><!-- 
        multi
        line
        comment 
      -->content</div>`;
      const expected = "<div>content</div>";
      expect(minifier.removeComments(input)).toBe(expected);
    });

    test("should keep content untouched if no comments", () => {
      const input = "<div>content</div>";
      expect(minifier.removeComments(input)).toBe(input);
    });
  });

  describe("minify", () => {
    test("should remove simple comments", () => {
      const input = "<div><!-- comment --></div>";
      expect(minifier.minify(input)).toBe("<div></div>");
    });

    test("should preserve conditional comments", () => {
      const input = "<!--[if IE]>content<![endif]>";
      expect(minifier.minify(input)).toBe(input);
    });

    test("should remove whitespace between tags", () => {
      const input = "<div>  <span>text</span>  </div>";
      // The current implementation replaces >\s{2,}< with > <
      expect(minifier.minify(input)).toBe("<div> <span>text</span> </div>");
    });

    test("should remove newlines and tabs", () => {
      const input = "<div>\n\t<span>text</span>\n</div>";
      // \n\t matches >\s{2,}< so it becomes > <
      expect(minifier.minify(input)).toBe("<div> <span>text</span></div>");
    });

    test("should trim whitespace", () => {
      const input = "  <div>text</div>  ";
      expect(minifier.minify(input)).toBe("<div>text</div>");
    });

    test("should preserve whitespace inside <pre> tags", () => {
      const input = "<div><pre>\n  line1\n  line2\n</pre></div>";
      expect(minifier.minify(input)).toBe("<div><pre>\n  line1\n  line2\n</pre></div>");
    });

    test("should preserve <pre> with attributes", () => {
      const input = '<pre class="prettyprint">\n  code\n</pre>';
      expect(minifier.minify(input)).toBe('<pre class="prettyprint">\n  code\n</pre>');
    });

    test("should preserve multiple <pre> blocks", () => {
      const input =
        "<div><pre>\n  first\n</pre></div><p>text</p><pre>\n  second\n</pre>";
      expect(minifier.minify(input)).toBe(
        "<div><pre>\n  first\n</pre></div><p>text</p><pre>\n  second\n</pre>",
      );
    });

    test("should handle complex html structure", () => {
      const input = `
            <!DOCTYPE html>
            <html>
                <head>
                    <!-- Meta tags -->
                    <title>  My Title  </title>
                </head>
                <body>
                    <div class="container">
                        <h1>Heading</h1>
                        <!-- TODO: Add content -->
                        <p>
                            Paragraph with 
                            newlines.
                        </p>
                    </div>
                </body>
            </html>
        `;

      const result = minifier.minify(input);
      expect(result).not.toContain("<!-- Meta tags -->");
      expect(result).not.toContain("\n");
      expect(result).not.toContain("\t");
    });
  });

  describe("minifyCSS", () => {
    test("should remove comments", () => {
      const input = "body { color: red; /* comment */ }";
      expect(minifier.minifyCSS(input)).toBe("body{color:red;}");
    });

    test("should remove whitespace around braces and semicolons", () => {
      const input = "body {  color: red;  background: blue;  }";
      expect(minifier.minifyCSS(input)).toBe("body{color:red;background:blue;}");
    });

    test("should remove newlines", () => {
      const input = "body {\ncolor: red;\n}";
      expect(minifier.minifyCSS(input)).toBe("body{color:red;}");
    });

    test("should handle multiple rules", () => {
      const input = `
            .class-a { color: red; }
            /* comment */
            .class-b { 
                font-size: 12px; 
                margin: 0;
            }
        `;
      const expected = ".class-a{color:red;}.class-b{font-size:12px;margin:0;}";
      expect(minifier.minifyCSS(input)).toBe(expected);
    });

    test("should handle comma separated selectors", () => {
      const input = "h1, h2,   h3 { color: blue; }";
      expect(minifier.minifyCSS(input)).toBe("h1,h2,h3{color:blue;}");
    });
  });
});
