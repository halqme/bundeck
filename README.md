# Slide Bun 🐰

**Zero-Config Slide Generator** - Write Markdown, get beautiful slides automatically.

Slide Bun is a fast, zero-configuration presentation tool powered by [Bun](https://bun.sh/). It transforms your Markdown files into polished, responsive HTML slides with automatic layout adjustments.

## 🚀 Features

- **Markdown First**: Write your content in standard Markdown.
- **Auto Layout**: Automatically adjusts font sizes based on content density.
- **Fast Build**: Powered by Bun for incredible speed.
- **Flexible Styling**: Support for CSS classes, columns, and custom attributes.
- **Live Preview**: Built-in development server with live reload.
- **Zero Config**: Sensible defaults, just write and run.

## 📦 Installation

### Using Bun

```bash
bun add -d slide_bun
```

Or run directly:

```bash
bunx slide_bun <your-file.md>
```

### Using npm

Although this tool is built for Bun, you can install it via npm if you have the Bun runtime available in your path.

```bash
npm install -g slide_bun
# or run directly
npx slide_bun <your-file.md>
```

_Note: Requires Bun runtime installed on your system._

### Using Nix

This project provides a standard Nix flake.

```bash
# Run directly
nix run github:halqme/slide_bun -- <your-file.md>

# Enter development shell
nix develop github:halqme/slide_bun
```

## 🛠 Usage

### Build Slides

Generate a static HTML file from your Markdown source.

```bash
slide-bun presentation.md
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
slide-bun serve presentation.md
```

**Options:**

- `-p, --port <number>`: Set server port (default: 3000)

## 📝 Markdown Syntax

Slide Bun extends standard Markdown with powerful layout features.

### Frontmatter

Configure your slide deck using YAML frontmatter at the top of your file.

```yaml
title: My Awesome Presentation
author: Me
theme: default
aspectRatio: 16/9
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
   git clone https://github.com/halqme/slide_bun.git
   cd slide_bun
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
import { generateSlides, parseSlides } from "slide_bun";

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

Slide Bun is optimized for speed:

| Scenario                         | Time    |
| -------------------------------- | ------- |
| 5,000 char Markdown (5 slides)   | < 100ms |
| 15,000 char Markdown (10 slides) | < 500ms |
| 50 slides                        | < 1s    |

## 📁 Project Structure

```
slide_bun/
├── src/
│   ├── cli/          # CLI tools
│   ├── core/         # Core parsing logic
│   ├── client/       # Browser runtime
│   ├── server/       # Development server
│   ├── template/     # HTML template
│   └── types/        # TypeScript types
├── tests/            # Test suites
├── styles/          # CSS themes
└── examples/        # Example presentations
```

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## 📄 License

MIT

---

Built with ❤️ using Bun.
