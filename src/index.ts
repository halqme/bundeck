import { applyGenerateOptions, type GenerateHTMLOptions, type GenerateOptions } from "./config.js";
import { ensureOutputDirectory } from "./cli/utils.js";
import { loadRuntimeScript } from "./utils/runtime.js";
import { resolve } from "node:path";

// Core modules
export { MarkdownParser, parseMarkdown } from "./core/parser.js";
export { splitTokensToSlides } from "./core/splitter.js";

// Extensions
export { styledHeadingExtension, type StyledHeadingToken } from "./core/extensions/block.js";

export { styledSpanExtension, type StyledSpanToken } from "./core/extensions/inline.js";

export { containerExtension, type ContainerToken } from "./core/extensions/container.js";

export { styledImageExtension, type StyledImageToken } from "./core/extensions/image.js";

export * from "./core/extensions/index.js";

// Template and generation
export { HTMLRenderer } from "./template/renderer.js";

// Client runtime
// Exporting types if needed
export * from "./client/core/types.js";

// Types
export * from "./types/index.js";
export {
  DEFAULT_PRESENTATION_CONFIG,
  type GenerateHTMLOptions,
  type GenerateOptions,
  type FontSizePreset,
} from "./config.js";
export { VERSION, getVersion } from "./version.js";

// CLI utilities
export * from "./cli/utils.js";
export { build } from "./cli/builder.js";
export * from "./cli/index.js";

/**
 * Main API entry point - parse markdown and generate HTML
 */
export async function generateSlides(
  markdown: string,
  options: GenerateOptions = {},
): Promise<string> {
  const parser = new (await import("./core/parser.js")).MarkdownParser();
  const presentation = parser.parse(markdown);

  const renderer = new (await import("./template/renderer.js")).HTMLRenderer();

  // Override frontmatter values with programmatic options.
  applyGenerateOptions(presentation.meta, options);

  // Load runtime
  const runtimeJs = await loadRuntimeScript("view", { minify: true });

  const result = await renderer.generate(presentation, runtimeJs);
  const html = typeof result === "string" ? result : result.html;

  if (options.outputPath) {
    const outputPath = resolve(process.cwd(), options.outputPath);
    ensureOutputDirectory(outputPath);
    await Bun.write(outputPath, html);
  }

  return html;
}

/**
 * Parse markdown to presentation object
 */
export async function parseSlides(
  markdown: string,
): Promise<import("./types/index.js").Presentation> {
  const parser = new (await import("./core/parser.js")).MarkdownParser();
  return parser.parse(markdown);
}

/**
 * Generate HTML from presentation object
 */
export async function generateHTML(
  presentation: import("./types/index.js").Presentation,
  options: GenerateHTMLOptions = {},
): Promise<string> {
  const renderer = new (await import("./template/renderer.js")).HTMLRenderer();

  // Override frontmatter values with programmatic options.
  applyGenerateOptions(presentation.meta, options);

  // Load runtime
  const runtimeJs = await loadRuntimeScript("view", { minify: true });

  const result = await renderer.generate(presentation, runtimeJs);
  return typeof result === "string" ? result : result.html;
}
