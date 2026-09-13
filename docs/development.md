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

`bun run check` runs formatting, linting, and type checking in sequence. `bun run verify:package` checks the files and entry points included in the npm package. To run a specific test file, pass its path to Bun.

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
