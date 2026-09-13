# AGENTS.md

Development guide for Bundeck contributors and coding agents. Bundeck is a Bun and TypeScript project that generates HTML slides from Markdown.

## Working rules

- Write project responses and documentation in English.
- Run `bun run check` before making changes.
- Run `bun run check` and the tests related to the changed code after making changes.
- `dist/` contains generated files and should not be edited directly.
- When changing the public API or Markdown syntax, keep the implementation, tests, and `docs/API.md` in sync.
- Use a concise commit message that clearly describes the change.

## Development commands

```bash
# Install dependencies
bun install

# Build the CLI and library bundles
bun run build

# Format, lint, and type-check
bun run check

# Individual checks
bun run format
bun run format:check
bun run lint
bun run type-check

# Tests
bun test
bun test tests/parser.test.ts
```

## CLI usage

Use the built CLI or the npm package CLI.

```bash
# Generate static HTML from Markdown (writes .html next to the input by default)
bundeck presentation.md

# Specify an output path
bundeck presentation.md --output slides.html

# Minify generated HTML/CSS
bundeck presentation.md --minify

# Open the generated presentation in a browser
bundeck presentation.md --auto-open

# Start the development server with HMR
bundeck serve presentation.md
bundeck serve presentation.md --port 8080
```

When running locally, use `bun run dist/cli.js` after building.

## Presentation Markdown

YAML frontmatter may appear at the beginning of a presentation. Common fields include `title`, `theme`, `mode`, `lang`, `aspectRatio`, and `fontSize`. Other fields are retained as metadata.

```markdown
---
title: My Presentation
theme: default
lang: en
aspectRatio: 16:9
fontSize: M
---

# Slide 1

Content...

---

# Slide 2

More content...
```

Built-in extensions include:

- `---`: Split the presentation into slides.
- `::: speaker ... :::`: Add speaker notes that are hidden from the audience.
- `::: columns ... :::`: Create a column layout.
- `{.class-name}`: Add CSS classes to headings, inline elements, images, and other supported elements.

See [`docs/API.md`](docs/API.md) for API details.

## Architecture

- **`src/cli.ts`**: CLI entry point launched by Bun.
- **`src/cli/`**: Argument parsing, static builds, and CLI output/error handling.
- **`src/core/parser.ts`**: Extracts frontmatter and tokenizes Markdown with `marked`.
- **`src/core/splitter.ts`**: Splits tokens into a `Presentation` and `Slide[]`, separating body content and notes.
- **`src/core/extensions/`**: Markdown extensions for headings, inline elements, images, and containers.
- **`src/core/layout-design.ts`**: Adjusts slide layout based on content density.
- **`src/template/renderer.ts`**: Assembles slides, CSS, and runtime code into HTML.
- **`src/template/styles.ts`**: Maps themes to CSS assets.
- **`src/styles/`**: Shared CSS, print styles, view UI, and the `default` / `dark` themes.
- **`src/client/runtime-view.ts`**: View-mode runtime entry point for static HTML.
- **`src/client/runtime-server.ts`**: View and presenter runtime for the development server.
- **`src/client/core/`**: Slide navigation, hash routing, viewport scaling, view UI, and coordinate calculations.
- **`src/client/presenter/`**: Presenter UI, timer, notes, and laser pointer.
- **`src/server/index.ts`**: Markdown watching, HMR, and HTML/asset serving.
- **`src/server/generator.ts`**: Bundles the server runtime and generates HTML.
- **`src/types/`**: Shared `Presentation`, `Slide`, and synchronization message types.
- **`tests/`**: CLI, parser, extension, and runtime tests.

### Generation flow

```text
Markdown
  → MarkdownParser (frontmatter + marked)
  → splitTokensToSlides
  → Presentation
  → HTMLRenderer + client runtime
  → HTML
```

View mode uses `runtime-view.ts` and `src/client/core/`. Serve mode exposes view mode at `/` and presenter mode at `/presenter`, synchronizing slide position and laser-pointer state through `BroadcastChannel`.

## Change guidelines

- Implement new Markdown syntax in `src/core/extensions/`, then check registration in `src/core/extensions/index.ts` and the parser/renderer.
- When adding frontmatter fields, update `src/core/parser.ts`, the shared types, and HTML generation.
- For runtime changes affecting both view and presenter modes, first consider whether the logic belongs in `src/client/core/`.
- Keep slide display sizing and presenter coordinate conversion in `src/client/core/geometry.ts`.
- When changing UI or runtime code, run the relevant tests and, when appropriate, `bun run build` to verify the actual bundles.
