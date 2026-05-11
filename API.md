# Bundeck API Reference

このドキュメントでは、BundeckのパブリックAPIについて詳しく説明します。

## 目次

1. [コア関数](#コア関数)
2. [型定義](#型定義)
3. [CLI](#cli)
4. [拡張機能](#拡張機能)
5. [使用例](#使用例)

---

## コア関数

### generateSlides

Markdown文字列からHTMLスライドを生成します。

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

**パラメータ:**

| パラメータ           | 型       | 説明                                       |
| -------------------- | -------- | ------------------------------------------ |
| `markdown`           | `string` | スライドのMarkdownソース                   |
| `options.theme`      | `string` | テーマ名（オプション）                     |
| `options.title`      | `string` | プレゼンテーションのタイトル（オプション） |
| `options.outputPath` | `string` | 出力ファイルパス（オプション）             |

**返り値:** 生成されたHTML文字列

**例:**

```typescript
import { generateSlides } from "bundeck";

const markdown = `
# Hello World

This is my slide!

---

# Slide 2

Another slide here.
`;

const html = await generateSlides(markdown, {
  title: "My Presentation",
  theme: "dark",
});
```

### parseSlides

Markdownをパースして`Presentation`オブジェクトを生成します。

```typescript
async function parseSlides(markdown: string): Promise<Presentation>;
```

**パラメータ:**

| パラメータ | 型       | 説明                     |
| ---------- | -------- | ------------------------ |
| `markdown` | `string` | スライドのMarkdownソース |

**返り値:** `Presentation` オブジェクト

**例:**

```typescript
import { parseSlides } from "bundeck";

const presentation = await parseSlides("# Title\n\nContent...");
console.log(presentation.meta.title); // "Title"
console.log(presentation.slides.length); // スライド数
```

### generateHTML

既存の`Presentation`オブジェクトからHTMLを生成します。

```typescript
async function generateHTML(
  presentation: Presentation,
  options?: {
    theme?: string;
    title?: string;
  },
): Promise<string>;
```

### parseMarkdown

同期関数としてMarkdownをパースします（拡張機能含む）。

```typescript
function parseMarkdown(markdown: string): Presentation;
```

**例:**

```typescript
import { parseMarkdown } from "bundeck";

const result = parseMarkdown("# Hello\n\n---\n\n# World");
```

### splitTokensToSlides

Markedのトークン配列をスライト配列に変換します。

```typescript
function splitTokensToSlides(tokens: Token[]): Slide[];
```

---

## 型定義

### Presentation

プレゼンテーション全体を表すインターフェース

```typescript
interface Presentation {
  meta: PresentationMeta;
  slides: Slide[];
}
```

### PresentationMeta

プレゼンテーションのメタデータ

```typescript
interface PresentationMeta {
  title?: string;
  theme?: string;
  mode?: "light" | "dark" | "auto";
  aspectRatio?: string;
  fontSize?: "XS" | "S" | "M" | "L" | "XL";
  [key: string]: unknown; // その他のFrontmatter
}
```

### Slide

スライト1枚のデータ

```typescript
interface Slide {
  id: number;
  contentTokens: Token[]; // 聴衆用トークン
  noteTokens: Token[]; // スピーカーノート用トークン
  contentLength?: number; // コンテンツ量の指標
}
```

### CLIOptions

CLIオプション

```typescript
interface CLIOptions {
  outputPath?: string;
  autoOpen: boolean;
  help: boolean;
  minify?: boolean;
}
```

---

## CLI

### build

MarkdownファイルからHTMLを生成します。

```typescript
async function build(inputPath: string, options: CLIOptions): Promise<string>;
```

**パラメータ:**

| パラメータ  | 型           | 説明                       |
| ----------- | ------------ | -------------------------- |
| `inputPath` | `string`     | 入力Markdownファイルのパス |
| `options`   | `CLIOptions` | ビルドオプション           |

**オプション:**

| オプション            | 説明                   |
| --------------------- | ---------------------- |
| `-o, --output <path>` | 出力ファイルパス       |
| `--auto-open`         | 生成後にブラウザで開く |
| `--minify`            | HTMLとCSSを圧縮        |
| `-v, --version`       | バージョン表示         |
| `-h, --help`          | ヘルプ表示             |

### runCLI

CLIを実行します。

```typescript
async function runCLI(args: string[]): Promise<string>;
```

---

## 拡張機能

### カスタム拡張の使用

Bundeckは標準のMarkdown構文を拡張しています。

#### styledHeadingExtension

見出しにスタイルを適用

```typescript
# Heading {.center}
```

#### styledParagraphExtension

段落にスタイルを適用

```typescript
Paragraph text {.highlight}
```

#### styledSpanExtension

インライン要素にスタイルを適用

```typescript
Text with [highlight]{.mark} here
```

#### containerExtension

コンテナブロック（列、メモ等）

```markdown
::: columns
:::: col
Left
::::
:::: col
Right
::::
:::

::: speaker
Speaker notes
:::
```

#### styledImageExtension

画像にスタイルを適用

```markdown
![Caption](image.jpg){.cover}
```

---

## 使用例

### 基本的な使用方法

```typescript
import { generateSlides } from "bundeck";

const markdown = `
---
title: My Presentation
theme: dark
aspectRatio: 16/9
---

# Welcome

Welcome to my presentation!

---

# Agenda

- Topic 1
- Topic 2
- Topic 3
`;

const html = await generateSlides(markdown);
// htmlをファイルに保存
await Bun.write("presentation.html", html);
```

### 詳細な制御

```typescript
import { parseSlides, generateHTML } from "bundeck";

// パースのみ
const presentation = await parseSlides(markdown);

// スライドデータを操作
presentation.meta.title = "新しいタイトル";

// HTML生成
const html = await generateHTML(presentation, {
  theme: "custom",
});
```

### カスタムテーマの使用

```typescript
const html = await generateSlides(markdown, {
  theme: "my-custom-theme",
});
```

---

## ベンチマーク

Bundeckのパフォーマンス特性:

| シナリオ                         | 処理時間 |
| -------------------------------- | -------- |
| 5000文字のMarkdown (5スライト)   | < 100ms  |
| 15000文字のMarkdown (10スライト) | < 500ms  |
| 50スライト                       | < 1s     |
| 20スライトのHTML生成             | < 3s     |

これらの数値は通常のハードウェアでの測定結果です。實際のパフォーマンスはMarkdownの複雑さとファイルサイズによって異なります。

---

## エラーハンドリング

Bundeckはのエラーは色を付けてコンソールに表示されます:

```bash
# エラーメッセージの例
Error: 入力ファイルが見つかりません
→ File not found: presentation.md
💡 Hint: ファイルが存在するか確認してください
```

ランタイムエラーはログファイルに記録されます。ログファイルパスを設定するには:

```typescript
import { setLogFilePath } from "bundeck/cli/utils";

setLogFilePath("./error.log");
```

---

## トラブルシューティング

### ファイルが見つからない

```
Error: 入力ファイルが見つかりません
→ File not found: presentation.md
💡 Hint: ファイルが存在するか確認してください
```

**解決策:** ファイルパスを確認し、相対パスまたは絶対パスで指定してください。

### ビルドエラー

```
Error: ビルドに失敗しました
→ Failed to build client runtime
💡 Hint: 依存関係が正しいか確認してください
```

**解決策:** `bun install` を実行して依存関係をインストールしてください。

### 構文エラー

Markdownの構文を確認してください。特に拡張構文（`{.class}`、`:::`ブロック等）の使い方が正しいか確認してください。
