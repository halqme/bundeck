import { resolve, basename, extname, dirname } from "path";
import { existsSync, mkdirSync, appendFileSync } from "fs";

// ANSIカラーコード
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
};

let logFilePath: string | null = null;

/**
 * ログファイルのパスを設定
 */
export function setLogFilePath(path: string): void {
  logFilePath = path;
}

/**
 * ファイルにログを書き込む
 */
function writeToLogFile(message: string, level: "error" | "warn" | "info"): void {
  if (!logFilePath) return;
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
  try {
    appendFileSync(logFilePath, logEntry, { encoding: "utf-8" });
  } catch {
    // ログファイルへの書き込みに失敗した場合は無視
  }
}

/**
 * カラー付きコンソール出力 - エラー
 */
export function consoleError(message: string, details?: string): void {
  const fullMessage = details
    ? `${colors.red}${colors.bold}Error:${colors.reset} ${message}\n${colors.dim}→ ${details}${colors.reset}`
    : `${colors.red}${colors.bold}Error:${colors.reset} ${message}`;
  console.error(fullMessage);
  writeToLogFile(details ? `${message}: ${details}` : message, "error");
}

/**
 * カラー付きコンソール出力 - 警告
 */
export function consoleWarn(message: string): void {
  const fullMessage = `${colors.yellow}${colors.bold}Warning:${colors.reset} ${message}`;
  console.warn(fullMessage);
  writeToLogFile(message, "warn");
}

/**
 * カラー付きコンソール出力 - 情報
 */
export function consoleInfo(message: string): void {
  const fullMessage = `${colors.cyan}ℹ${colors.reset} ${message}`;
  console.log(fullMessage);
  writeToLogFile(message, "info");
}

/**
 * カラー付きコンソール出力 - 成功
 */
export function consoleSuccess(message: string): void {
  const fullMessage = `${colors.green}✓${colors.reset} ${message}`;
  console.log(fullMessage);
  writeToLogFile(message, "info");
}

/**
 * エラー発生時のヘルプリンクを表示
 */
export function showFixSuggestion(errorCode: string): void {
  const suggestions: Record<string, string> = {
    FILE_NOT_FOUND: "ファイルが存在するか確認してください",
    INVALID_OPTION: "正しいオプションか -h ヘルプを確認してください",
    PARSE_ERROR: "Markdownの構文を確認してください",
    BUILD_ERROR: "依存関係が正しいか確認してください",
  };

  const suggestion = suggestions[errorCode];
  if (suggestion) {
    console.log(`${colors.dim}💡 Hint: ${suggestion}${colors.reset}`);
  }
}

export interface CLIOptions {
  outputPath?: string;
  autoOpen: boolean;
  help: boolean;
  minify?: boolean;
}

export function parseArguments(args: string[]): { inputPath: string; options: CLIOptions } {
  const options: CLIOptions = {
    autoOpen: false,
    help: false,
    minify: false,
  };

  let inputPath = "";

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg) continue;

    switch (arg) {
      case "-o":
      case "--output":
        if (i + 1 < args.length) {
          options.outputPath = args[++i];
        } else {
          throw new Error("Error: --output requires a file path");
        }
        break;
      case "--auto-open":
        options.autoOpen = true;
        break;
      case "-h":
      case "--help":
        options.help = true;
        break;
      case "--minify":
        options.minify = true;
        break;
      default:
        if (!arg.startsWith("-") && !inputPath) {
          inputPath = arg;
        } else if (arg.startsWith("-")) {
          throw new Error(`Error: Unknown option ${arg}`);
        }
        break;
    }
  }

  if (!inputPath && !options.help) {
    throw new Error("Error: Input file is required");
  }

  return { inputPath, options };
}

export function showHelp(): string {
  return `
slide-bun - Markdown to HTML slide generator

Usage:
  slide-bun <input.md> [options]
  slide-bun serve <input.md> [options]

Commands:
  serve                  Start development server with HMR

Options:
  -o, --output <path>    Set output file path (default: <input>.html)
  --auto-open            Open generated HTML in default browser
  --minify               Minify HTML and CSS for smaller file size
  -v, --version          Show version number
  -h, --help             Show this help message

Serve Options:
  -p, --port <number>    Set server port (default: 3000)

Examples:
  slide-bun presentation.md
  slide-bun serve presentation.md
  slide-bun presentation.md -o slides.html
`;
}

export function getOutputPath(inputPath: string, options: CLIOptions): string {
  if (options.outputPath) {
    // If output path is provided, resolve it relative to current working directory
    return resolve(process.cwd(), options.outputPath);
  }

  // Default: same directory as input file, same name but .html extension
  const ext = extname(inputPath);
  const base = basename(inputPath, ext);
  const inputDir = dirname(resolve(process.cwd(), inputPath));
  return resolve(inputDir, `${base}.html`);
}

export function ensureOutputDirectory(outputPath: string): void {
  const outputDir = dirname(outputPath);
  try {
    mkdirSync(outputDir, { recursive: true });
  } catch {
    // Directory might already exist, ignore error
  }
}

export function validateInputFile(inputPath: string): string {
  const absInputPath = resolve(process.cwd(), inputPath);

  if (!existsSync(absInputPath)) {
    throw new Error(`File not found: ${inputPath}`);
  }

  return absInputPath;
}
