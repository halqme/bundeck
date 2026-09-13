# Bundeck 🐰

A zero-config tool for generating HTML slides from Markdown. Bundeck runs on Bun and provides automatic layout adjustment, speaker notes, and presenter mode.

## Features

- Use Markdown directly as your slide source
- Automatically adjust font sizes to match content density
- Use extended syntax for classes, columns, and image styles
- Live preview with the built-in development server (HMR)
- Presenter mode with notes, a timer, and a laser pointer
- Static HTML builds and a programmatic API for Bun

## Quick Start

Bun 1.4.0 or later is required.

### Install

```bash
bun add --dev bundeck
```

To run Bundeck without installing it, use `bunx`.

```bash
bunx bundeck presentation.md
```

### Generate HTML

```bash
bundeck presentation.md
```

This generates `presentation.html` in the same directory as the input file. You can also specify an output path.

```bash
bundeck presentation.md --output slides.html
```

### Preview with the development server

```bash
bundeck serve presentation.md
```

- View mode: <http://localhost:3000/>
- Presenter mode: <http://localhost:3000/presenter>

Use `--port` to change the port.

```bash
bundeck serve presentation.md --port 8080
```

## Example Input

```markdown
---
title: My First Presentation
theme: default
aspectRatio: 16:9
fontSize: M
---

# Hello {.center}

Write slides in Markdown.

---

## The Next Slide

- A bullet list
- Speaker notes
```

See the [user guide](docs/guide.md) for the complete syntax reference.

## Documentation

- [Documentation index](docs/README.md)
- [User guide](docs/guide.md) — CLI, Markdown syntax, view mode, and presenter mode
- [API reference](docs/API.md) — Functions, types, and extensions for Bun
- [Developer guide](docs/development.md) — Setup, checks, and project structure
- [Sample presentation](examples/sample.md) — A presentation demonstrating Bundeck features

## Development

```bash
bun install
bun run check
bun test
bun run build
```

See the [developer guide](docs/development.md) for detailed development instructions.

## License

MIT
