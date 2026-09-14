import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type PackageManifest = {
  files: Array<{ path: string }>;
};

type PackageJson = {
  main?: string;
  types?: string;
  exports?: {
    "."?: {
      import?: string;
      types?: string;
    };
  };
};

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = JSON.parse(
  await readFile(join(rootDir, "package.json"), "utf8"),
) as PackageJson;

const result = Bun.spawnSync(["npm", "pack", "--dry-run", "--json"], {
  cwd: rootDir,
  stdout: "pipe",
  stderr: "pipe",
});

if (result.exitCode !== 0) {
  throw new Error(new TextDecoder().decode(result.stderr));
}

const packResult = JSON.parse(new TextDecoder().decode(result.stdout)) as PackageManifest[];
const publishedFiles = new Set(packResult[0]?.files.map((file) => file.path));
const requiredFiles = [
  packageJson.main,
  packageJson.types,
  packageJson.exports?.["."]?.import,
  packageJson.exports?.["."]?.types,
  "dist/runtime/runtime-view.js",
  "dist/runtime/runtime-view.min.js",
  "dist/runtime/runtime-server.js",
  "dist/runtime/runtime-server.min.js",
].filter((file): file is string => Boolean(file));

const missingFiles = requiredFiles.filter((file) => {
  const normalized = file.replace(/^\.\//, "");
  return !publishedFiles.has(normalized);
});

if (missingFiles.length > 0) {
  throw new Error(`Published package is missing: ${missingFiles.join(", ")}`);
}

console.log(`Package verification passed (${publishedFiles.size} files)`);
