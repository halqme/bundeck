import { parseMarkdown } from "../core/parser";
import { HTMLRenderer } from "../template/renderer";
import type { CLIOptions } from "./utils";
import {
  getOutputPath,
  ensureOutputDirectory,
  validateInputFile,
  consoleInfo,
  consoleError,
  consoleSuccess,
  showFixSuggestion,
} from "./utils";

export async function build(inputPath: string, options: CLIOptions): Promise<string> {
  let absInputPath: string;

  try {
    absInputPath = validateInputFile(inputPath);
  } catch (e) {
    consoleError("入力ファイルが見つかりません", (e as Error).message);
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
    const buildResult = await Bun.build({
      entrypoints: ["src/client/runtime-static.ts"],
      target: "browser",
      minify: true,
    });

    if (!buildResult.success || buildResult.outputs.length === 0) {
      consoleError("Failed to build client runtime", JSON.stringify(buildResult.logs));
      throw new Error("Failed to build client runtime");
    }

    const runtimeJs = await buildResult.outputs[0]!.text();

    // 3. Generate HTML
    const renderer = new HTMLRenderer({ enableMinify: options.minify, inlineAssets: true });
    const result = await renderer.generate(presentation, runtimeJs);
    const html = typeof result === "string" ? result : result.html;

    // 4. Write Output
    await Bun.write(outputPath, html);
    consoleSuccess(`Generated: ${outputPath}`);

    return outputPath;
  } catch (error) {
    const errorMessage = (error as Error).message || "不明なエラー";
    consoleError("ビルドに失敗しました", errorMessage);
    showFixSuggestion("BUILD_ERROR");
    throw error;
  }
}
