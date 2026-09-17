import { fileURLToPath } from "node:url";

export type RuntimeKind = "view" | "server";

interface RuntimeLoadOptions {
  minify?: boolean;
}

function runtimeFilename(kind: RuntimeKind, minify: boolean): string {
  return `runtime-${kind}${minify ? ".min" : ""}.js`;
}

async function readIfExists(url: URL): Promise<string | null> {
  const file = Bun.file(fileURLToPath(url));
  if (!(await file.exists())) return null;
  return file.text();
}

/**
 * Load a browser runtime from the source tree during development or from the
 * prebuilt package artifact when running an installed CLI/API package.
 */
export async function loadRuntimeScript(
  kind: RuntimeKind,
  options: RuntimeLoadOptions = {},
): Promise<string> {
  const minify = options.minify ?? false;
  const filename = runtimeFilename(kind, minify);

  // The source path is intentionally checked first so tests and local source
  // usage always exercise the current runtime implementation.
  const sourceUrl = new URL(`../client/runtime-${kind}.ts`, import.meta.url);
  if (await Bun.file(fileURLToPath(sourceUrl)).exists()) {
    const result = await Bun.build({
      entrypoints: [fileURLToPath(sourceUrl)],
      target: "browser",
      format: "iife",
      minify,
      tsconfig: fileURLToPath(new URL("../../tsconfig.json", import.meta.url)),
    });

    if (result.success && result.outputs.length > 0) {
      return result.outputs[0]!.text();
    }

    const details = result.logs
      .map((log) => (typeof log === "string" ? log : (log.message ?? JSON.stringify(log))))
      .join("; ");
    throw new Error(`Client runtime build failed: ${details}`);
  }

  // Compiled runtime files live beside the bundled module in the published package.
  const packagedRuntime = await readIfExists(new URL(`./runtime/${filename}`, import.meta.url));
  if (packagedRuntime !== null) return packagedRuntime;

  throw new Error(`Client runtime artifact not found: ${filename}`);
}
