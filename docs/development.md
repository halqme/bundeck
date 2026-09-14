# Developer Guide

## Development environment

- Bun 1.4.0 or later
- TypeScript

Install the dependencies with:

```bash
bun install
```

## Checks and tests

Run the basic checks before and after making changes.

```bash
bun run check
bun test
bun run build
bun run verify:package
```

`bun run check` checks formatting, linting, and types without modifying tracked files. Run `bun run format` when you want to apply formatting changes. `bun run verify:package` checks the files and entry points included in the npm package. To run a specific test file, pass its path to Bun.

```bash
bun test tests/parser.test.ts
bun test tests/integration/full-flow.test.ts
```

To build and run the CLI locally:

```bash
bun run build
bun run dist/cli.js examples/sample.md --output examples/sample.html
```

`dist/` contains generated files and must not be edited directly.

## Source structure

```text
bundeck/
├── src/
│   ├── cli/              # CLI argument parsing, building, and output
│   ├── core/             # Markdown parsing, splitting, extensions, and layout
│   ├── client/           # View-mode and presenter-mode runtimes
│   ├── server/           # Development server and HTML generation
│   ├── template/         # HTML templates and CSS assets
│   ├── styles/           # Shared CSS and themes
│   ├── types/            # Shared types and synchronization messages
│   ├── config.ts         # Programmatic presentation configuration
│   └── version.ts        # Package version export
├── tests/                # CLI, core, extension, and integration tests
├── docs/                 # User, API, and developer documentation
├── scripts/              # Build and package verification scripts
└── examples/             # Sample presentations
```

## Generation flow

```text
Markdown
  → MarkdownParser (frontmatter + Marked)
  → splitTokensToSlides
  → Presentation / Slide[]
  → HTMLRenderer + client runtime
  → HTML
```

The build produces CLI and programmatic API bundles, TypeScript declarations, and prebuilt browser runtimes under `dist/runtime/`. The static CLI uses `runtime-view`; the development server uses `runtime-server`.

## Change guidelines

- When adding or changing Markdown syntax, review `src/core/extensions/`, the parser, tests, and `docs/guide.md`.
- When changing frontmatter or public types, update `src/core/parser.ts`, `src/types/`, `docs/API.md`, and related tests together.
- When changing CLI options, review `src/cli/utils.ts`, CLI tests, the README, and `docs/guide.md`.
- For changes affecting both view and presenter modes, consider whether shared logic belongs in `src/client/core/`.
- When generated output needs to be checked, run `bun run build` and the relevant integration tests.

## Release process

`main` is the source of truth for releases. Bundeck does not use a release branch. A release tag is created only after the intended changes have been merged into `main`.

1. Prepare a pull request that updates the version in `package.json` and moves the relevant entries in `CHANGELOG.md` out of `Unreleased`.
2. Merge the pull request into `main` and wait for the `main` CI checks to pass.
3. Update your local `main` with `git pull --ff-only` and identify the exact commit to release.
4. Create and push an annotated tag whose name matches the package version.

```bash
git switch main
git pull --ff-only
git tag -a v0.1.2 -m "v0.1.2"
git push origin v0.1.2
```

The tag push starts `.github/workflows/release.yml`. Before publishing, the workflow checks that the tag is exactly `v<package.json version>` and that the tagged commit is contained in `origin/main`. It then installs the frozen lockfile, reruns checks and tests, builds the distribution, verifies the npm package contents, and publishes through npm trusted publishing.

Do not tag a pull-request branch before merging it. Squash merge and other merge strategies may create a different commit, leaving the tag attached to a commit that is not the released `main` commit.

The npm trusted publisher for this repository must authorize `.github/workflows/release.yml` to run `npm publish`.
