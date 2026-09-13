# AGENTS.md

Bundeck の開発エージェント向けガイド。Bun と TypeScript で Markdown から HTML スライドを生成するプロジェクトです。

## 作業ルール

- プロジェクトに関する応答とドキュメントは日本語で書く。
- 変更前に `bun run check` を実行する。
- 変更後は `bun run check` と、変更箇所に関係するテストを実行する。
- `dist/` は生成物なので、原則として直接編集しない。
- 公開 API や Markdown 構文を変更するときは、実装・テスト・`docs/API.md` の内容をそろえる。
- コミットする場合は、変更内容が分かる簡潔なコミットメッセージにする。

## 開発コマンド

```bash
# 依存関係をインストール
bun install

# CLI をビルド
bun run build

# フォーマット、Lint、型チェック
bun run check

# 個別のチェック
bun run format
bun run format:check
bun run lint
bun run type-check

# テスト
bun test
bun test tests/parser.test.ts
```

## CLI の使い方

ビルド済み CLI または npm パッケージの CLI を使う。

```bash
# Markdown から静的 HTML を生成（既定では入力ファイルと同じ場所に .html を出力）
bundeck presentation.md

# 出力先を指定
bundeck presentation.md --output slides.html

# HTML/CSS を圧縮
bundeck presentation.md --minify

# 生成後にブラウザで開く
bundeck presentation.md --auto-open

# 開発サーバー（HMR 対応）
bundeck serve presentation.md
bundeck serve presentation.md --port 8080
```

ローカルで実行する場合は、ビルド後に `bun run dist/cli.js` を使う。

## プレゼンテーションの Markdown

先頭に YAML frontmatter を置ける。主な項目は `title`、`theme`、`mode`、`aspectRatio`、`fontSize` で、その他の項目もメタデータとして保持される。

```markdown
---
title: My Presentation
theme: default
aspectRatio: 16:9
fontSize: M
---

# Slide 1

Content...

---

# Slide 2

More content...
```

組み込みの拡張構文は次のとおり。

- `---`：スライドを分割する。
- `::: speaker ... :::`：聴衆には表示しないスピーカーノートを付ける。
- `::: columns ... :::`：カラムレイアウトを作る。
- `{.class-name}`：見出し、インライン要素、画像などに CSS クラスを付ける。

API の詳細は [`docs/API.md`](docs/API.md) を参照する。

## アーキテクチャ

- **`src/cli.ts`**：Bun から起動される CLI エントリーポイント。
- **`src/cli/`**：引数処理、静的ビルド、CLI の表示・エラー処理。
- **`src/core/parser.ts`**：frontmatter を取り出し、`marked` で Markdown をトークン化する。
- **`src/core/splitter.ts`**：トークン列を `Presentation` と `Slide[]` に分割し、本文とノートを分離する。
- **`src/core/extensions/`**：見出し、インライン要素、画像、コンテナの Markdown 拡張。
- **`src/core/layout-design.ts`**：コンテンツ量に応じたスライドのレイアウト調整。
- **`src/template/renderer.ts`**：スライド、CSS、ランタイムから HTML を組み立てる。
- **`src/template/styles.ts`**：テーマと CSS アセットの対応を定義する。
- **`src/styles/`**：共通 CSS、印刷用 CSS、view UI、`default` / `dark` テーマ。
- **`src/client/runtime-view.ts`**：静的 HTML 用の view runtime エントリーポイント。
- **`src/client/runtime-server.ts`**：開発サーバー用の view / presenter runtime。
- **`src/client/core/`**：スライド移動、ハッシュルーティング、ビューポート調整、view UI、座標計算。
- **`src/client/presenter/`**：プレゼンター画面、タイマー、ノート、レーザーポインター。
- **`src/server/index.ts`**：Markdown の監視、HMR、HTML とアセットの配信。
- **`src/server/generator.ts`**：サーバー用ランタイムをバンドルして HTML を生成する。
- **`src/types/`**：`Presentation`、`Slide`、同期メッセージなどの共有型。
- **`tests/`**：CLI、パーサー、拡張、ランタイム関連のテスト。

### 生成フロー

```text
Markdown
  → MarkdownParser（frontmatter + marked）
  → splitTokensToSlides
  → Presentation
  → HTMLRenderer + クライアント runtime
  → HTML
```

view mode は `runtime-view.ts` と `src/client/core/` を使う。serve mode は `/` を view mode、`/presenter` を presenter mode として配信し、`BroadcastChannel` でスライド位置とレーザーポインターを同期する。

## 変更時の指針

- 新しい Markdown 構文は `src/core/extensions/` に実装し、`src/core/extensions/index.ts` と parser / renderer の登録を確認する。
- frontmatter の項目を増やすときは `src/core/parser.ts` と共有型、HTML 生成側の扱いを確認する。
- view と presenter の両方に関係するランタイム変更は、まず `src/client/core/` に共通化できるか検討する。
- スライド表示領域や presenter からの座標変換は `src/client/core/geometry.ts` に集約する。
- UI やランタイムを変更したら、該当テストに加えて必要なら `bun run build` で実際のバンドルも確認する。
