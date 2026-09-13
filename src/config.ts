import type { PresentationMeta } from "./types/index.js";

export const DEFAULT_PRESENTATION_CONFIG = {
  title: "Untitled Presentation",
  theme: "default",
  aspectRatio: "16:9",
  lang: "en",
} as const;

export type FontSizePreset = NonNullable<PresentationMeta["fontSize"]>;

export interface GenerateOptions {
  title?: string;
  theme?: string;
  mode?: PresentationMeta["mode"];
  aspectRatio?: string;
  fontSize?: FontSizePreset;
  lang?: string;
  outputPath?: string;
}

export type GenerateHTMLOptions = Omit<GenerateOptions, "outputPath">;

export function applyGenerateOptions(meta: PresentationMeta, options: GenerateOptions = {}): void {
  if (options.title !== undefined) meta.title = options.title;
  if (options.theme !== undefined) meta.theme = options.theme;
  if (options.mode !== undefined) meta.mode = options.mode;
  if (options.aspectRatio !== undefined) meta.aspectRatio = options.aspectRatio;
  if (options.fontSize !== undefined) meta.fontSize = options.fontSize;
  if (options.lang !== undefined) meta.lang = options.lang;
}
