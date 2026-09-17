import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = join(rootDir, "dist");
const runtimeDir = join(distDir, "runtime");

async function buildEntry(
  entrypoint: string,
  outfile: string,
  target: "bun" | "browser",
  options: { minify?: boolean; sourcemap?: boolean } = {},
) {
  const outputDir = dirname(outfile);
  const buildDir = await mkdtemp(join(tmpdir(), "bundeck-build-"));

  try {
    const result = await Bun.build({
      entrypoints: [join(rootDir, entrypoint)],
      outdir: buildDir,
      target,
      minify: options.minify ?? false,
      sourcemap: options.sourcemap ?? false,
      tsconfig: join(rootDir, "tsconfig.json"),
    });

    if (result.success) {
      await mkdir(outputDir, { recursive: true });

      for (const output of result.outputs) {
        const outputPath =
          output.kind === "entry-point" ? outfile : join(outputDir, basename(output.path));
        await Bun.write(outputPath, await output.arrayBuffer());
      }
      return;
    }

    const details = result.logs
      .map((log) => (typeof log === "string" ? log : (log.message ?? JSON.stringify(log))))
      .join("; ");
    throw new Error(`Failed to build ${entrypoint}: ${details}`);
  } finally {
    await rm(buildDir, { recursive: true, force: true });
  }
}

await rm(distDir, { recursive: true, force: true });
await mkdir(runtimeDir, { recursive: true });

await buildEntry("src/cli.ts", join(distDir, "cli.js"), "bun", { sourcemap: true });
await buildEntry("src/index.ts", join(distDir, "index.js"), "bun", { sourcemap: true });

for (const kind of ["view", "server"] as const) {
  await buildEntry(
    `src/client/runtime-${kind}.ts`,
    join(runtimeDir, `runtime-${kind}.js`),
    "browser",
  );
  await buildEntry(
    `src/client/runtime-${kind}.ts`,
    join(runtimeDir, `runtime-${kind}.min.js`),
    "browser",
    { minify: true },
  );
}

const typecheck = Bun.spawn(["bunx", "tsc", "--project", join(rootDir, "tsconfig.build.json")], {
  cwd: rootDir,
  stdout: "inherit",
  stderr: "inherit",
});

if ((await typecheck.exited) !== 0) {
  throw new Error("Failed to generate TypeScript declarations");
}
