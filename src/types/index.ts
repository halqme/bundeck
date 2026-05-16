import type { Token } from "marked";

/** プレゼンテーション全体 */
export interface Presentation {
  meta: PresentationMeta;
  slides: Slide[];
}

/** プレゼンテーションのメタデータ */
export interface PresentationMeta {
  title?: string;
  theme?: string;
  mode?: "light" | "dark" | "auto"; // ダークモード対応
  aspectRatio?: string;
  fontSize?: "XS" | "S" | "M" | "L" | "XL"; // フォントサイズプリセット
  [key: string]: unknown; // その他のFrontmatterも許容
}

/** スライド1枚のデータ */
export interface Slide {
  id: number;
  contentTokens: Token[]; // Markedの Token配列（聴衆用）
  noteTokens: Token[]; // MarkedのToken配列（ノート用）
  contentLength?: number; // コンテンツ量の指標（テキスト文字数などで推定）
}

// Sync message types
export type { SyncMessage } from "./sync";
