import { describe, expect, test, beforeEach } from "bun:test";
import { HTMLMinifier } from "../../src/utils/minifier";

describe("HTMLMinifier", () => {
  let minifier: HTMLMinifier;

  beforeEach(() => {
    minifier = new HTMLMinifier();
  });

  describe("removeComments", () => {
    test("should remove basic HTML comments", () => {
      const input = "<div><!-- comment --><span>text</span></div>";
      expect(minifier.removeComments(input)).toBe("<div><span>text</span></div>");
    });

    test("should handle multiline comments", () => {
      const input = "<div><!--\n  multiline\n  comment\n--><span>text</span></div>";
      expect(minifier.removeComments(input)).toBe("<div><span>text</span></div>");
    });

    test("should keep content untouched if no comments", () => {
      const input = "<div><span>text</span></div>";
      expect(minifier.removeComments(input)).toBe(input);
    });
  });

  describe("minify", () => {
    test("should remove simple comments", () => {
      const input = "<div><!-- comment --><span>text</span></div>";
      expect(minifier.minify(input)).toBe("<div><span>text</span></div>");
    });

    test("should preserve conditional comments", () => {
      const input = "<!--[if IE]><div>IE</div><![endif]-->";
      expect(minifier.minify(input)).toBe("<!--[if IE]><div>IE</div><![endif]-->");
    });

    test("should remove whitespace between tags", () => {
      const input = "<div>  <span>text</span>  </div>";
      expect(minifier.minify(input)).toBe("<div><span>text</span></div>");
    });

    test("should remove newlines and tabs", () => {
      const input = "<div>\n\t<span>text</span>\n</div>";
      expect(minifier.minify(input)).toBe("<div><span>text</span></div>");
    });

    test("should preserve content in <pre> tags", () => {
      const input = "<div><pre>\n  indent\n  multi\n  line\n</pre></div>";
      expect(minifier.minify(input)).toBe("<div><pre>\n  indent\n  multi\n  line\n</pre></div>");
    });

    test("should preserve content in <script> tags but trim ends", () => {
      const input =
        "<div><script>\n  const x = 1;\n  if (x > 0) {\n    console.log(x);\n  }\n</script></div>";
      expect(minifier.minify(input)).toBe(
        "<div><script>const x = 1;\n  if (x > 0) {\n    console.log(x);\n  }</script></div>",
      );
    });

    test("should trim whitespace", () => {
      const input = "   <div>text</div>   ";
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
      const input = "<div><pre>\n  first\n</pre></div><p>text</p><pre>\n  second\n</pre>";
      expect(minifier.minify(input)).toBe(
        "<div><pre>\n  first\n</pre></div><p>text</p><pre>\n  second\n</pre>",
      );
    });

    test("should handle complex html structure", () => {
      const input =
        '\n        <div class="container">\n          <!-- header -->\n          <header>\n            <h1>Title</h1>\n          </header>\n          <main>\n            <p>Some text with <span>inline</span> element.</p>\n            <pre>\n              code block\n            </pre>\n          </main>\n        </div>\n      ';
      const expected =
        '<div class="container"><header><h1>Title</h1></header><main><p>Some text with <span>inline</span> element.</p><pre>\n              code block\n            </pre></main></div>';
      expect(minifier.minify(input)).toBe(expected);
    });
  });

  describe("minifyCSS", () => {
    test("should remove comments", () => {
      const input = "/* comment */ body { color: red; }";
      expect(minifier.minifyCSS(input)).toBe("body{color:red;}");
    });

    test("should remove whitespace around braces and semicolons", () => {
      const input = "body { margin : 0 ; padding : 10px }";
      expect(minifier.minifyCSS(input)).toBe("body{margin:0;padding:10px}");
    });

    test("should remove newlines", () => {
      const input = "body {\n  color: red;\n}";
      expect(minifier.minifyCSS(input)).toBe("body{color:red;}");
    });

    test("should handle multiple rules", () => {
      const input = "h1 { color: blue; } p { font-size: 16px; }";
      expect(minifier.minifyCSS(input)).toBe("h1{color:blue;}p{font-size:16px;}");
    });

    test("should handle comma separated selectors", () => {
      const input = "h1 , h2 { margin: 0 }";
      expect(minifier.minifyCSS(input)).toBe("h1,h2{margin:0}");
    });
  });
});
