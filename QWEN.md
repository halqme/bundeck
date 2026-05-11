# Bundeck - Zero-Config Slide Generator

## Project Overview

Bundeckは、Markdownファイルを美しくインタラクティブなHTMLプレゼンテーションに変換するゼロコンフィグレーションのスライドジェネレーターです。BunとTypeScriptで構築されており、馴染み深いMarkdown構文でコンテンツを記述し、最小限のセットアップでプロフェッショナルなスタイルのスライドを自動生成できます。

### Key Features

- **Markdownベース**: 標準のMarkdown構文を使用してプレゼンテーションを作成
- **自動レイアウト**: コンテンツ量に応じてフォントサイズを自動調整
- **柔軟な拡張**: カスタムクラス、カラムレイアウト、高度なスタイリングをサポート
- **高速ビルド**: 高速なHTML生成のためにBun搭載
- **ライブ開発サーバー**: リアルタイムプレビューのためのホットモジュールリプレースメントを含む
- **スピーカーノート**: プレゼンター専用ノートのサポート
- **テーマシステム**: ライト/ダークモード対応のカスタマイズ可能なテーマ
- **レスポンシブデザイン**: さまざまな画面サイズに対応

### Architecture

プロジェクトは以下の主要モジュールに組織されています：

- **CLI**: プレゼンテーションのビルドと提供のためのコマンドラインインターフェース
- **Core**: Markdown解析とスライド分割ロジック
- **Client**: ナビゲーションとインタラクティブ性のためのブラウザ側ランタイム
- **Server**: ホットリロード機能付きの開発サーバー
- **Template**: HTML生成とテーマ管理
- **Types**: 共有TypeScriptインターフェース

### Language Convention

- **応答言語**: プロジェクトのすべてのコミュニケーションおよびドキュメントは日本語で行う

## Building and Running

### Prerequisites

- Bun runtime (version 1.3.6 or compatible)

### Installation

```bash
# Install dependencies
bun install
```

### Available Scripts

```bash
# Build the project
bun run build

# Start the development server
bun run start

# Run tests
bun test

# Format code
bun run format

# Lint code
bun run lint

# Type checking
bun run type-check

# Run all checks (format, lint, type-check)
bun run check
```

### CLI Usage

```bash
# Build a presentation
bundeck presentation.md

# Build with custom output path
bundeck presentation.md -o slides.html

# Build with minification
bundeck presentation.md --minify

# Build and auto-open in browser
bundeck presentation.md --auto-open

# Start development server
bundeck serve presentation.md

# Start development server on custom port
bundeck serve presentation.md -p 8080
```

### Presentation Structure

Presentations are written in Markdown with optional frontmatter metadata:

```markdown
---
title: My Presentation Title
theme: default
aspectRatio: 16:9
fontSize: M
---

# Slide Title

Content goes here...

---

## Another Slide

More content...
```

### Special Syntax

- `---` separates slides
- `::: speaker` blocks create presenter notes
- `{.class-name}` applies CSS classes to elements
- `::: columns` creates column layouts

## Development Conventions

### Code Style

- TypeScript is used throughout the project
- Formatting follows Ox formatter rules (oxfmt)
- Linting is performed with Ox linter (oxlint)
- Strict TypeScript settings are enabled

### Testing

- Unit tests are located in the `tests/` directory
- Tests use Bun's built-in test runner
- Parser tests are in `tests/parser.test.ts`
- Integration tests cover end-to-end functionality

### File Structure

- `src/` - Source code organized by functionality (cli, client, core, server, etc.)
- `tests/` - Test files mirroring the source structure
- `examples/` - Sample presentations demonstrating features
- `dist/` - Build output directory

### Theme System

Themes are stored in the `src/template/styles` directory and can be referenced in frontmatter:

- Default theme provides clean, professional styling
- Dark theme available for low-light environments
- Custom themes can be added by creating new CSS files

## Key Dependencies

- `marked`: Markdown parsing library
- `bun`: JavaScript runtime providing fast builds and file operations
- `typescript`: Type safety and modern JavaScript features

## Development Workflow

1. Make changes to source files in `src/`
2. Run `bun run build` to compile the CLI
3. Test with sample Markdown files in `examples/`
4. Run `bun test` to ensure functionality remains intact
5. Use `bun run check` to verify code quality
