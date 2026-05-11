/**
 * スライドフォントサイズ自動調整システム
 *
 * このモジュールは、スライドのコンテンツ量に基づいて
 * 適切なfont-sizeを自動決定するシンプルなシステムを提供します。
 *
 * 設計原則：
 * - スライドは固定サイズ（1280px × 720px）で設計
 * - コンテンツ量に応じてフォントサイズを自動調整
 * - transform: scale() でビューポートに合わせて全体をリサイズ
 */

/** スライドの固定デザインサイズ */
export const SLIDE_SIZE = {
  width: 1280,
  height: 720,
  aspectRatio: "16:9",
} as const;

/** コンテンツ量に基づくフォントサイズカテゴリ */
export type ContentDensity = "sparse" | "normal" | "dense" | "very-dense";

/**
 * コンテンツ量に基づいてフォントサイズカテゴリを判定
 * @param contentLength - テキスト文字数
 * @returns コンテンツ密度
 */
export function getContentDensity(contentLength: number): ContentDensity {
  if (contentLength < 100) {
    return "sparse"; // タイトルのみなど
  } else if (contentLength < 300) {
    return "normal"; // 標準的な情報量
  } else if (contentLength < 600) {
    return "dense"; // 情報量が多い
  } else {
    return "very-dense"; // 非常に多い
  }
}

/**
 * コンテンツ密度に基づいてフォントサイズ（px）を決定
 * @param density - コンテンツ密度
 * @returns フォントサイズ（px単位）
 */
export function calculateFontSize(density: ContentDensity): number {
  // 各密度に対応する最適なフォントサイズ（px）
  const fontSizeMap: Record<ContentDensity, number> = {
    sparse: 32, // 大きめ（タイトルスライドなど）
    normal: 24, // 標準
    dense: 18, // 小さめ（情報量が多い）
    "very-dense": 14, // 最小（非常に多い情報）
  };
  return fontSizeMap[density];
}

/**
 * コンテンツ量から直接フォントサイズを計算してCSS属性を生成
 * @param contentLength - コンテンツの文字数
 * @returns CSSスタイル属性（例: "font-size: 24px"）
 */
export function getSlideFontSizeAttribute(contentLength: number): string {
  const density = getContentDensity(contentLength);
  const fontSize = calculateFontSize(density);
  return `font-size: ${fontSize}px`;
}

/**
 * コンテンツ密度の参考情報
 */
export const CONTENT_DENSITY_INFO = {
  ranges: {
    sparse: { min: 0, max: 100, description: "タイトルスライドなど" },
    normal: { min: 100, max: 300, description: "標準的な情報量" },
    dense: { min: 300, max: 600, description: "情報量が多い" },
    "very-dense": { min: 600, max: Infinity, description: "非常に多い情報" },
  },
} as const;
