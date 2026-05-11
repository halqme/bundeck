# Bundeck 🐰

**Zero-Config Slide Generator** — Write Markdown, get beautiful HTML slides instantly.

Bundeck is a fast, zero-configuration presentation tool powered by [Bun](https://bun.sh/). It transforms your Markdown files into polished, responsive HTML slides with automatic layout adjustments.

## 🚀 Features

- **Markdown First**: Write your content in standard Markdown.
- **Auto Layout**: Automatically adjusts font sizes based on content density.
- **Fast Build**: Powered by Bun for incredible speed.
- **Flexible Styling**: Support for CSS classes, columns, and custom attributes.
- **Live Preview**: Built-in development server with live reload.
- **Presenter Mode**: Full-featured presenter dashboard with slide notes, timer, laser pointer, and sync across devices.
- **Context Menu**: Right-click on slides for quick navigation (first/last slide, go to slide number, open presenter mode).
- **Hover Navigation**: Floating prev/next buttons appear on hover at the bottom-right corner.
- **Zero Config**: Sensible defaults, just write and run.

## 📦 Installation

### Using Bun

```bash
bun add -d bundeck
```

Or run directly:

```bash
bunx bundeck <your-file.md>
```

### Using npm

Although this tool is built for Bun, you can install it via npm if you have the Bun runtime available in your path.

```bash
npm install -g bundeck
# or run directly
npx bundeck <your-file.md>
```

_Note: Requires Bun runtime installed on your system._

### Using Nix

This project provides a standard Nix flake.

```bash
# Run directly
nix run github:halqme/bundeck -- <your-file.md>

# Enter development shell
nix develop github:halqme/bundeck
```

## 🛠 Usage

### Build Slides

Generate a static HTML file from your Markdown source.

```bash
bundeck presentation.md
```

**Options:**

- `-o, --output <path>`: Specify output file path (default: `dist/index.html`)
- `-w, --watch`: Watch for changes and rebuild
- `--open`: Open the generated file in browser
- `-v, --version`: Show version number
- `-h, --help`: Show help message

### Development Server

Start a local server to preview your slides.

```bash
bundeck serve presentation.md
```

**Options:**

- `-p, --port <number>`: Set server port (default: 3000)

### Presenter Mode

Start the server and open **`http://localhost:3000/presenter`** in your browser to access the presenter dashboard.

Features available in presenter mode:

- **Slide preview** — Current slide and next slide shown side-by-side
- **Speaker notes** — Notes from `::: speaker` blocks displayed alongside slides
- **Laser pointer** — Click the 🔴 button or press a key to activate; mouse movement is synced to the audience view in real-time
- **Timer** — Track elapsed time with pause/reset controls
- **Progress bar** — Visual indicator of presentation progress
- **Open view mode** — Click the ↗ button to open a new tab with the audience view, synced via BroadcastChannel

### View Mode UI

Both the static build and server mode include in-viewport navigation:

- **Hover navigation** — Move the mouse to the bottom-right corner to reveal `‹` and `›` buttons
- **Context menu** — Right-click anywhere on a slide to access:
  - Navigate to first / previous / next / last slide
  - Jump to a specific slide number
  - Open presenter mode in a new tab (server mode only)

## 📝 Markdown Syntax

Bundeck extends standard Markdown with powerful layout features.

### Frontmatter

Configure your slide deck using YAML frontmatter at the top of your file.

```yaml
title: My Awesome Presentation
author: Me
theme: default
aspectRatio: 16:9
fontSize: M
```

### Slides

Separate slides with `---`.

```markdown
# Slide 1

Content...

---

# Slide 2

Content...
```

### Columns

Create multi-column layouts using `::: columns` blocks.

```markdown
::: columns
:::: col

### Left Column

- Item 1
- Item 2
  ::::

:::: col

### Right Column

![Image](image.png)
::::
:::
```

### Styling & Classes

Apply CSS classes to elements using `{.classname}` syntax.

```markdown
# Centered Title {.center}

This text is highlighted. [Important]{.mark}

![Background](bg.jpg){.cover}
```

### Speaker Notes

Add private notes that won't appear on the main slide.

```markdown
::: speaker
Don't forget to mention the new features!
:::
```

## 💻 Development

### Prerequisites

- [Bun](https://bun.sh) (v1.3.8+)
- [Nix](https://nixos.org) (optional, for reproducible environment)

### Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/halqme/bundeck.git
   cd bundeck
   ```

2. Install dependencies:

   ```bash
   bun install
   ```

3. Run tests:

   ```bash
   bun run test
   ```

4. Build the project:
   ```bash
   bun run build
   ```

## 📄 API Documentation

For detailed API reference, see [API.md](API.md).

### Programmatic Usage

```typescript
import { generateSlides, parseSlides } from "bundeck";

// 基本的な使用
const markdown = `# Title\n\n---\n\n# Slide 2`;
const html = await generateSlides(markdown);

// オプション付き
const html = await generateSlides(markdown, {
  title: "My Presentation",
  theme: "dark",
  outputPath: "output.html",
});
```

### Performance

Bundeck is optimized for speed:

| Scenario                         | Time    |
| -------------------------------- | ------- |
| 5,000 char Markdown (5 slides)   | < 100ms |
| 15,000 char Markdown (10 slides) | < 500ms |
| 50 slides                        | < 1s    |

## 📁 Project Structure

```
bundeck/
├── src/
│   ├── cli/              # CLI tools
│   ├── core/             # Core parsing and render logic
│   │   ├── parser.ts     # Markdown → token stream (via marked)
│   │   ├── splitter.ts   # Tokens → Slide[]
│   │   └── extensions/   # Custom markdown syntax
│   ├── client/           # Browser runtime
│   │   ├── runtime-view.ts      # View mode entry (static build)
│   │   ├── runtime-server.ts    # Server entry (view + presenter)
│   │   ├── core/
│   │   │   ├── navigator.ts     # Slide transitions & text scaling
│   │   │   ├── runtime-core.ts  # Shared view runtime setup
│   │   │   ├── view-ui.ts       # Hover nav buttons & context menu
│   │   │   ├── geometry.ts      # Aspect-ratio & coordinate math
│   │   │   └── types.ts         # Navigator options
│   │   └── presenter/           # Presenter dashboard UI
│   ├── server/           # Development server
│   ├── template/         # HTML template & CSS bundling
│   └── types/            # Shared TypeScript types
├── tests/                # Test suites
├── styles/               # CSS themes
└── examples/             # Example presentations
```

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## 📄 License

MIT

---

Built with ❤️ using Bun.
