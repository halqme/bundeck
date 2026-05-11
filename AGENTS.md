# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 実行手順

1. `bun run check` を実行して品質チェックとエラー修正を行う。

### 例

```bash
# 変更をコミットする場合
bun run check
```

### 注意事項

- コミットメッセージは明確で簡潔に記述すること。
- 変更前に必ず `bun run check` を実行してください。

## Common Development Commands

- **Build / Check**: `bun run check && bun run lint && bun run format`
- **Run Test Suite**: `bun test`
- **Run a Single Test**: `bun test path/to/file.test.ts`
- **Watch Mode (if available)**: `bun test --watch`
- **Update Snapshots**: `bun test --update-snapshots`
- **Install Dependencies**: `bun install`

These commands are the primary workflow for development, ensuring code quality and correctness.

## High‑Level Architecture

The project is a **Markdown‑to‑HTML slide generator** built with Bun and TypeScript. The main components are:

1. **`src/client/runtime-view.ts`** – View-mode runtime for static builds (`slide-bun build`). Thin wrapper around `createViewRuntime()` + `setupViewUI()`.
2. **`src/client/runtime-server.ts`** – Server-mode runtime for `slide-bun serve`. Handles both view mode and presenter mode dispatch via `window.location.pathname`.
3. **`src/client/core/`** – Shared browser-side modules:
   - `navigator.ts` – `SlideNavigator` class: slide transitions, text scaling, container transform.
   - `runtime-core.ts` – `createViewRuntime()`: wires up navigator, keyboard nav, hash routing, viewport scaling, and resize handling in one call.
   - `view-ui.ts` – `setupViewUI()`: floating hover nav buttons (`‹` `›`) at bottom-right and custom right-click context menu.
   - `geometry.ts` – Slide display‑area math: aspect‑ratio‑aware letterboxing, coordinate normalisation, laser‑pointer size calculation. Used by both view and presenter modes.
   - `types.ts` – `NavigatorOptions` interface.
4. **`src/client/presenter/`** – Presenter UI components and styles (dashboard, timer, notes, laser pointer controls).
5. **`src/core/parser.ts`** – Wraps the `marked` library, registers custom markdown extensions, parses front‑matter, tokenizes the markdown and delegates slide splitting.
6. **`src/core/splitter.ts`** – Converts the flat token stream from `marked` into an array of `Slide` objects, separating content and speaker notes (via `::: speaker` containers) and handling horizontal rules (`---`) as slide delimiters.
7. **`src/core/extensions/*`** – Custom `marked` extensions for styled headings, spans, images, paragraphs, and container blocks. They provide additional syntax such as `[text]{.class}` and `::: container` blocks.
8. **`src/core/layout-design.ts`** – Layout design utilities for slide formatting.
9. **`src/server/generator.ts`** – Generates the final HTML document. It bundles CSS themes, utility styles, and transpiles the TypeScript runtime to JavaScript using `Bun.Transpiler`. Slides are rendered with `marked` and embedded into a simple HTML template.
10. **`src/template/renderer.ts`** – Template rendering utilities.
11. **Types (`src/types/*.ts`)** – Define the `Presentation`, `Slide`, and meta data structures used across the pipeline.

The **view-mode** flow is:

```
Markdown source → MarkdownParser (marked + extensions) → Token stream
 → splitTokensToSlides (splitter) → Presentation object
 → HTMLGenerator → index.html (bundled with CSS & runtime)
                                       ↓
                              runtime-view.ts  (static build)
                           or runtime-server.ts (server, path‑based dispatch)
                                       ↓
                           createViewRuntime() + setupViewUI()
                           ↓           ↓            ↓
                     SlideNavigator  keyboard    viewport
                     (slides, hash)   nav        scaling
```

The **presenter-mode** flow (server only):

```
Presenter UI (dashboard)
  ├── iframe (current slide, ?role=preview#N)  ← BroadcastChannel sync
  ├── iframe (next slide preview)
  ├── speaker notes
  ├── laser pointer (mouse → normalized → geometry.ts → clients)
  └── controls (prev / next / laser toggle / open view ↗)
```

## Project Structure

- `src/cli/` – Command-line interface and builder utilities.
- `src/client/` – Runtime code executed in the browser.
  - `src/client/core/` – Shared core modules (navigator, runtime-core, view-ui, geometry).
  - `src/client/presenter/` – Presenter UI and styles.
- `src/core/` – Parsing, token splitting, markdown extensions, and layout design.
- `src/server/` – Server-side HTML generation.
- `src/template/` – Template rendering utilities.
- `src/types/` – Shared TypeScript interfaces.
- `styles/` – CSS themes and utilities used by the generator.
- `tests/` – Test suites for all components.

## Helpful Tips for Claude Code

- When adding new markdown syntax, extend the appropriate extension under `src/core/extensions` and ensure the parser registers it.
- If you need to expose additional slide metadata, modify `src/core/parser.ts` where the `PresentationMeta` object is built.
- For changes affecting the client runtime, update `src/client/runtime-view.ts` (static) or `src/client/runtime-server.ts` (server). If the change is shared between both, consider putting it in `src/client/core/runtime-core.ts`.
- The geometry module (`src/client/core/geometry.ts`) handles all aspect-ratio-aware coordinate math. If you need to map coordinates between the presenter's iframe and the view mode, use this module.
- Output MUST BE in Japanese.

---

_Generated by Claude Code._
