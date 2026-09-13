# Bundeck API Reference

This document describes the public API for using Bundeck from Bun. Most users should import from the package root.

```typescript
import { generateSlides, parseSlides } from "bundeck";
```

## Contents

- [HTML generation](#html-generation)
- [Markdown parsing](#markdown-parsing)
- [Low-level HTML rendering](#low-level-html-rendering)
- [CLI API](#cli-api)
- [Extensions and types](#extensions-and-types)
- [Logging](#logging)

## HTML generation

### `generateSlides`

Parses a Markdown string and generates an HTML string containing the view-mode runtime.

```typescript
async function generateSlides(
  markdown: string,
  options?: {
    theme?: string;
    title?: string;
    outputPath?: string;
  },
): Promise<string>;
```

| Argument             | Description                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------- |
| `markdown`           | The Markdown source for the slides.                                                               |
| `options.theme`      | The theme name. Built-in themes are `default` and `dark`.                                         |
| `options.title`      | Overrides the HTML title.                                                                         |
| `options.outputPath` | Not used by the current implementation. To save the file, pass the returned value to `Bun.write`. |

`generateSlides` returns an HTML string and does not write a file.

```typescript
import { generateSlides } from "bundeck";

const html = await generateSlides("# First slide\n\n---\n\n# Next slide", {
  title: "My Presentation",
  theme: "dark",
});

await Bun.write("slides.html", html);
```

### `generateHTML`

Generates an HTML string from a parsed `Presentation`.

```typescript
async function generateHTML(
  presentation: Presentation,
  options?: {
    theme?: string;
    title?: string;
  },
): Promise<string>;
```

When `options.theme` or `options.title` is provided, the corresponding values in `presentation.meta` are overridden before generation.

```typescript
import { generateHTML, parseMarkdown } from "bundeck";

const presentation = parseMarkdown("# Title");
presentation.meta.title = "Updated title";

const html = await generateHTML(presentation, { theme: "default" });
```

## Markdown parsing

### `parseMarkdown`

Parses Markdown synchronously, including frontmatter and Bundeck extensions.

```typescript
function parseMarkdown(markdown: string): Presentation;
```

### `parseSlides`

Parses Markdown in the same way as `parseMarkdown`, but exposes an asynchronous API.

```typescript
async function parseSlides(markdown: string): Promise<Presentation>;
```

### `MarkdownParser`

Use this class when you want to create a parser instance explicitly.

```typescript
class MarkdownParser {
  constructor();
  parse(markdown: string): Presentation;
}
```

### `splitTokensToSlides`

Splits a Marked token array into slides. Horizontal-rule tokens become slide separators, and `speaker` containers are extracted as notes.

```typescript
function splitTokensToSlides(tokens: Token[]): Slide[];
```

`Token` is the type provided by `marked`.

## Low-level HTML rendering

Use `HTMLRenderer` when you need to provide the browser runtime JavaScript yourself. In most cases, use `generateSlides` or `generateHTML` instead.

```typescript
class HTMLRenderer {
  constructor(options?: {
    enableMinify?: boolean;
    inlineAssets?: boolean;
    includePresenterAssets?: boolean;
  });

  generate(
    presentation: Presentation,
    runtimeScriptContent: string,
  ): Promise<
    | string
    | {
        html: string;
        assets: {
          mainCss: string;
          printCss: string;
          themeCss: string;
          viewUiCss: string;
          presenterCss: string;
        };
      }
  >;
}
```

- `enableMinify`: Minifies the HTML and CSS.
- `inlineAssets`: Embeds CSS in the HTML when `true`. The default is `true`.
- `includePresenterAssets`: Includes presenter-mode CSS. The default is `false`.
- When `inlineAssets: false`, the result includes the HTML and the CSS assets separately.

## CLI API

### `build`

Reads a Markdown file and writes the generated HTML. Returns the absolute output path.

```typescript
async function build(inputPath: string, options: CLIOptions): Promise<string>;
```

### `runCLI`

Runs Bundeck with an array of CLI arguments.

```typescript
async function runCLI(args: string[]): Promise<string>;
```

The `serve`, `--help`, and `--version` paths may terminate the process. This API is intended for the CLI entry point rather than application-level integration.

### `CLIOptions`

```typescript
interface CLIOptions {
  outputPath?: string;
  autoOpen: boolean;
  help: boolean;
  minify?: boolean;
}
```

### CLI utilities

The following utilities are also available from the package root.

```typescript
function parseArguments(args: string[]): {
  inputPath: string;
  options: CLIOptions;
};

function showHelp(): string;
function getOutputPath(inputPath: string, options: CLIOptions): string;
function ensureOutputDirectory(outputPath: string): void;
function validateInputFile(inputPath: string): string;
```

## Extensions and types

### Markdown extensions

The following extensions and token types are exported.

| Export                                          | Syntax or purpose                                             |
| ----------------------------------------------- | ------------------------------------------------------------- |
| `styledHeadingExtension` / `StyledHeadingToken` | Heading classes such as `# Heading {.center}`                 |
| `styledSpanExtension` / `StyledSpanToken`       | Inline classes such as `[text]{.mark}`                        |
| `styledImageExtension` / `StyledImageToken`     | Image classes such as `![Image](image.png){.fit}`             |
| `containerExtension` / `ContainerToken`         | Blocks such as `::: columns`, `::: speaker`, and `::: .class` |

See the [user guide](guide.md#markdown-syntax) for the complete syntax reference.

### `Presentation`

```typescript
interface Presentation {
  meta: PresentationMeta;
  slides: Slide[];
}
```

### `PresentationMeta`

```typescript
interface PresentationMeta {
  title?: string;
  theme?: string;
  mode?: "light" | "dark" | "auto";
  aspectRatio?: string;
  fontSize?: "XS" | "S" | "M" | "L" | "XL";
  [key: string]: unknown;
}
```

Unknown frontmatter keys are preserved. `mode` is stored as metadata; built-in theme selection is controlled by `theme`.

### `Slide`

```typescript
interface Slide {
  id: number;
  contentTokens: Token[];
  noteTokens: Token[];
  contentLength?: number;
}
```

`contentLength` is an estimate of content volume used for automatic layout adjustment.

### `SyncMessage`

The type used to synchronize server view mode and presenter mode.

```typescript
type SyncMessage =
  { type: "navigate"; index: number } | { type: "pointer"; x: number; y: number; active: boolean };
```

## Logging

Call `setLogFilePath` to append subsequent CLI logs to a file.

```typescript
import { setLogFilePath } from "bundeck";

setLogFilePath("./error.log");
```

`consoleError`, `consoleWarn`, `consoleInfo`, `consoleSuccess`, and `showFixSuggestion` are also exported.
