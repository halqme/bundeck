---
title: Bundeck 機能紹介
author: Bundeck 開発チーム
theme: default
aspectRatio: 16:9
fontSize: M
---

# Bundeck {.center}

**Zero-Config Slide Generator**
Markdownを書くだけで、美しいスライドを自動生成します。

::: .center 
[今すぐ始める]{.mark}
:::

::: speaker
スライドの冒頭です。
Bundeckは設定不要で使い始められるスライド作成ツールです。
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
::: .center
この段落は中央寄せです。
:::

::: .caption .right
この段落は右寄せのキャプションです。
:::

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

::: .caption
`{.fit}` で枠内に収め、`{.opacity 80}` で透明度を調整しています。
:::

---

## 🎭 背景画像 (Cover) {.overlay-dim}

![Cover Background](https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1920&q=80){.cover}

::: .overlay-dim
`{.cover}` クラスを使用すると、画像を背景として全画面表示します。
:::

# 背景付きスライド {.center .overlay-dim}

::: .center .overlay-dim
視覚的にインパクトのあるスライドも簡単に作成可能です。
:::

---

## 📝 スピーカーノート

`::: speaker` ブロックを使用すると、プレゼンターのみが見えるノートを作成できます。

- 発表時のカンペ
- 詳細な補足情報
- 非表示の指示事項

::: speaker
この内容はスライド本体には表示されません。
プレゼンターモードで確認できます。
:::

---

## 📅 テーブル表示

データの比較やリストも標準のMarkdownテーブルで記述できます。

| 機能 | Bundeck | 他のツール |
| :--- | :---: | :---: |
| 設定の手間 | ゼロ | 必要 |
| ビルド速度 | 爆速 | 普通 |
| 自由度 | 高い | 制限あり |

---

## 🏁 まとめ

Bundeckを使えば、デザインに悩む時間を減らし、 **「内容を伝えること」** に集中できます。

### 次のステップ
1. `bundeck my-slides.md` でビルド
2. `bundeck serve my-slides.md` でプレビュー

::: .center
[Happy Presenting!]{.mark}
:::