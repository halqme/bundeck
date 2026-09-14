import type { Token } from "marked";
import type { Slide } from "../types/index.js";
import type { ContainerToken } from "./extensions/container.js";

/**
 * トークンの内容からテキストを抽出し、文字数を計算
 * （コンテンツ量の推定に使用）
 */
function calculateContentLength(tokens: Token[]): number {
  let length = 0;

  for (const token of tokens) {
    if (token.type === "text") {
      length += token.text?.length ?? 0;
    } else if (token.type === "paragraph") {
      if ("tokens" in token && Array.isArray(token.tokens)) {
        length += calculateContentLength(token.tokens);
      } else if ("text" in token) {
        length += token.text?.length ?? 0;
      }
    } else if (token.type === "heading") {
      if ("tokens" in token && Array.isArray(token.tokens)) {
        length += calculateContentLength(token.tokens);
      } else if ("text" in token) {
        length += token.text?.length ?? 0;
      }
    } else if (token.type === "list") {
      if ("items" in token && Array.isArray(token.items)) {
        for (const item of token.items) {
          if ("tokens" in item && Array.isArray(item.tokens)) {
            length += calculateContentLength(item.tokens);
          }
        }
      }
    } else if (token.type === "blockquote") {
      if ("tokens" in token && Array.isArray(token.tokens)) {
        length += calculateContentLength(token.tokens);
      }
    } else if (token.type === "code") {
      length += token.text?.length ?? 0;
    } else if ("tokens" in token && Array.isArray(token.tokens)) {
      length += calculateContentLength(token.tokens);
    }
  }

  return length;
}

export function splitTokensToSlides(tokens: Token[]): Slide[] {
  const slides: Slide[] = [];
  let currentSlideTokens: Token[] = [];
  let currentNoteTokens: Token[] = [];
  let slideIdCounter = 1;

  const pushSlide = () => {
    if (currentSlideTokens.length > 0 || currentNoteTokens.length > 0) {
      slides.push({
        id: slideIdCounter++,
        contentTokens: [...currentSlideTokens],
        noteTokens: [...currentNoteTokens],
        contentLength: calculateContentLength(currentSlideTokens),
      });
    }
    currentSlideTokens = [];
    currentNoteTokens = [];
  };

  for (const token of tokens) {
    if (token.type === "hr") {
      pushSlide();
    } else if (token.type === "container" && (token as ContainerToken).kind === "speaker") {
      const container = token as ContainerToken;
      currentNoteTokens.push(...container.tokens);
    } else {
      currentSlideTokens.push(token);
    }
  }

  // Push the last slide if any remains
  if (currentSlideTokens.length > 0 || currentNoteTokens.length > 0) {
    pushSlide();
  }

  return slides;
}
