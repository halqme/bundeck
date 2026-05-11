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
   * Note: This is a basic minifier - for advanced minification, consider using html-minifier-terser
   */
  minify(html: string): string {
    // 保護すべきタグ (<pre>, <script>, <style>) をプレースホルダーに置換
    const placeholders: string[] = [];
    const protectedTags = /<(pre|script|style)([\s\S]*?)>([\s\S]*?)<\/\1>/gi;

    const preserved = html.replace(protectedTags, (match, tag, attrs, content) => {
      const tagName = tag.toLowerCase();
      let cleanedContent = content;

      // script/style の場合は中身の前後空白を削る
      if (tagName === "script" || tagName === "style") {
        cleanedContent = content.trim();
      }

      const reconstructed = "<" + tag + attrs + ">" + cleanedContent + "</" + tag + ">";
      placeholders.push(reconstructed);
      return "__BUN_PRESERVE_" + (placeholders.length - 1) + "__";
    });

    // それ以外の部分を最小化
    const minified = preserved
      // コメント削除
      .replace(/<!--(?!\s*\[if)[\s\S]*?-->/g, "")
      // 改行、タブ、キャリッジリターンをスペース1つに置換
      .replace(/[\n\t\r]+/g, " ")
      // 連続する空白を1つに
      .replace(/\s{2,}/g, " ")
      // タグ間の空白を削除
      .replace(/>\s+</g, "><")
      // プレースホルダー周辺の空白を削除
      .replace(/__BUN_PRESERVE_(\d+)__\s+</g, "__BUN_PRESERVE_$1__<")
      .replace(/>\s+__BUN_PRESERVE_(\d+)__/g, ">__BUN_PRESERVE_$1__")
      // プレースホルダー同士が隣接する場合の空白も削除
      .replace(
        /__BUN_PRESERVE_(\d+)__\s+__BUN_PRESERVE_(\d+)__/g,
        "__BUN_PRESERVE_$1____BUN_PRESERVE_$2__",
      )
      .trim();

    // プレースホルダーを元に戻す
    return minified.replace(/__BUN_PRESERVE_(\d+)__/g, (_, index) => {
      return placeholders[parseInt(index, 10)]!;
    });
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
        .replace(/\s*([\{\};:,])\s*/g, "$1")
        // Remove newlines and extra spaces
        .replace(/\n/g, "")
        .replace(/\s+/g, " ")
        .trim()
    );
  }
}
