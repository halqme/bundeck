export class HTMLMinifier {
  /**
   * Remove HTML comments using Bun's HTMLRewriter
   * This runs regardless of minify setting since comments are not needed in production
   */
  removeComments(html: string): string {
    const rewriter = new HTMLRewriter()
      .on("*", {
        comments(comment) {
          comment.remove();
        },
      })
      .onDocument({
        comments(comment) {
          comment.remove();
        },
      });

    return rewriter.transform(html);
  }

  /**
   * Minify HTML string by removing unnecessary whitespace and comments
   * Preserves whitespace and formatting inside <pre> tags.
   * Note: This is a basic minifier - for advanced minification, consider using html-minifier-terser
   */
  minify(html: string): string {
    // Preserve <pre> tag contents to avoid destroying formatted whitespace
    const preBlocks: string[] = [];
    const placeholder = "___PRE_BLOCK_";
    const preTagRegex = /<pre\b[^>]*>[\s\S]*?<\/pre>/gi;

    const htmlWithPlaceholders = html.replace(preTagRegex, (match) => {
      const index = preBlocks.push(match) - 1;
      return `${placeholder}${index}___`;
    });

    return (
      htmlWithPlaceholders
        // Remove HTML comments except for conditional comments
        .replace(/<!--(?!\s*\[if)[\s\S]*?-->/g, "")
        // Remove whitespace between tags
        .replace(/>\s{2,}</g, "> <")
        // Remove leading/trailing whitespace
        .trim()
        // Remove newlines
        .replace(/\n+/g, "")
        // Remove tabs
        .replace(/\t/g, "")
        // Restore original <pre> block contents
        .replace(/___PRE_BLOCK_\d+___/g, (match) => {
          const index = parseInt(match.slice(placeholder.length, -3), 10);
          return preBlocks[index] || "";
        })
    );
  }

  /**
   * Minify CSS by removing comments and unnecessary whitespace
   */
  minifyCSS(css: string): string {
    return (
      css
        // Remove CSS comments
        .replace(/\/\*[\s\S]*?\*\//g, "")
        // Remove whitespace around braces, semicolons, colons, and commas
        .replace(/\s*([{};:,])\s*/g, "$1")
        // Remove newlines and extra spaces
        .replace(/\n/g, "")
        .replace(/\s+/g, " ")
        .trim()
    );
  }
}
