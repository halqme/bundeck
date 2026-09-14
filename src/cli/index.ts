import { parseArguments, showHelp, consoleError, consoleSuccess, consoleInfo } from "./utils.js";
import { build } from "./builder.js";
import { startServer } from "../server/index.js";
import { getVersion } from "../version.js";

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
            consoleError("--port requires a numeric value.", "Example: --port 8080");
            process.exit(1);
          }
        } else if (arg === "-h" || arg === "--help") {
          consoleInfo(`
bundeck serve - Start the development server

Usage:
  bundeck serve <input.md> [options]

Options:
  -p, --port <number>    Set the server port (default: 3000)
  -h, --help             Show this help message
`);
          process.exit(0);
        } else if (!arg.startsWith("-")) {
          inputPath = arg;
        }
      }

      if (!inputPath) {
        consoleError("serve requires an input file.", "Example: bundeck serve <input.md>");
        process.exit(1);
      }

      consoleSuccess(`Starting server on port ${port}...`);
      await startServer(inputPath, port);
      return ""; // Server keeps running
    }

    // Check for version flag
    if (args.includes("--version") || args.includes("-v")) {
      consoleInfo(`Bundeck v${getVersion()}`);
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
    consoleError("Unexpected error occurred.", (error as Error).message);
    process.exit(1);
  }
}

// Re-export utilities for external use
export { parseArguments, showHelp, type CLIOptions } from "./utils.js";
export { build } from "./builder.js";
