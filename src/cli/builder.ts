import { parseMarkdown } from "../core/parser.js";
import { HTMLRenderer } from "../template/renderer.js";
import { loadRuntimeScript } from "../utils/runtime.js";
import type { CLIOptions } from "./utils.js";
import {
  getOutputPath,
  ensureOutputDirectory,
  validateInputFile,
  consoleInfo,
  consoleError,
  consoleSuccess,
  showFixSuggestion,
} from "./utils.js";

export async function build(inputPath: string, options: CLIOptions): Promise<string> {
  let absInputPath: string;

  try {
    absInputPath = validateInputFile(inputPath);
  } catch (e) {
    consoleError("Input file not found", (e as Error).message);
    showFixSuggestion("FILE_NOT_FOUND");
    throw e;
  }

  const outputPath = getOutputPath(inputPath, options);

  // Ensure output directory exists
  ensureOutputDirectory(outputPath);

  consoleInfo(`Building ${inputPath} → ${outputPath}...`);

  try {
    const markdown = await Bun.file(absInputPath).text();

    // 1. Parse
    const presentation = parseMarkdown(markdown);

    // 2. Prepare Runtime (Static)
    const runtimeJs = await loadRuntimeScript("view", { minify: options.minify });

    // 3. Generate HTML
    const renderer = new HTMLRenderer({ enableMinify: options.minify, inlineAssets: true });
    const result = await renderer.generate(presentation, runtimeJs);
    const html = typeof result === "string" ? result : result.html;

    // 4. Write Output
    await Bun.write(outputPath, html);
    consoleSuccess(`Generated: ${outputPath}`);

    return outputPath;
  } catch (error) {
    const errorMessage = (error as Error).message || "Unknown error";
    consoleError("Build failed", errorMessage);
    showFixSuggestion("BUILD_ERROR");
    throw error;
  }
}
