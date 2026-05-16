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
   * Minify HTML string by removing unnecessary whitespace and comments.
   * Preserves whitespace and formatting inside <pre> and <script> tags.
   * Note: This is a basic minifier - for advanced minification, consider using html-minifier-terser
   */
  minify(html: string): string {
    // Preserve <pre> inner content (keep outer tags in place for inter-tag whitespace removal)
    const preBlocks: string[] = [];
    const prePlaceholder = "___PRE_BLOCK_";
    const htmlWithPre = html.replace(
      /(<pre\b[^>]*>)([\s\S]*?)(<\/pre>)/gi,
      (_match, openTag: string, content: string, closeTag: string) => {
        const index = preBlocks.push(content) - 1;
        return `${openTag}${prePlaceholder}${index}___${closeTag}`;
      },
    );

    // Preserve <script> inner content with leading/trailing whitespace trimmed
    const scriptBlocks: string[] = [];
    const scriptPlaceholder = "___SCRIPT_BLOCK_";
    const htmlWithScript = htmlWithPre.replace(
      /(<script\b[^>]*>)([\s\S]*?)(<\/script>)/gi,
      (_match, openTag: string, content: string, closeTag: string) => {
        const trimmed = content.trim();
        const index = scriptBlocks.push(trimmed) - 1;
        return `${openTag}${scriptPlaceholder}${index}___${closeTag}`;
      },
    );

    return (
      htmlWithScript
        // Remove HTML comments except for conditional comments
        .replace(/<!--(?!\s*\[if)[\s\S]*?-->/g, "")
        // Remove all whitespace between tags
        .replace(/>\s+</g, "><")
        // Remove leading/trailing whitespace
        .trim()
        // Remove newlines
        .replace(/\n+/g, "")
        // Remove tabs
        .replace(/\t/g, "")
        // Restore original <pre> block contents
        .replace(/___PRE_BLOCK_\d+___/g, (match) => {
          const index = parseInt(match.slice(prePlaceholder.length, -3), 10);
          return preBlocks[index] ?? "";
        })
        // Restore original <script> block contents
        .replace(/___SCRIPT_BLOCK_\d+___/g, (match) => {
          const index = parseInt(match.slice(scriptPlaceholder.length, -3), 10);
          return scriptBlocks[index] ?? "";
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
