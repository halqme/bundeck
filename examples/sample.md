---
title: Slide Bun 機能紹介
author: Slide Bun 開発チーム
theme: default
aspectRatio: 16:9
fontSize: M
---

# Slide Bun {.center}

**Zero-Config Slide Generator**
Markdownを書くだけで、美しいスライドを自動生成します。

[今すぐ始める]{.mark} {.center}

::: speaker
スライドの冒頭です。
Slide Bunは設定不要で使い始められるスライド作成ツールです。
:::

---

## 🚀 主な特徴

- **Markdownベース**: 慣れ親しんだ記法でコンテンツを作成
- **自動レイアウト**: コンテンツ量に合わせてフォントサイズを自動調整
- **柔軟な拡張**: クラス指定やカラムレイアウトをサポート
- **高速ビルド**: Bunパワーによる高速なHTML生成

---

## 🎨 タイポグラフィとスタイル

標準的なMarkdownに加え、属性指定が可能です。

### インラインスタイル
特定の単語を [ハイライト]{.mark} したり、[アクセント]{.accent} をつけたりできます。

### 段落スタイル
この段落は中央寄せです。 {.center}

この段落は右寄せのキャプションです。 {.caption .right}

::: speaker
属性指定は `{.class}` の形式で行います。
:::

---

## 📊 2カラムレイアウト {.center}

`::: columns` コンテナを使用して、画面を分割できます。

::: columns
:::: col
### 左カラム
- 箇条書き
- コンテンツの整理
- 視覚的な分離
::::

:::: col
### 右カラム
```typescript
// コードもきれいに表示
const slide = new SlideBun();
slide.build("presentation.md");
```
::::
:::

---

## 🖼️ 画像の取り扱い {.center}

画像をスライドにフィットさせたり、フィルターを適用したりできます。

![Demo Image](https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=800&q=80){.fit .opacity 80}

`{.fit}` で枠内に収め、`{.opacity 80}` で透明度を調整しています。 {.caption}

---

## 🎭 背景画像 (Cover) {.overlay-dim}

`{.cover}` クラスを使用すると、画像を背景として全画面表示します。 {.overlay-dim}

![Cover Background](https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1920&q=80){.cover}

# 背景付きスライド {.center .overlay-dim}

視覚的にインパクトのあるスライドも簡単に作成可能です。 {.center .overlay-dim}

---

## 📝 スピーカーノート

`::: speaker` ブロックを使用すると、プレゼンターのみが見えるノートを作成できます。

- 発表時のカンペ
- 詳細な補足情報
- 非表示の指示事項

::: speaker
この内容はスライド本体には表示されません。
プレゼンターモード（開発中）で確認できるようになります。
:::

---

## 📅 テーブル表示

データの比較やリストも標準のMarkdownテーブルで記述できます。

| 機能 | Slide Bun | 他のツール |
| :--- | :---: | :---: |
| 設定の手間 | ゼロ | 必要 |
| ビルド速度 | 爆速 | 普通 |
| 自由度 | 高い | 制限あり |

---

## 🏁 まとめ

Slide Bunを使えば、デザインに悩む時間を減らし、
**「内容を伝えること」**に集中できます。

### 次のステップ
1. `slide-bun my-slides.md` でビルド
2. `slide-bun serve my-slides.md` でプレビュー

[Happy Presenting!]{.mark} {.center}