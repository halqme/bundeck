import { fileURLToPath } from "url";

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

// CLI utilities
export * from "./cli/utils.js";
export { build } from "./cli/builder.js";
export * from "./cli/index.js";

/**
 * Main API entry point - parse markdown and generate HTML
 */
export async function generateSlides(
  markdown: string,
  options?: {
    theme?: string;
    title?: string;
    outputPath?: string;
  },
): Promise<string> {
  const parser = new (await import("./core/parser.js")).MarkdownParser();
  const presentation = parser.parse(markdown);

  const renderer = new (await import("./template/renderer.js")).HTMLRenderer();

  // Override meta with options
  if (options?.theme) {
    presentation.meta.theme = options.theme;
  }
  if (options?.title) {
    presentation.meta.title = options.title;
  }

  // Load runtime
  const runtimePath = fileURLToPath(new URL("./client/runtime-static.ts", import.meta.url));
  const buildResult = await Bun.build({
    entrypoints: [runtimePath],
    target: "browser",
    minify: true,
  });

  if (!buildResult.success || buildResult.outputs.length === 0) {
    throw new Error("Failed to build runtime: " + JSON.stringify(buildResult.logs));
  }

  const runtimeJs = await buildResult.outputs[0]!.text();

  const result = await renderer.generate(presentation, runtimeJs);
  return typeof result === "string" ? result : result.html;
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
  options?: {
    theme?: string;
    title?: string;
  },
): Promise<string> {
  const renderer = new (await import("./template/renderer.js")).HTMLRenderer();

  // Override meta with options
  if (options?.theme) {
    presentation.meta.theme = options.theme;
  }
  if (options?.title) {
    presentation.meta.title = options.title;
  }

  // Load runtime
  const runtimePath = fileURLToPath(new URL("./client/runtime-static.ts", import.meta.url));
  const buildResult = await Bun.build({
    entrypoints: [runtimePath],
    target: "browser",
    minify: true,
  });

  if (!buildResult.success || buildResult.outputs.length === 0) {
    throw new Error("Failed to build runtime: " + JSON.stringify(buildResult.logs));
  }

  const runtimeJs = await buildResult.outputs[0]!.text();

  const result = await renderer.generate(presentation, runtimeJs);
  return typeof result === "string" ? result : result.html;
}
