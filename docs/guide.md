# User Guide

## Contents

- [Installation](#installation)
- [CLI](#cli)
- [Display modes](#display-modes)
- [Markdown syntax](#markdown-syntax)
  - [Frontmatter](#frontmatter)
  - [Splitting slides](#splitting-slides)
  - [Columns](#columns)
  - [Class attributes](#class-attributes)
  - [Speaker notes](#speaker-notes)
- [Troubleshooting](#troubleshooting)

## Installation

Install Bun 1.3.13 or later.

```bash
bun add --dev bundeck
```

To try Bundeck without installing it, use `bunx`.

```bash
bunx bundeck presentation.md
```

## CLI

### Generate static HTML

```bash
bundeck <input.md> [options]
```

| Option                | Description                                                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `-o, --output <path>` | Set the output path. If omitted, Bundeck writes an `.html` file with the same name as the input in the input file's directory. |
| `--auto-open`         | Open the generated HTML with the default macOS application.                                                                    |
| `--minify`            | Minify the HTML and CSS.                                                                                                       |
| `-v, --version`       | Show the version.                                                                                                              |
| `-h, --help`          | Show help.                                                                                                                     |

Relative paths passed to `--output` are resolved from the current working directory. The output directory is created automatically when it does not exist.

### Development server

```bash
bundeck serve <input.md> [options]
```

| Option                | Description                          |
| --------------------- | ------------------------------------ |
| `-p, --port <number>` | Set the port. The default is `3000`. |
| `-h, --help`          | Show help for `serve`.               |

The server watches the input Markdown file and reloads connected browsers when it changes.

## Display modes

### View mode

View mode is available in a statically generated HTML file and at `/` when using `bundeck serve`.

- `→`, `Space`, `Enter`, `n`: Next slide
- `←`, `p`: Previous slide
- `Home`: First slide
- `End`: Last slide
- URL `#N`: Open slide N
- Move the pointer to the bottom-right corner: Show previous/next buttons
- Right-click: Open the slide navigation menu

In server view mode, the context menu also includes an option to open presenter mode.

### Presenter mode

Open `/presenter` while `bundeck serve` is running. Presenter mode shows the current slide, the next slide, and speaker notes while you present.

- Slide navigation and progress indicator
- Clock and elapsed-time timer with pause, resume, and reset controls
- Laser pointer
- Button to open view mode in a new tab
- Synchronization with view mode through `BroadcastChannel`

## Markdown syntax

Bundeck extends standard Markdown with presentation-oriented syntax.

### Frontmatter

You can add YAML frontmatter at the beginning of a file.

```yaml
---
title: My Presentation
theme: dark
mode: auto
aspectRatio: 16:9
fontSize: M
---
```

| Key           | Description                                                                                            |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| `title`       | The HTML title. Defaults to `Untitled Presentation`.                                                   |
| `theme`       | The theme name. Built-in themes are `default` and `dark`. Defaults to `default`.                       |
| `mode`        | Metadata with the value `light`, `dark`, or `auto`. Built-in theme selection is controlled by `theme`. |
| `aspectRatio` | An aspect ratio in `width:height` format. Defaults to `16:9`.                                          |
| `fontSize`    | A font-size preset: `XS`, `S`, `M`, `L`, or `XL`.                                                      |

An unknown theme name falls back to `default`. Aspect-ratio values must be positive.

### Splitting slides

Separate slides with a horizontal rule, `---`.

```markdown
# First slide

Content

---

# Second slide

Content
```

### Columns

Use a `columns` container with nested `col` containers to create columns. The inner fence must be longer than the outer fence so the containers can be nested.

```markdown
::: columns
:::: col

### Left

Content for the left column
::::

:::: col

### Right

Content for the right column
::::
:::
```

### Class attributes

Add classes to headings, inline text, and images with the `{.class}` syntax. Separate multiple classes with spaces.

```markdown
# A centered heading {.center}

Important [text]{.mark} and [additional information]{.muted}.

![An image](image.png){.fit .opacity 80}
```

Use a container to apply classes to a whole block.

```markdown
::: .caption .right
A right-aligned caption
:::
```

The following are the main classes provided by the built-in CSS.

| Use       | Classes                                       |
| --------- | --------------------------------------------- |
| Alignment | `center`, `left`, `right`, `top`, `bottom`    |
| Text      | `caption`, `mark`, `muted`, `accent`, `small` |
| Blocks    | `block-center`, `overlay-dim`                 |
| Images    | `fit`, `cover`                                |
| Opacity   | `opacity 0`–`opacity 100` (in steps of 10)    |
| Grayscale | `gray 0`–`gray 100` (in steps of 10)          |

Specify values for `opacity` and `gray` as follows. If the value is omitted, `50` is used.

```markdown
![An image](image.png){.opacity 70 .gray 20}
```

Custom class names are also emitted, but you must provide the corresponding CSS yourself.

### Speaker notes

The contents of a `::: speaker` block are hidden from the slide and shown as notes in presenter mode.

```markdown
# Presentation content

::: speaker
This is a note visible only to the presenter.
:::
```

## Troubleshooting

### Images are not displayed

In a static HTML file, image URLs are resolved relative to the HTML file. When using relative paths, check the location of the HTML file and the images. In development-server mode, static files are served from the directory containing the input Markdown file.

### No slides are generated

Bundeck displays a warning when the input is empty or contains no content that can be treated as a slide. Check the Markdown content and the placement of `---`.

### Theme or aspect ratio is not applied

Use `default` or `dark` for the theme. Specify aspect ratios in `width:height` form, such as `16:9`. Invalid values produce a warning and fall back to the defaults.
