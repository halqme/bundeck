/**
 * アスペクト比関連のユーティリティ関数
 */
import { consoleWarn } from "../cli/utils";

export interface AspectRatioDimensions {
  width: number;
  height: number;
}

export interface ParsedAspectRatio {
  ratio: string;
  width: number;
  height: number;
}

/**
 * デフォルトのベースサイズ（16:9 = 1280x720）
 */
const DEFAULT_BASE_WIDTH = 1280;
const DEFAULT_BASE_HEIGHT = 720;

/**
 * アスペクト比文字列をパースして寸法を計算する
 *
 * @param aspectRatio - アスペクト比文字列（例: "16:9", "4:3", "1:1"）
 * @param baseWidth - 基準幅（デフォルト: 1280）
 * @returns 計算された寸法
 */
export function parseAspectRatio(
  aspectRatio?: string,
  _baseWidth: number = DEFAULT_BASE_WIDTH,
): AspectRatioDimensions {
  if (!aspectRatio) {
    // デフォルトは16:9
    return { width: DEFAULT_BASE_WIDTH, height: DEFAULT_BASE_HEIGHT };
  }

  // "16:9" 形式をパース
  const parts = aspectRatio.split(":");
  if (parts.length !== 2) {
    consoleWarn(`Invalid aspect ratio format: ${aspectRatio || "undefined"}, using default 16:9`);
    return { width: DEFAULT_BASE_WIDTH, height: DEFAULT_BASE_HEIGHT };
  }

  const widthRatio = parseFloat(parts[0] || "");
  const heightRatio = parseFloat(parts[1] || "");

  if (isNaN(widthRatio) || isNaN(heightRatio) || widthRatio <= 0 || heightRatio <= 0) {
    consoleWarn(`Invalid aspect ratio values: ${aspectRatio || "undefined"}, using default 16:9`);
    return { width: DEFAULT_BASE_WIDTH, height: DEFAULT_BASE_HEIGHT };
  }

  // 高さを基準に幅を計算（16:9の720px高さを基準）
  const height = DEFAULT_BASE_HEIGHT;
  const width = (height * widthRatio) / heightRatio;

  return { width: Math.round(width), height };
}

/**
 * アスペクト比文字列をパースして詳細情報を返す
 *
 * @param aspectRatio - アスペクト比文字列
 * @returns パース結果
 */
export function parseAspectRatioDetailed(aspectRatio?: string): ParsedAspectRatio {
  const dimensions = parseAspectRatio(aspectRatio || "");

  return {
    ratio: aspectRatio || "16:9",
    width: dimensions.width,
    height: dimensions.height,
  };
}

/**
 * よく使われるアスペクト比の定義
 */
export const PRESET_ASPECT_RATIOS = {
  "16:9": { width: 1280, height: 720 },
  "4:3": { width: 1024, height: 768 },
  "1:1": { width: 720, height: 720 },
  "21:9": { width: 1680, height: 720 },
  "3:2": { width: 1080, height: 720 },
} as const;

/**
 * プリセットアスペクト比か判定する
 *
 * @param aspectRatio - アスペクト比文字列
 * @returns プリセットの場合はtrue
 */
export function isPresetAspectRatio(
  aspectRatio?: string,
): aspectRatio is keyof typeof PRESET_ASPECT_RATIOS {
  return !!aspectRatio && aspectRatio in PRESET_ASPECT_RATIOS;
}

/**
 * アスペクト比からCSS変数の値を生成する
 *
 * @param aspectRatio - アスペクト比文字列
 * @returns CSS変数オブジェクト
 */
export function generateAspectRatioCSSVariables(aspectRatio?: string): {
  "--slide-width": string;
  "--slide-height": string;
} {
  const dimensions = parseAspectRatio(aspectRatio || "");

  return {
    "--slide-width": `${dimensions.width}px`,
    "--slide-height": `${dimensions.height}px`,
  };
}
