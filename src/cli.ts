#!/usr/bin/env bun
import { runCLI } from "./cli/index.js";
import { consoleError } from "./cli/utils.js";

// Main execution
const args = Bun.argv.slice(2);

runCLI(args).catch((error) => {
  consoleError("Unexpected error occurred.", (error as Error).message);
  process.exit(1);
});
