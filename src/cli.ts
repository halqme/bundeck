#!/usr/bin/env bun
import { runCLI } from "./cli/index";
import { consoleError } from "./cli/utils";

// Main execution
const args = Bun.argv.slice(2);

runCLI(args).catch((error) => {
  consoleError("予期しないエラーが発生しました", (error as Error).message);
  process.exit(1);
});
