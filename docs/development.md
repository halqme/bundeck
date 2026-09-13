# Developer Guide

## Development environment

- Bun 1.3.13 or later
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
```

`bun run check` runs formatting, linting, and type checking in sequence. To run a specific test file, pass its path to Bun.

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
│   └── types/            # Shared types and synchronization messages
├── tests/                # CLI, core, extension, and integration tests
├── docs/                 # User, API, and developer documentation
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

The static CLI build bundles `src/client/runtime-view.ts` for the browser. The development server bundles `src/client/runtime-server.ts`.

## Change guidelines

- When adding or changing Markdown syntax, review `src/core/extensions/`, the parser, tests, and `docs/guide.md`.
- When changing frontmatter or public types, update `src/core/parser.ts`, `src/types/`, `docs/API.md`, and related tests together.
- When changing CLI options, review `src/cli/utils.ts`, CLI tests, the README, and `docs/guide.md`.
- For changes affecting both view and presenter modes, consider whether shared logic belongs in `src/client/core/`.
- When generated output needs to be checked, run `bun run build` and the relevant integration tests.
