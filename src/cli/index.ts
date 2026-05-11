import { parseArguments, showHelp, consoleError, consoleSuccess, consoleInfo } from "./utils";
import { build } from "./builder";
import { startServer } from "../server/index";

export async function runCLI(args: string[]): Promise<string> {
  try {
    if (args.length === 0) {
      consoleInfo(showHelp());
      process.exit(0);
    }

    // Handle "serve" command
    if (args[0] === "serve") {
      const serveArgs = args.slice(1);
      let inputPath = "";
      let port = 3000;

      for (let i = 0; i < serveArgs.length; i++) {
        const arg = serveArgs[i];
        if (!arg) continue;
        if (arg === "-p" || arg === "--port") {
          if (i + 1 < serveArgs.length) {
            const portStr = serveArgs[++i];
            if (portStr) {
              port = parseInt(portStr, 10);
            }
          } else {
            consoleError("--portには数値を指定してください", "例: --port 8080");
            process.exit(1);
          }
        } else if (arg === "-h" || arg === "--help") {
          consoleInfo(`
bundeck serve - Start development server

Usage:
  bundeck serve <input.md> [Options]

Options:
  -p, --port <number>    Set server port (default: 3000)
  -h, --help             Show this help message
            `);
          process.exit(0);
        } else if (!arg.startsWith("-")) {
          inputPath = arg;
        }
      }

      if (!inputPath) {
        consoleError("serveコマンドには入力ファイルが必要です", "bundeck serve <input.md>");
        process.exit(1);
      }

      consoleSuccess(`Starting server on port ${port}...`);
      await startServer(inputPath, port);
      return ""; // Server keeps running
    }

    // Check for version flag
    if (args.includes("--version") || args.includes("-v")) {
      consoleInfo("Bundeck v0.0.1");
      process.exit(0);
    }

    // Default: Build command
    const { inputPath, options } = parseArguments(args);

    if (options.help) {
      consoleInfo(showHelp());
      process.exit(0);
    }

    return build(inputPath, options).then((outPath) => {
      if (options.autoOpen) {
        consoleInfo("Opening in browser...");
        Bun.spawn(["open", outPath]);
      }
      return outPath;
    });
  } catch (error) {
    consoleError("予期しないエラーが発生しました", (error as Error).message);
    process.exit(1);
  }
}

// Re-export utilities for external use
export { parseArguments, showHelp, type CLIOptions } from "./utils";
export { build } from "./builder";
